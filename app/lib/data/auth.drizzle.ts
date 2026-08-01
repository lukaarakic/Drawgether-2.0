import { db } from "../db";
import { artists, passwords, verificationTokens } from "@/drizzle/schema";
import { AuthTokenType } from "@/drizzle/types";
import { eq } from "drizzle-orm";

export async function getArtistWithRole(artistId: string) {
  return db.query.artists.findFirst({
    where: (artist, { eq }) => eq(artist.id, artistId),
    columns: {
      id: true,
      username: true,
      email: true,
      emailVerified: true,
    },
    with: {
      role: { columns: { name: true } },
    },
  });
}

export async function getArtistCredentialsByEmail(email: string) {
  return db.query.artists.findFirst({
    where: (artist, { eq }) => eq(artist.email, email),
    columns: { id: true },
    with: {
      password: { columns: { hash: true } },
      role: { columns: { name: true } },
    },
  });
}

export async function findArtistByEmailOrUsername(identifier: string) {
  return db.query.artists.findFirst({
    where: (artist, { eq, or }) =>
      or(eq(artist.email, identifier), eq(artist.username, identifier)),
    columns: { id: true, email: true, username: true },
  });
}

export async function getRoleByName(name: string) {
  return db.query.roles.findFirst({
    where: (role, { eq }) => eq(role.name, name),
    columns: { id: true, name: true },
  });
}

export async function checkArtistAvailability({
  username,
  email,
}: {
  username: string;
  email: string;
}) {
  const [existingUsername, existingEmail] = await Promise.all([
    db.query.artists.findFirst({
      where: (artist, { eq }) => eq(artist.username, username),
      columns: { id: true },
    }),
    db.query.artists.findFirst({
      where: (artist, { eq }) => eq(artist.email, email),
      columns: { id: true },
    }),
  ]);

  return {
    usernameTaken: !!existingUsername,
    emailTaken: !!existingEmail,
  };
}

export async function createArtistAccount({
  username,
  email,
  roleId,
  avatar,
  passwordHash,
}: {
  username: string;
  email: string;
  roleId: string;
  avatar: string;
  passwordHash: string;
}) {
  const [createdArtist] = await db
    .insert(artists)
    .values({ username, email, roleId, avatar })
    .returning({ id: artists.id });

  await db.insert(passwords).values({
    artistId: createdArtist.id,
    hash: passwordHash,
  });

  return createdArtist;
}

export async function updateArtistPasswordHash(artistId: string, hash: string) {
  return db
    .update(passwords)
    .set({ hash })
    .where(
      eq(
        passwords.artistId,
        db
          .select({ id: artists.id })
          .from(artists)
          .where(eq(passwords.artistId, artistId))
          .limit(1),
      ),
    )
    .returning({ id: passwords.artistId });
}

export async function upsertVerificationToken({
  target,
  type,
  token,
  secret,
  expiresAt,
}: {
  target: string;
  type: (typeof AuthTokenType)[keyof typeof AuthTokenType];
  token: string;
  secret: string;
  expiresAt: Date;
}) {
  await db
    .insert(verificationTokens)
    .values({ target, type, token, secret, expiresAt })
    .onConflictDoUpdate({
      target: [verificationTokens.target, verificationTokens.type],
      set: { token, secret, expiresAt },
    });
}

export async function findVerificationToken(
  target: string,
  type: (typeof AuthTokenType)[keyof typeof AuthTokenType],
) {
  return db.query.verificationTokens.findFirst({
    where: (row, { eq, and }) => and(eq(row.target, target), eq(row.type, type)),
  });
}

export async function deleteVerificationToken(id: string) {
  await db.delete(verificationTokens).where(eq(verificationTokens.id, id));
}
