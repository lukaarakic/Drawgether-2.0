import { ID, Query } from "node-appwrite";
import { createId } from "@paralleldrive/cuid2";
import { tablesDB, APPWRITE_DATABASE_ID } from "../appwrite";
import { AuthTokenType } from "@/drizzle/types";
import { TABLES } from "./tables";

async function findArtistRowByField(field: "email" | "username", value: string) {
  const { rows } = await tablesDB.listRows({
    databaseId: APPWRITE_DATABASE_ID,
    tableId: TABLES.artists,
    queries: [Query.equal(field, value), Query.limit(1)],
  });
  return rows[0];
}

export async function getArtistWithRole(artistId: string) {
  let artist;
  try {
    artist = await tablesDB.getRow({
      databaseId: APPWRITE_DATABASE_ID,
      tableId: TABLES.artists,
      rowId: artistId,
    });
  } catch {
    return undefined;
  }

  const role = await tablesDB.getRow({
    databaseId: APPWRITE_DATABASE_ID,
    tableId: TABLES.roles,
    rowId: artist.roleId,
  });

  return {
    id: artist.$id,
    username: artist.username as string,
    email: artist.email as string,
    emailVerified: artist.emailVerified
      ? new Date(artist.emailVerified as string)
      : null,
    role: { name: role.name as string },
  };
}

export async function getArtistCredentialsByEmail(email: string) {
  const artist = await findArtistRowByField("email", email);
  if (!artist) return undefined;

  const [{ rows: passwordRows }, role] = await Promise.all([
    tablesDB.listRows({
      databaseId: APPWRITE_DATABASE_ID,
      tableId: TABLES.passwords,
      queries: [Query.equal("artistId", artist.$id), Query.limit(1)],
    }),
    tablesDB.getRow({
      databaseId: APPWRITE_DATABASE_ID,
      tableId: TABLES.roles,
      rowId: artist.roleId,
    }),
  ]);

  return {
    id: artist.$id as string,
    password: { hash: (passwordRows[0]?.hash as string) ?? "" },
    role: { name: role.name as string },
  };
}

export async function findArtistByEmailOrUsername(identifier: string) {
  const { rows } = await tablesDB.listRows({
    databaseId: APPWRITE_DATABASE_ID,
    tableId: TABLES.artists,
    queries: [
      Query.or([Query.equal("email", identifier), Query.equal("username", identifier)]),
      Query.limit(1),
    ],
  });

  const artist = rows[0];
  if (!artist) return undefined;

  return {
    id: artist.$id as string,
    email: artist.email as string,
    username: artist.username as string,
  };
}

export async function getRoleByName(name: string) {
  const { rows } = await tablesDB.listRows({
    databaseId: APPWRITE_DATABASE_ID,
    tableId: TABLES.roles,
    queries: [Query.equal("name", name), Query.limit(1)],
  });

  const role = rows[0];
  if (!role) return undefined;

  return { id: role.$id as string, name: role.name as string };
}

export async function checkArtistAvailability({
  username,
  email,
}: {
  username: string;
  email: string;
}) {
  const [existingUsername, existingEmail] = await Promise.all([
    findArtistRowByField("username", username),
    findArtistRowByField("email", email),
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
  const artistId = createId();

  await tablesDB.createRow({
    databaseId: APPWRITE_DATABASE_ID,
    tableId: TABLES.artists,
    rowId: artistId,
    data: { username, email, roleId, avatar },
  });

  await tablesDB.createRow({
    databaseId: APPWRITE_DATABASE_ID,
    tableId: TABLES.passwords,
    rowId: createId(),
    data: { artistId, hash: passwordHash },
  });

  return { id: artistId };
}

export async function updateArtistPasswordHash(artistId: string, hash: string) {
  const { rows } = await tablesDB.listRows({
    databaseId: APPWRITE_DATABASE_ID,
    tableId: TABLES.passwords,
    queries: [Query.equal("artistId", artistId), Query.limit(1)],
  });

  const passwordRow = rows[0];
  if (!passwordRow) return null;

  await tablesDB.updateRow({
    databaseId: APPWRITE_DATABASE_ID,
    tableId: TABLES.passwords,
    rowId: passwordRow.$id,
    data: { hash },
  });

  return { id: artistId };
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
  const { rows } = await tablesDB.listRows({
    databaseId: APPWRITE_DATABASE_ID,
    tableId: TABLES.verificationTokens,
    queries: [Query.equal("target", target), Query.equal("type", type), Query.limit(1)],
  });

  const data = { token, secret, expiresAt: expiresAt.toISOString() };
  const existing = rows[0];

  if (existing) {
    await tablesDB.updateRow({
      databaseId: APPWRITE_DATABASE_ID,
      tableId: TABLES.verificationTokens,
      rowId: existing.$id,
      data,
    });
    return;
  }

  await tablesDB.createRow({
    databaseId: APPWRITE_DATABASE_ID,
    tableId: TABLES.verificationTokens,
    rowId: ID.unique(),
    data: { target, type, ...data },
  });
}

export async function findVerificationToken(
  target: string,
  type: (typeof AuthTokenType)[keyof typeof AuthTokenType],
) {
  const { rows } = await tablesDB.listRows({
    databaseId: APPWRITE_DATABASE_ID,
    tableId: TABLES.verificationTokens,
    queries: [Query.equal("target", target), Query.equal("type", type), Query.limit(1)],
  });

  const row = rows[0];
  if (!row) return undefined;

  return {
    id: row.$id as string,
    target: row.target as string,
    type: row.type as string,
    token: row.token as string,
    secret: row.secret as string,
    expiresAt: new Date(row.expiresAt as string),
  };
}

export async function deleteVerificationToken(id: string) {
  await tablesDB.deleteRow({
    databaseId: APPWRITE_DATABASE_ID,
    tableId: TABLES.verificationTokens,
    rowId: id,
  });
}
