import bcrypt from "bcryptjs";
import { cookies } from "next/headers";
import { verifyJWT } from "./jwt";
import { redirect } from "next/navigation";
import { getArtistCredentialsByEmail, getArtistWithRole } from "./data/auth";

export async function getSession() {
  const cookieStore = await cookies();
  const token = cookieStore.get("dg_session_token")?.value;

  if (!token) return null;

  try {
    const payload = await verifyJWT(token);

    if (!payload) return;

    return payload;
  } catch {
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

  const artist = await getArtistWithRole(session.sub);

  if (!artist) return;

  return artist;
}

export async function requireArtist() {
  const artist = await getArtist();

  if (!artist) return;

  return artist;
}

export async function requireAnonymous() {
  const session = await getSession();

  if (session) {
    redirect("/feed");
  }
}

export async function getPasswordHash(password: string) {
  const hash = await bcrypt.hash(password, 10);
  return hash;
}

export async function verifyPassword(email: string, password: string) {
  const artist = await getArtistCredentialsByEmail(email);

  if (!artist || !artist.password.hash) return null;

  const isValid = await bcrypt.compare(password, artist.password.hash);

  if (!isValid) return null;

  return { id: artist.id, role: artist.role.name };
}
