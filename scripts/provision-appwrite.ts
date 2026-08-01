import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

import {
  AppwriteException,
  Client,
  TablesDB,
  Storage,
  Role,
  Permission,
  TablesDBIndexType,
} from "node-appwrite";

const DATABASE_ID = process.env.APPWRITE_DATABASE_ID ?? "drawgether";
const ARTWORKS_BUCKET_ID = "artworks";
const COLUMN_READY_TIMEOUT_MS = 30000;
const COLUMN_POLL_INTERVAL_MS = 750;

const client = new Client()
  .setEndpoint(process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT!)
  .setProject(process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID!)
  .setKey(process.env.APPWRITE_API_KEY!);

const tablesDB = new TablesDB(client);
const storage = new Storage(client);

async function ignoreConflict<T>(label: string, fn: () => Promise<T>) {
  try {
    const result = await fn();
    console.log(`  created: ${label}`);
    return result;
  } catch (err) {
    if (err instanceof AppwriteException && err.code === 409) {
      console.log(`  exists:  ${label}`);
      return null;
    }
    throw err;
  }
}

async function waitForColumns(tableId: string, keys: string[]) {
  const deadline = Date.now() + COLUMN_READY_TIMEOUT_MS;

  while (Date.now() < deadline) {
    const { columns } = await tablesDB.listColumns({
      databaseId: DATABASE_ID,
      tableId,
    });

    const byKey = new Map(columns.map((c) => [(c as { key: string }).key, c]));
    const allReady = keys.every((key) => {
      const column = byKey.get(key) as { status?: string } | undefined;
      return column?.status === "available";
    });

    if (allReady) return;
    await new Promise((r) => setTimeout(r, COLUMN_POLL_INTERVAL_MS));
  }

  throw new Error(
    `Timed out waiting for columns [${keys.join(", ")}] on table "${tableId}" to become available`,
  );
}

type StringColumnSpec = {
  kind: "string";
  key: string;
  size: number;
  required: boolean;
  xdefault?: string;
};
type EmailColumnSpec = {
  kind: "email";
  key: string;
  required: boolean;
};
type IntegerColumnSpec = {
  kind: "integer";
  key: string;
  required: boolean;
  xdefault?: number;
};
type DatetimeColumnSpec = {
  kind: "datetime";
  key: string;
  required: boolean;
};
type EnumColumnSpec = {
  kind: "enum";
  key: string;
  elements: string[];
  required: boolean;
  xdefault?: string;
};
type ColumnSpec =
  | StringColumnSpec
  | EmailColumnSpec
  | IntegerColumnSpec
  | DatetimeColumnSpec
  | EnumColumnSpec;

type IndexSpec = {
  key: string;
  type: TablesDBIndexType;
  columns: string[];
};

async function createColumn(tableId: string, spec: ColumnSpec) {
  const label = `${tableId}.${spec.key} (${spec.kind})`;

  switch (spec.kind) {
    case "string":
      return ignoreConflict(label, () =>
        tablesDB.createStringColumn({
          databaseId: DATABASE_ID,
          tableId,
          key: spec.key,
          size: spec.size,
          required: spec.required,
          xdefault: spec.xdefault,
        }),
      );
    case "email":
      return ignoreConflict(label, () =>
        tablesDB.createEmailColumn({
          databaseId: DATABASE_ID,
          tableId,
          key: spec.key,
          required: spec.required,
        }),
      );
    case "integer":
      return ignoreConflict(label, () =>
        tablesDB.createIntegerColumn({
          databaseId: DATABASE_ID,
          tableId,
          key: spec.key,
          required: spec.required,
          xdefault: spec.xdefault,
        }),
      );
    case "datetime":
      return ignoreConflict(label, () =>
        tablesDB.createDatetimeColumn({
          databaseId: DATABASE_ID,
          tableId,
          key: spec.key,
          required: spec.required,
        }),
      );
    case "enum":
      return ignoreConflict(label, () =>
        tablesDB.createEnumColumn({
          databaseId: DATABASE_ID,
          tableId,
          key: spec.key,
          elements: spec.elements,
          required: spec.required,
          xdefault: spec.xdefault,
        }),
      );
  }
}

async function createTable(
  tableId: string,
  name: string,
  columns: ColumnSpec[],
  indexes: IndexSpec[],
) {
  console.log(`\nTable: ${tableId}`);

  await ignoreConflict(tableId, () =>
    tablesDB.createTable({
      databaseId: DATABASE_ID,
      tableId,
      name,
      // No end-user access; everything goes through the server API key.
      permissions: [],
      rowSecurity: false,
    }),
  );

  for (const column of columns) {
    await createColumn(tableId, column);
  }

  await waitForColumns(
    tableId,
    columns.map((c) => c.key),
  );

  for (const index of indexes) {
    await ignoreConflict(`${tableId}#${index.key}`, () =>
      tablesDB.createIndex({
        databaseId: DATABASE_ID,
        tableId,
        key: index.key,
        type: index.type,
        columns: index.columns,
      }),
    );
  }
}

const REF_ID_SIZE = 36;

async function main() {
  console.log(`Provisioning Appwrite database "${DATABASE_ID}"...`);

  await ignoreConflict(DATABASE_ID, () =>
    tablesDB.create({ databaseId: DATABASE_ID, name: "drawgether" }),
  );

  await createTable(
    "roles",
    "roles",
    [{ kind: "string", key: "name", size: 50, required: true }],
    [{ key: "name_unique", type: TablesDBIndexType.Unique, columns: ["name"] }],
  );

  await createTable(
    "permissions",
    "permissions",
    [
      { kind: "string", key: "action", size: 100, required: true },
      { kind: "string", key: "entity", size: 100, required: true },
      { kind: "string", key: "access", size: 100, required: true },
    ],
    [
      {
        key: "action_entity_access_unique",
        type: TablesDBIndexType.Unique,
        columns: ["action", "entity", "access"],
      },
    ],
  );

  await createTable(
    "roles_permissions",
    "roles_permissions",
    [
      { kind: "string", key: "roleId", size: REF_ID_SIZE, required: true },
      {
        kind: "string",
        key: "permissionId",
        size: REF_ID_SIZE,
        required: true,
      },
    ],
    [
      {
        key: "role_permission_unique",
        type: TablesDBIndexType.Unique,
        columns: ["roleId", "permissionId"],
      },
    ],
  );

  await createTable(
    "rooms",
    "rooms",
    [
      { kind: "string", key: "introMessage", size: 2000, required: false },
      { kind: "string", key: "theme", size: 200, required: false },
      {
        kind: "enum",
        key: "status",
        elements: ["WAITING", "STARTING", "ACTIVE", "FINISHED"],
        required: false,
        xdefault: "WAITING",
      },
      { kind: "string", key: "code", size: 6, required: true },
      { kind: "datetime", key: "startsAt", required: false },
      { kind: "datetime", key: "startingExpiresAt", required: false },
      { kind: "datetime", key: "expiresAt", required: false },
      { kind: "string", key: "ownerId", size: REF_ID_SIZE, required: true },
    ],
    [
      { key: "code_unique", type: TablesDBIndexType.Unique, columns: ["code"] },
    ],
  );

  await createTable(
    "artworks",
    "artworks",
    [
      { kind: "string", key: "theme", size: 200, required: true },
      // Holds a Storage file URL, not the raw image (see Phase 4).
      { kind: "string", key: "artworkImage", size: 2048, required: true },
      {
        kind: "integer",
        key: "likesCount",
        required: false,
        xdefault: 0,
      },
      {
        kind: "integer",
        key: "commentsCount",
        required: false,
        xdefault: 0,
      },
      { kind: "string", key: "roomId", size: REF_ID_SIZE, required: false },
    ],
    [
      {
        key: "roomId_unique",
        type: TablesDBIndexType.Unique,
        columns: ["roomId"],
      },
    ],
  );

  await createTable(
    "artists",
    "artists",
    [
      { kind: "string", key: "username", size: 50, required: true },
      { kind: "email", key: "email", required: true },
      { kind: "datetime", key: "emailVerified", required: false },
      { kind: "string", key: "avatar", size: 500, required: false },
      { kind: "integer", key: "followerCount", required: false, xdefault: 0 },
      { kind: "integer", key: "followingCount", required: false, xdefault: 0 },
      { kind: "integer", key: "artworksCount", required: false, xdefault: 0 },
      { kind: "string", key: "roleId", size: REF_ID_SIZE, required: true },
      { kind: "string", key: "roomId", size: REF_ID_SIZE, required: false },
    ],
    [
      {
        key: "username_unique",
        type: TablesDBIndexType.Unique,
        columns: ["username"],
      },
      { key: "email_unique", type: TablesDBIndexType.Unique, columns: ["email"] },
      { key: "username_search", type: TablesDBIndexType.Fulltext, columns: ["username"] },
      { key: "roomId_key", type: TablesDBIndexType.Key, columns: ["roomId"] },
    ],
  );

  await createTable(
    "artists_artworks",
    "artists_artworks",
    [
      { kind: "string", key: "artistId", size: REF_ID_SIZE, required: true },
      { kind: "string", key: "artworkId", size: REF_ID_SIZE, required: true },
    ],
    [
      {
        key: "artist_artwork_unique",
        type: TablesDBIndexType.Unique,
        columns: ["artistId", "artworkId"],
      },
    ],
  );

  await createTable(
    "passwords",
    "passwords",
    [
      { kind: "string", key: "hash", size: 100, required: true },
      { kind: "string", key: "artistId", size: REF_ID_SIZE, required: true },
    ],
    [
      {
        key: "artistId_unique",
        type: TablesDBIndexType.Unique,
        columns: ["artistId"],
      },
    ],
  );

  await createTable(
    "verification_tokens",
    "verification_tokens",
    [
      { kind: "string", key: "target", size: 320, required: true },
      {
        kind: "enum",
        key: "type",
        elements: ["EMAIL_VERIFICATION", "PASSWORD_RESET"],
        required: true,
      },
      { kind: "string", key: "token", size: 255, required: true },
      { kind: "string", key: "secret", size: 255, required: true },
      { kind: "datetime", key: "expiresAt", required: true },
    ],
    [
      {
        key: "target_type_unique",
        type: TablesDBIndexType.Unique,
        columns: ["target", "type"],
      },
    ],
  );

  await createTable(
    "comments",
    "comments",
    [
      { kind: "string", key: "content", size: 2000, required: true },
      { kind: "string", key: "artistId", size: REF_ID_SIZE, required: true },
      { kind: "string", key: "artworkId", size: REF_ID_SIZE, required: true },
    ],
    [
      {
        key: "artworkId_key",
        type: TablesDBIndexType.Key,
        columns: ["artworkId"],
      },
    ],
  );

  await createTable(
    "follows",
    "follows",
    [
      { kind: "string", key: "followerId", size: REF_ID_SIZE, required: true },
      {
        kind: "string",
        key: "followingId",
        size: REF_ID_SIZE,
        required: true,
      },
    ],
    [
      {
        key: "follower_following_unique",
        type: TablesDBIndexType.Unique,
        columns: ["followerId", "followingId"],
      },
      {
        key: "followerId_key",
        type: TablesDBIndexType.Key,
        columns: ["followerId"],
      },
      {
        key: "followingId_key",
        type: TablesDBIndexType.Key,
        columns: ["followingId"],
      },
    ],
  );

  await createTable(
    "likes",
    "likes",
    [
      { kind: "string", key: "artistId", size: REF_ID_SIZE, required: true },
      { kind: "string", key: "artworkId", size: REF_ID_SIZE, required: true },
    ],
    [
      {
        key: "artist_artwork_unique",
        type: TablesDBIndexType.Unique,
        columns: ["artistId", "artworkId"],
      },
    ],
  );

  console.log(`\nBucket: ${ARTWORKS_BUCKET_ID}`);
  await ignoreConflict(ARTWORKS_BUCKET_ID, () =>
    storage.createBucket({
      bucketId: ARTWORKS_BUCKET_ID,
      name: "artworks",
      permissions: [Permission.read(Role.any())],
      fileSecurity: false,
      allowedFileExtensions: ["png", "jpg", "jpeg", "webp"],
      maximumFileSize: 10 * 1024 * 1024,
    }),
  );

  console.log("\nDone.");
  if (!process.env.APPWRITE_DATABASE_ID) {
    console.log(
      `\nAdd this to .env.local:\n  APPWRITE_DATABASE_ID=${DATABASE_ID}`,
    );
  }
}

main().catch((err) => {
  console.error("Provisioning failed:", err);
  process.exit(1);
});
