import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

import { AppwriteException, ID, Query } from "node-appwrite";
import { TABLES } from "@/app/lib/data/tables";

// Loaded dynamically (after dotenv.config() above has run) rather than as
// static imports: static imports get hoisted above this file's own
// top-level code, so app/lib/db.ts and app/lib/appwrite.ts would read
// process.env before dotenv had a chance to populate it.
let db: typeof import("@/app/lib/db").db;
let schema: typeof import("@/drizzle/schema");
let tablesDB: typeof import("@/app/lib/appwrite").tablesDB;
let APPWRITE_DATABASE_ID: string;

async function loadModules() {
  ({ db } = await import("@/app/lib/db"));
  schema = await import("@/drizzle/schema");
  ({ tablesDB, APPWRITE_DATABASE_ID } = await import("@/app/lib/appwrite"));
}

// Strip null/undefined so optional Appwrite columns fall back to their
// defaults instead of being explicitly written as null.
function compact(data: Record<string, unknown>): Record<string, unknown> {
  return Object.fromEntries(
    Object.entries(data).filter(([, value]) => value !== null && value !== undefined),
  );
}

function isoOrNull(value: Date | null | undefined): string | null {
  return value ? value.toISOString() : null;
}

async function migrateDirectIdTable<T extends Record<string, unknown>>(
  tableId: string,
  rows: T[],
  rowIdField: keyof T,
  toData: (row: T) => Record<string, unknown>,
) {
  let created = 0;
  let skipped = 0;

  for (const row of rows) {
    try {
      await tablesDB.createRow({
        databaseId: APPWRITE_DATABASE_ID,
        tableId,
        rowId: row[rowIdField] as string,
        data: compact(toData(row)),
      });
      created++;
    } catch (err) {
      if (err instanceof AppwriteException && err.code === 409) {
        skipped++;
      } else {
        throw err;
      }
    }
  }

  console.log(`  ${tableId}: created ${created}, skipped ${skipped} (already existed)`);
}

// For junction tables with no own id column (composite PK in Postgres).
// Existence is checked by the natural key columns instead of a rowId.
async function migrateJunctionTable<T extends Record<string, unknown>>(
  tableId: string,
  rows: T[],
  matchColumns: (keyof T & string)[],
  toData: (row: T) => Record<string, unknown>,
) {
  let created = 0;
  let skipped = 0;

  for (const row of rows) {
    const { total } = await tablesDB.listRows({
      databaseId: APPWRITE_DATABASE_ID,
      tableId,
      queries: [
        ...matchColumns.map((col) => Query.equal(col, row[col] as string)),
        Query.limit(1),
      ],
    });

    if (total > 0) {
      skipped++;
      continue;
    }

    await tablesDB.createRow({
      databaseId: APPWRITE_DATABASE_ID,
      tableId,
      rowId: ID.unique(),
      data: compact(toData(row)),
    });
    created++;
  }

  console.log(`  ${tableId}: created ${created}, skipped ${skipped} (already existed)`);
}

async function main() {
  await loadModules();

  console.log("Reading from Postgres...");
  const [
    rolesRows,
    permissionsRows,
    rolesPermissionsRows,
    artistsRows,
    roomsRows,
    passwordsRows,
    verificationTokensRows,
    artworksRows,
    artistsArtworksRows,
    commentsRows,
    likesRows,
    followsRows,
  ] = await Promise.all([
    db.select().from(schema.roles),
    db.select().from(schema.permissions),
    db.select().from(schema.rolesPermissions),
    db.select().from(schema.artists),
    db.select().from(schema.rooms),
    db.select().from(schema.passwords),
    db.select().from(schema.verificationTokens),
    db.select().from(schema.artworks),
    db.select().from(schema.artistsArtworks),
    db.select().from(schema.comments),
    db.select().from(schema.likes),
    db.select().from(schema.follows),
  ]);

  console.log(
    `  roles=${rolesRows.length} permissions=${permissionsRows.length} rolesPermissions=${rolesPermissionsRows.length}`,
  );
  console.log(
    `  artists=${artistsRows.length} rooms=${roomsRows.length} passwords=${passwordsRows.length}`,
  );
  console.log(
    `  verificationTokens=${verificationTokensRows.length} artworks=${artworksRows.length} artistsArtworks=${artistsArtworksRows.length}`,
  );
  console.log(`  comments=${commentsRows.length} likes=${likesRows.length} follows=${followsRows.length}`);

  console.log("\nMigrating to Appwrite (order matters: referenced rows before referencing rows)...");

  await migrateDirectIdTable(TABLES.roles, rolesRows, "id", (r) => ({
    name: r.name,
  }));

  await migrateDirectIdTable(TABLES.permissions, permissionsRows, "id", (r) => ({
    action: r.action,
    entity: r.entity,
    access: r.access,
  }));

  await migrateJunctionTable(
    TABLES.rolesPermissions,
    rolesPermissionsRows,
    ["roleId", "permissionId"],
    (r) => ({ roleId: r.roleId, permissionId: r.permissionId }),
  );

  await migrateDirectIdTable(TABLES.artists, artistsRows, "id", (r) => ({
    username: r.username,
    email: r.email,
    emailVerified: isoOrNull(r.emailVerified),
    avatar: r.avatar,
    followerCount: r.followerCount,
    followingCount: r.followingCount,
    artworksCount: r.artworksCount,
    roleId: r.roleId,
    roomId: r.roomId,
  }));

  await migrateDirectIdTable(TABLES.rooms, roomsRows, "id", (r) => ({
    introMessage: r.introMessage,
    theme: r.theme,
    status: r.status,
    code: r.code,
    startsAt: isoOrNull(r.startsAt),
    startingExpiresAt: isoOrNull(r.startingExpiresAt),
    expiresAt: isoOrNull(r.expiresAt),
    ownerId: r.ownerId,
  }));

  await migrateDirectIdTable(TABLES.passwords, passwordsRows, "artistId", (r) => ({
    hash: r.hash,
    artistId: r.artistId,
  }));

  await migrateDirectIdTable(TABLES.verificationTokens, verificationTokensRows, "id", (r) => ({
    target: r.target,
    type: r.type,
    token: r.token,
    secret: r.secret,
    expiresAt: r.expiresAt.toISOString(),
  }));

  await migrateDirectIdTable(TABLES.artworks, artworksRows, "id", (r) => ({
    theme: r.theme,
    artworkImage: r.artworkImage,
    likesCount: r.likesCount,
    commentsCount: r.commentsCount,
    roomId: r.roomId,
  }));

  await migrateJunctionTable(
    TABLES.artistsArtworks,
    artistsArtworksRows,
    ["artistId", "artworkId"],
    (r) => ({ artistId: r.artistId, artworkId: r.artworkId }),
  );

  await migrateDirectIdTable(TABLES.comments, commentsRows, "id", (r) => ({
    content: r.content,
    artistId: r.artistId,
    artworkId: r.artworkId,
  }));

  await migrateJunctionTable(TABLES.likes, likesRows, ["artistId", "artworkId"], (r) => ({
    artistId: r.artistId,
    artworkId: r.artworkId,
  }));

  await migrateJunctionTable(
    TABLES.follows,
    followsRows,
    ["followerId", "followingId"],
    (r) => ({ followerId: r.followerId, followingId: r.followingId }),
  );

  console.log("\nVerifying row counts (Postgres vs Appwrite)...");
  const expectedCounts: [string, number][] = [
    [TABLES.roles, rolesRows.length],
    [TABLES.permissions, permissionsRows.length],
    [TABLES.rolesPermissions, rolesPermissionsRows.length],
    [TABLES.artists, artistsRows.length],
    [TABLES.rooms, roomsRows.length],
    [TABLES.passwords, passwordsRows.length],
    [TABLES.verificationTokens, verificationTokensRows.length],
    [TABLES.artworks, artworksRows.length],
    [TABLES.artistsArtworks, artistsArtworksRows.length],
    [TABLES.comments, commentsRows.length],
    [TABLES.likes, likesRows.length],
    [TABLES.follows, followsRows.length],
  ];

  let allMatch = true;
  for (const [tableId, expected] of expectedCounts) {
    const { total } = await tablesDB.listRows({
      databaseId: APPWRITE_DATABASE_ID,
      tableId,
      queries: [Query.limit(1)],
    });
    const ok = total === expected;
    if (!ok) allMatch = false;
    console.log(
      `  ${tableId}: postgres=${expected} appwrite=${total} ${ok ? "OK" : "MISMATCH"}`,
    );
  }

  console.log(allMatch ? "\nAll row counts match." : "\nSome row counts do not match — review before cutover.");
  process.exit(allMatch ? 0 : 1);
}

main().catch((err) => {
  console.error("Migration failed:", err);
  process.exit(1);
});
