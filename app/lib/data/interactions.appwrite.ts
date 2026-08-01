import { ID, Query } from "node-appwrite";
import { tablesDB, APPWRITE_DATABASE_ID } from "../appwrite";
import { TABLES } from "./tables";

async function runTransaction(fn: (transactionId: string) => Promise<void>) {
  const transaction = await tablesDB.createTransaction();
  try {
    await fn(transaction.$id);
    await tablesDB.updateTransaction({ transactionId: transaction.$id, commit: true });
  } catch (err) {
    await tablesDB
      .updateTransaction({ transactionId: transaction.$id, rollback: true })
      .catch(() => {});
    throw err;
  }
}

export async function getLikedArtworkIds({
  artistId,
  artworkIds,
}: {
  artistId: string;
  artworkIds: string[];
}): Promise<string[]> {
  if (artworkIds.length === 0) return [];

  const { rows } = await tablesDB.listRows({
    databaseId: APPWRITE_DATABASE_ID,
    tableId: TABLES.likes,
    queries: [
      Query.equal("artistId", artistId),
      Query.equal("artworkId", artworkIds),
      Query.limit(artworkIds.length),
    ],
  });

  return rows.map((row) => row.artworkId as string);
}

async function findLikeRow(artistId: string, artworkId: string) {
  const { rows } = await tablesDB.listRows({
    databaseId: APPWRITE_DATABASE_ID,
    tableId: TABLES.likes,
    queries: [
      Query.equal("artistId", artistId),
      Query.equal("artworkId", artworkId),
      Query.limit(1),
    ],
  });
  return rows[0];
}

export async function isArtworkLikedByArtist(artistId: string, artworkId: string) {
  return !!(await findLikeRow(artistId, artworkId));
}

export async function toggleArtworkLike({
  artistId,
  artworkId,
}: {
  artistId: string;
  artworkId: string;
}): Promise<{ liked: boolean; likeCount: number }> {
  const existing = await findLikeRow(artistId, artworkId);

  await runTransaction(async (transactionId) => {
    if (existing) {
      await tablesDB.deleteRow({
        databaseId: APPWRITE_DATABASE_ID,
        tableId: TABLES.likes,
        rowId: existing.$id,
        transactionId,
      });
      await tablesDB.decrementRowColumn({
        databaseId: APPWRITE_DATABASE_ID,
        tableId: TABLES.artworks,
        rowId: artworkId,
        column: "likesCount",
        transactionId,
      });
      return;
    }

    await tablesDB.createRow({
      databaseId: APPWRITE_DATABASE_ID,
      tableId: TABLES.likes,
      rowId: ID.unique(),
      data: { artistId, artworkId },
      transactionId,
    });
    await tablesDB.incrementRowColumn({
      databaseId: APPWRITE_DATABASE_ID,
      tableId: TABLES.artworks,
      rowId: artworkId,
      column: "likesCount",
      transactionId,
    });
  });

  // incrementRowColumn/decrementRowColumn return the row as staged within
  // the transaction, which isn't guaranteed to reflect the committed value —
  // re-read after commit instead of trusting that return value.
  const artwork = await tablesDB.getRow({
    databaseId: APPWRITE_DATABASE_ID,
    tableId: TABLES.artworks,
    rowId: artworkId,
  });

  return { liked: !existing, likeCount: (artwork.likesCount as number) ?? 0 };
}

export async function findFollow(followerId: string, followingId: string) {
  const { rows } = await tablesDB.listRows({
    databaseId: APPWRITE_DATABASE_ID,
    tableId: TABLES.follows,
    queries: [
      Query.equal("followerId", followerId),
      Query.equal("followingId", followingId),
      Query.limit(1),
    ],
  });
  return rows[0];
}

export async function toggleFollow({
  followerId,
  followingId,
}: {
  followerId: string;
  followingId: string;
}) {
  const existingFollow = await findFollow(followerId, followingId);

  await runTransaction(async (transactionId) => {
    if (existingFollow) {
      await tablesDB.deleteRow({
        databaseId: APPWRITE_DATABASE_ID,
        tableId: TABLES.follows,
        rowId: existingFollow.$id,
        transactionId,
      });
      await tablesDB.decrementRowColumn({
        databaseId: APPWRITE_DATABASE_ID,
        tableId: TABLES.artists,
        rowId: followingId,
        column: "followerCount",
        transactionId,
      });
      await tablesDB.decrementRowColumn({
        databaseId: APPWRITE_DATABASE_ID,
        tableId: TABLES.artists,
        rowId: followerId,
        column: "followingCount",
        transactionId,
      });
      return;
    }

    await tablesDB.createRow({
      databaseId: APPWRITE_DATABASE_ID,
      tableId: TABLES.follows,
      rowId: ID.unique(),
      data: { followerId, followingId },
      transactionId,
    });
    await tablesDB.incrementRowColumn({
      databaseId: APPWRITE_DATABASE_ID,
      tableId: TABLES.artists,
      rowId: followingId,
      column: "followerCount",
      transactionId,
    });
    await tablesDB.incrementRowColumn({
      databaseId: APPWRITE_DATABASE_ID,
      tableId: TABLES.artists,
      rowId: followerId,
      column: "followingCount",
      transactionId,
    });
  });

  return { following: !existingFollow };
}

export async function getCommentOwnerId(commentId: string) {
  try {
    const row = await tablesDB.getRow({
      databaseId: APPWRITE_DATABASE_ID,
      tableId: TABLES.comments,
      rowId: commentId,
    });
    return { artistId: row.artistId as string };
  } catch {
    return undefined;
  }
}

export async function addComment({
  content,
  artistId,
  artworkId,
}: {
  content: string;
  artistId: string;
  artworkId: string;
}) {
  await runTransaction(async (transactionId) => {
    await tablesDB.createRow({
      databaseId: APPWRITE_DATABASE_ID,
      tableId: TABLES.comments,
      rowId: ID.unique(),
      data: { content, artistId, artworkId },
      transactionId,
    });
    await tablesDB.incrementRowColumn({
      databaseId: APPWRITE_DATABASE_ID,
      tableId: TABLES.artworks,
      rowId: artworkId,
      column: "commentsCount",
      transactionId,
    });
  });
}

export async function deleteComment({
  commentId,
  artworkId,
}: {
  commentId: string;
  artworkId: string;
}) {
  await runTransaction(async (transactionId) => {
    await tablesDB.deleteRow({
      databaseId: APPWRITE_DATABASE_ID,
      tableId: TABLES.comments,
      rowId: commentId,
      transactionId,
    });
    await tablesDB.decrementRowColumn({
      databaseId: APPWRITE_DATABASE_ID,
      tableId: TABLES.artworks,
      rowId: artworkId,
      column: "commentsCount",
      transactionId,
    });
  });
}
