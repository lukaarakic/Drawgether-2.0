import bcrypt from "bcryptjs";
import prisma from "./db";
import { cookies } from "next/headers";
import { verifyJWT } from "./jwt";
import { redirect } from "next/navigation";

export async function getSession() {
  const cookieStore = await cookies();
  const token = cookieStore.get("dg_session_token")?.value;

  if (!token) return null;

  try {
    const payload = await verifyJWT(token);

    if (!payload) logout();

    return payload;
  } catch (error) {
    return null;
  }
}

export async function getArtistId() {
  const session = await getSession();

  if (!session) redirect("/login");

  return { artistId: session.sub, role: session.role };
}

export async function getArtist() {
  const session = await getSession();

  if (!session) return null;

  const artist = await prisma.artist.findUnique({
    where: { id: session.sub },
    select: { id: true, username: true, email: true, emailVerified: true },
  });

  if (!artist) return logout();

  return artist;
}

export async function requireArtist() {
  const artist = await getArtist();

  if (!artist) return logout();

  return artist;
}

export async function requireAnonymous() {
  const session = await getSession();

  if (session) {
    redirect("/feed");
  }
}

export async function logout() {
  const cookieStore = await cookies();
  cookieStore.delete("dg_session_token");

  redirect("/login");
}

export async function getPasswordHash(password: string) {
  const hash = await bcrypt.hash(password, 10);
  return hash;
}

export async function verifyPassword(email: string, password: string) {
  const artist = await prisma.artist.findUnique({
    where: { email },
    select: {
      id: true,
      role: { select: { name: true } },
      password: { select: { hash: true } },
    },
  });

  if (!artist || !artist.password) return null;

  const isValid = await bcrypt.compare(password, artist.password.hash);

  if (!isValid) return null;

  return { id: artist.id, role: artist.role.name };
}
