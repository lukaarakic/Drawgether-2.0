import bcrypt from "bcryptjs";
import { cookies } from "next/headers";
import { verifyJWT } from "./jwt";
import { redirect } from "next/navigation";
import { db } from "./db";

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

  const artist = await db.query.artists.findFirst({
    where: (artist, { eq }) => eq(artist.id, session.sub),
    columns: {
      id: true,
      username: true,
      email: true,
      emailVerified: true,
    },
    with: {
      role: {
        columns: {
          name: true,
        },
      },
    },
  });

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
  const artist = await db.query.artists.findFirst({
    where: (artist, { eq }) => eq(artist.email, email),
    columns: {
      id: true,
    },
    with: {
      password: {
        columns: {
          hash: true,
        },
      },
      role: {
        columns: {
          name: true,
        },
      },
    },
  });

  if (!artist || !artist.password.hash) return null;

  const isValid = await bcrypt.compare(password, artist.password.hash);

  if (!isValid) return null;

  return { id: artist.id, role: artist.role.name };
}
