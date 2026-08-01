import { Query } from "node-appwrite";
import { tablesDB, APPWRITE_DATABASE_ID } from "../appwrite";
import { TABLES } from "./tables";
import { mapArtwork, mapComment } from "./appwrite-mappers";
import { getArtistStubs } from "./appwrite-artist-stubs";
import { getLikedArtworkIds } from "./interactions.appwrite";
import type { FeedArtwork, FeedComment, FeedCursor } from "./feed.drizzle";

export type { FeedArtwork, FeedComment, FeedCursor } from "./feed.drizzle";

export async function getFeedChunk({
  artistId,
  cursor,
  limit,
}: {
  artistId: string;
  cursor?: FeedCursor | null;
  limit: number;
}): Promise<{
  artworks: FeedArtwork[];
  likedArtworkIds: string[];
  hasMore: boolean;
  nextCursor: FeedCursor | null;
}> {
  const requestedLimit = Math.max(1, Math.min(limit, 20));

  const queries = [Query.orderDesc("$createdAt"), Query.limit(requestedLimit + 1)];
  if (cursor?.id) {
    queries.push(Query.cursorAfter(cursor.id));
  }

  const { rows } = await tablesDB.listRows({
    databaseId: APPWRITE_DATABASE_ID,
    tableId: TABLES.artworks,
    queries,
  });

  const hasMore = rows.length > requestedLimit;
  const chunk = rows.slice(0, requestedLimit);
  const lastRow = chunk.at(-1);

  if (chunk.length === 0) {
    return { artworks: [], likedArtworkIds: [], hasMore, nextCursor: null };
  }

  const artworkIds = chunk.map((row) => row.$id as string);

  const [{ rows: artistLinks }, { rows: commentRows }] = await Promise.all([
    tablesDB.listRows({
      databaseId: APPWRITE_DATABASE_ID,
      tableId: TABLES.artistsArtworks,
      queries: [Query.equal("artworkId", artworkIds), Query.limit(5000)],
    }),
    tablesDB.listRows({
      databaseId: APPWRITE_DATABASE_ID,
      tableId: TABLES.comments,
      queries: [Query.equal("artworkId", artworkIds), Query.limit(5000)],
    }),
  ]);

  const relatedArtistIds = Array.from(
    new Set([
      ...artistLinks.map((row) => row.artistId as string),
      ...commentRows.map((row) => row.artistId as string),
    ]),
  );
  const artistStubs = await getArtistStubs(relatedArtistIds);

  const artistsByArtwork = new Map<string, FeedArtwork["artists"]>();
  for (const link of artistLinks) {
    const stub = artistStubs.get(link.artistId as string);
    if (!stub) continue;
    const list = artistsByArtwork.get(link.artworkId as string) ?? [];
    list.push(stub);
    artistsByArtwork.set(link.artworkId as string, list);
  }

  const commentsByArtwork = new Map<string, FeedComment[]>();
  for (const row of commentRows) {
    const stub = artistStubs.get(row.artistId as string);
    if (!stub) continue;
    const comment = mapComment(row);
    const list = commentsByArtwork.get(row.artworkId as string) ?? [];
    list.push({ id: comment.id, content: comment.content, artist: stub });
    commentsByArtwork.set(row.artworkId as string, list);
  }

  const formattedArtworks: FeedArtwork[] = chunk.map((row) => {
    const artwork = mapArtwork(row);
    return {
      ...artwork,
      artists: artistsByArtwork.get(artwork.id) ?? [],
      comments: commentsByArtwork.get(artwork.id) ?? [],
    };
  });

  const likedArtworkIds = await getLikedArtworkIds({ artistId, artworkIds });

  return {
    artworks: formattedArtworks,
    likedArtworkIds,
    hasMore,
    nextCursor:
      hasMore && lastRow
        ? { createdAt: new Date(lastRow.$createdAt).toISOString(), id: lastRow.$id }
        : null,
  };
}
