import { Query } from "node-appwrite";
import { tablesDB, APPWRITE_DATABASE_ID } from "../appwrite";
import { TABLES } from "./tables";
import { mapArtwork, mapComment } from "./appwrite-mappers";
import { getArtistStubs, type ArtistStub } from "./appwrite-artist-stubs";

export async function getArtistProfileByUsername(username: string) {
  const { rows: artistRows } = await tablesDB.listRows({
    databaseId: APPWRITE_DATABASE_ID,
    tableId: TABLES.artists,
    queries: [Query.equal("username", username), Query.limit(1)],
  });

  const artistRow = artistRows[0];
  if (!artistRow) return undefined;

  const artistId = artistRow.$id as string;

  const [{ rows: junctionRows }, { rows: followerRows }] = await Promise.all([
    tablesDB.listRows({
      databaseId: APPWRITE_DATABASE_ID,
      tableId: TABLES.artistsArtworks,
      queries: [Query.equal("artistId", artistId), Query.limit(5000)],
    }),
    tablesDB.listRows({
      databaseId: APPWRITE_DATABASE_ID,
      tableId: TABLES.follows,
      queries: [Query.equal("followingId", artistId), Query.limit(5000)],
    }),
  ]);

  const artworkIds = junctionRows.map((row) => row.artworkId as string);

  const [artworkRows, allCoArtistLinks, allComments] = await Promise.all([
    artworkIds.length
      ? tablesDB.listRows({
          databaseId: APPWRITE_DATABASE_ID,
          tableId: TABLES.artworks,
          queries: [Query.equal("$id", artworkIds), Query.limit(artworkIds.length)],
        })
      : Promise.resolve({ rows: [] }),
    artworkIds.length
      ? tablesDB.listRows({
          databaseId: APPWRITE_DATABASE_ID,
          tableId: TABLES.artistsArtworks,
          queries: [Query.equal("artworkId", artworkIds), Query.limit(5000)],
        })
      : Promise.resolve({ rows: [] }),
    artworkIds.length
      ? tablesDB.listRows({
          databaseId: APPWRITE_DATABASE_ID,
          tableId: TABLES.comments,
          queries: [Query.equal("artworkId", artworkIds), Query.limit(5000)],
        })
      : Promise.resolve({ rows: [] }),
  ]);

  const relatedArtistIds = Array.from(
    new Set([
      ...allCoArtistLinks.rows.map((row) => row.artistId as string),
      ...allComments.rows.map((row) => row.artistId as string),
      ...followerRows.map((row) => row.followerId as string),
    ]),
  );
  const artistStubs = await getArtistStubs(relatedArtistIds);

  const coArtistsByArtwork = new Map<string, ArtistStub[]>();
  for (const link of allCoArtistLinks.rows) {
    const stub = artistStubs.get(link.artistId as string);
    if (!stub) continue;
    const list = coArtistsByArtwork.get(link.artworkId as string) ?? [];
    list.push(stub);
    coArtistsByArtwork.set(link.artworkId as string, list);
  }

  const commentsByArtwork = new Map<
    string,
    { id: string; content: string; artist: ArtistStub }[]
  >();
  for (const row of allComments.rows) {
    const stub = artistStubs.get(row.artistId as string);
    if (!stub) continue;
    const mapped = mapComment(row);
    const list = commentsByArtwork.get(row.artworkId as string) ?? [];
    list.push({ id: mapped.id, content: mapped.content, artist: stub });
    commentsByArtwork.set(row.artworkId as string, list);
  }

  const artworks = artworkRows.rows.map((row) => {
    const artwork = mapArtwork(row);
    return {
      id: artwork.id,
      theme: artwork.theme,
      artworkImage: artwork.artworkImage,
      likesCount: artwork.likesCount,
      createdAt: artwork.createdAt,
      updatedAt: artwork.updatedAt,
      roomId: artwork.roomId,
      commentsCount: artwork.commentsCount,
      artists: coArtistsByArtwork.get(artwork.id) ?? [],
      comments: commentsByArtwork.get(artwork.id) ?? [],
    };
  });

  return {
    id: artistId,
    username: artistRow.username as string,
    followerCount: (artistRow.followerCount as number) ?? 0,
    followingCount: (artistRow.followingCount as number) ?? 0,
    avatar: (artistRow.avatar as string) ?? null,
    artworks,
    followers: followerRows.map((row) => ({ followerId: row.followerId as string })),
  };
}

export async function getArtistSettingsByUsername(username: string) {
  const { rows } = await tablesDB.listRows({
    databaseId: APPWRITE_DATABASE_ID,
    tableId: TABLES.artists,
    queries: [Query.equal("username", username), Query.limit(1)],
  });

  const row = rows[0];
  if (!row) return undefined;

  return {
    id: row.$id as string,
    username: row.username as string,
    email: row.email as string,
    emailVerified: row.emailVerified ? new Date(row.emailVerified as string) : null,
    avatar: (row.avatar as string) ?? null,
  };
}

export async function searchArtistsByUsername(term: string) {
  const { rows } = await tablesDB.listRows({
    databaseId: APPWRITE_DATABASE_ID,
    tableId: TABLES.artists,
    queries: [Query.contains("username", term), Query.limit(20)],
  });

  return rows.map((row) => ({
    id: row.$id as string,
    username: row.username as string,
    avatar: (row.avatar as string) ?? null,
  }));
}

export async function markArtistEmailVerified(artistId: string) {
  await tablesDB.updateRow({
    databaseId: APPWRITE_DATABASE_ID,
    tableId: TABLES.artists,
    rowId: artistId,
    data: { emailVerified: new Date().toISOString() },
  });
}
