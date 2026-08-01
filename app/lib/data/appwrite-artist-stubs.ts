import { Query } from "node-appwrite";
import { tablesDB, APPWRITE_DATABASE_ID } from "../appwrite";
import { TABLES } from "./tables";

export type ArtistStub = { id: string; username: string; avatar: string | null };

// Appwrite has no relational `with`, so every place that needs "username +
// avatar for these artist IDs" batches through here instead of N+1 getRow calls.
export async function getArtistStubs(
  artistIds: string[],
): Promise<Map<string, ArtistStub>> {
  if (artistIds.length === 0) return new Map();

  const { rows } = await tablesDB.listRows({
    databaseId: APPWRITE_DATABASE_ID,
    tableId: TABLES.artists,
    queries: [Query.equal("$id", artistIds), Query.limit(artistIds.length)],
  });

  return new Map(
    rows.map((row) => [
      row.$id,
      {
        id: row.$id as string,
        username: row.username as string,
        avatar: (row.avatar as string) ?? null,
      },
    ]),
  );
}
