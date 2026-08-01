import { ID, Query } from "node-appwrite";
import { createId } from "@paralleldrive/cuid2";
import { tablesDB, APPWRITE_DATABASE_ID } from "../appwrite";
import { TABLES } from "./tables";
import { mapArtwork, mapComment } from "./appwrite-mappers";
import { getArtistStubs, type ArtistStub } from "./appwrite-artist-stubs";

async function getArtworkArtists(artworkId: string): Promise<ArtistStub[]> {
  const { rows: links } = await tablesDB.listRows({
    databaseId: APPWRITE_DATABASE_ID,
    tableId: TABLES.artistsArtworks,
    queries: [Query.equal("artworkId", artworkId), Query.limit(1000)],
  });

  const stubs = await getArtistStubs(links.map((row) => row.artistId as string));
  return links
    .map((row) => stubs.get(row.artistId as string))
    .filter((stub): stub is ArtistStub => !!stub);
}

async function getArtworkComments(artworkId: string) {
  const { rows } = await tablesDB.listRows({
    databaseId: APPWRITE_DATABASE_ID,
    tableId: TABLES.comments,
    queries: [Query.equal("artworkId", artworkId), Query.limit(1000)],
  });

  const stubs = await getArtistStubs(rows.map((row) => row.artistId as string));

  return rows
    .map((row) => {
      const stub = stubs.get(row.artistId as string);
      if (!stub) return null;
      const comment = mapComment(row);
      return { id: comment.id, content: comment.content, artist: stub };
    })
    .filter((comment): comment is NonNullable<typeof comment> => !!comment);
}

export async function createArtworkForRoom({
  roomDatabaseId,
  theme,
  artworkImage,
  artistIds,
}: {
  roomDatabaseId: string;
  theme: string;
  artworkImage: string;
  artistIds: string[];
}) {
  const artworkId = createId();

  const transaction = await tablesDB.createTransaction();
  try {
    await tablesDB.createRow({
      databaseId: APPWRITE_DATABASE_ID,
      tableId: TABLES.artworks,
      rowId: artworkId,
      data: { theme, artworkImage, roomId: roomDatabaseId },
      transactionId: transaction.$id,
    });

    for (const artistId of artistIds) {
      await tablesDB.createRow({
        databaseId: APPWRITE_DATABASE_ID,
        tableId: TABLES.artistsArtworks,
        rowId: ID.unique(),
        data: { artworkId, artistId },
        transactionId: transaction.$id,
      });
    }

    await tablesDB.updateTransaction({ transactionId: transaction.$id, commit: true });
  } catch (err) {
    await tablesDB
      .updateTransaction({ transactionId: transaction.$id, rollback: true })
      .catch(() => {});
    throw err;
  }

  const row = await tablesDB.getRow({
    databaseId: APPWRITE_DATABASE_ID,
    tableId: TABLES.artworks,
    rowId: artworkId,
  });

  return mapArtwork(row);
}

async function getArtworkRow(artworkId: string) {
  try {
    return await tablesDB.getRow({
      databaseId: APPWRITE_DATABASE_ID,
      tableId: TABLES.artworks,
      rowId: artworkId,
    });
  } catch {
    return undefined;
  }
}

export async function getArtworkWithArtistsAndComments(artworkId: string) {
  const row = await getArtworkRow(artworkId);
  if (!row) return undefined;

  const [artists, comments] = await Promise.all([
    getArtworkArtists(artworkId),
    getArtworkComments(artworkId),
  ]);

  return { ...mapArtwork(row), artists, comments };
}

export async function getArtworkWithArtistsCommentsAndLikes(artworkId: string) {
  const row = await getArtworkRow(artworkId);
  if (!row) return undefined;

  const [artists, comments, { rows: likeRows }] = await Promise.all([
    getArtworkArtists(artworkId),
    getArtworkComments(artworkId),
    tablesDB.listRows({
      databaseId: APPWRITE_DATABASE_ID,
      tableId: TABLES.likes,
      queries: [Query.equal("artworkId", artworkId), Query.limit(5000)],
    }),
  ]);

  return {
    ...mapArtwork(row),
    artists,
    comments,
    likes: likeRows.map((like) => ({ artistId: like.artistId as string })),
  };
}

export async function getArtworkCommentsOnly(artworkId: string) {
  const row = await getArtworkRow(artworkId);
  if (!row) return undefined;

  const comments = await getArtworkComments(artworkId);
  return { id: row.$id as string, comments };
}

export async function getArtworkOwnerIds(artworkId: string) {
  const row = await getArtworkRow(artworkId);
  if (!row) return null;

  const artists = await getArtworkArtists(artworkId);
  return artists.map((artist) => artist.id);
}

export async function deleteArtworkById(artworkId: string) {
  await tablesDB.deleteRow({
    databaseId: APPWRITE_DATABASE_ID,
    tableId: TABLES.artworks,
    rowId: artworkId,
  });
}
