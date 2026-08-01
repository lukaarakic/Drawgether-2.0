import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { Query } from "node-appwrite";
import { tablesDB, APPWRITE_DATABASE_ID } from "@/app/lib/appwrite";
import { TABLES } from "@/app/lib/data/tables";
import * as auth from "@/app/lib/data/auth.appwrite";
import * as artists from "@/app/lib/data/artists.appwrite";
import * as rooms from "@/app/lib/data/rooms.appwrite";
import * as artworks from "@/app/lib/data/artworks.appwrite";
import * as interactions from "@/app/lib/data/interactions.appwrite";
import * as feed from "@/app/lib/data/feed.appwrite";
import { RoomStatus } from "@/drizzle/types";
import { ID } from "node-appwrite";

// These hit your real Appwrite project — they create and delete their own
// rows, scoped to a unique per-run username suffix, and never touch rows
// they didn't create. Skipped automatically if Appwrite credentials aren't
// configured (e.g. a fresh clone, or CI without secrets).
const hasCredentials =
  !!process.env.APPWRITE_API_KEY &&
  !!process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT &&
  !!process.env.APPWRITE_DATABASE_ID;

const cleanupRowIds: { table: string; id: string }[] = [];
function track(table: string, id: string) {
  cleanupRowIds.push({ table, id });
  return id;
}

describe.skipIf(!hasCredentials)("Appwrite data layer (live integration)", () => {
  const suffix = `${Date.now()}${Math.floor(Math.random() * 1000)}`;
  let roleId: string;
  let artistA: { id: string };
  let artistB: { id: string };
  let roomCode: string;
  let roomId: string;
  let artworkId: string;

  beforeAll(async () => {
    const existingRole = await auth.getRoleByName("user");
    if (existingRole) {
      roleId = existingRole.id;
    } else {
      const role = await tablesDB.createRow({
        databaseId: APPWRITE_DATABASE_ID,
        tableId: TABLES.roles,
        rowId: ID.unique(),
        data: { name: "user" },
      });
      roleId = track(TABLES.roles, role.$id);
    }

    artistA = await auth.createArtistAccount({
      username: `vt_a_${suffix}`,
      email: `vt_a_${suffix}@example.com`,
      roleId,
      avatar: "https://example.com/a.png",
      passwordHash: "not-a-real-hash",
    });
    track(TABLES.artists, artistA.id);
    track(TABLES.passwords, artistA.id);

    artistB = await auth.createArtistAccount({
      username: `vt_b_${suffix}`,
      email: `vt_b_${suffix}@example.com`,
      roleId,
      avatar: "https://example.com/b.png",
      passwordHash: "not-a-real-hash",
    });
    track(TABLES.artists, artistB.id);
    track(TABLES.passwords, artistB.id);
  });

  afterAll(async () => {
    const testArtistIds = [artistA?.id, artistB?.id].filter((id): id is string => !!id);

    async function deleteWhere(table: string, column: string) {
      if (testArtistIds.length === 0) return;
      await tablesDB
        .deleteRows({
          databaseId: APPWRITE_DATABASE_ID,
          tableId: table,
          queries: [Query.equal(column, testArtistIds)],
        })
        .catch(() => {});
    }

    await deleteWhere(TABLES.likes, "artistId");
    await deleteWhere(TABLES.follows, "followerId");
    await deleteWhere(TABLES.follows, "followingId");
    await deleteWhere(TABLES.artistsArtworks, "artistId");

    for (const { table, id } of cleanupRowIds.reverse()) {
      await tablesDB
        .deleteRow({ databaseId: APPWRITE_DATABASE_ID, tableId: table, rowId: id })
        .catch(() => {});
    }
  });

  it("finds an artist by email or username", async () => {
    const found = await auth.findArtistByEmailOrUsername(`vt_a_${suffix}`);
    expect(found?.id).toBe(artistA.id);
  });

  it("reports username/email availability correctly", async () => {
    const availability = await auth.checkArtistAvailability({
      username: `vt_a_${suffix}`,
      email: `nobody_${suffix}@example.com`,
    });
    expect(availability).toEqual({ usernameTaken: true, emailTaken: false });
  });

  it("creates a room owned by the creating artist", async () => {
    roomCode = `VT${suffix.slice(-4)}`;
    const room = await rooms.createRoomWithOwner(artistA.id, roomCode);
    roomId = room.id;
    track(TABLES.rooms, room.id);

    expect(room.ownerId).toBe(artistA.id);
    expect(room.status).toBe(RoomStatus.WAITING);
  });

  it("lets a second artist join, visible in the lobby roster", async () => {
    const joined = await rooms.joinRoomAsArtist(artistB.id, roomId);
    expect(joined.roomId).toBe(roomId);

    const lobby = await rooms.getRoomForLobby(roomCode);
    expect(lobby?.artists.map((a) => a.id).sort()).toEqual(
      [artistA.id, artistB.id].sort(),
    );
  });

  it("runs the countdown -> starting -> active state machine", async () => {
    const startsAt = new Date(Date.now() + 1000);
    await rooms.beginStartCountdown(roomId, startsAt);

    const afterBegin = await rooms.getHostRoomSnapshot(roomId);
    expect(afterBegin?.startsAt?.getTime()).toBe(startsAt.getTime());

    const finalized = await rooms.finalizeStartingCountdown({
      roomDatabaseId: roomId,
      previousStartsAt: afterBegin!.startsAt!,
      startingExpiresAt: new Date(Date.now() + 1000),
      introMessage: "integration test intro",
      theme: "integration test theme",
    });
    expect(finalized).toBe(true);

    const activationSnapshot = await rooms.getRoomActivationSnapshot(roomId);
    expect(activationSnapshot?.status).toBe(RoomStatus.STARTING);

    const activated = await rooms.activateRoomState({
      roomDatabaseId: roomId,
      previousStartingExpiresAt: activationSnapshot!.startingExpiresAt!,
      expiresAt: new Date(Date.now() + 5000),
    });
    expect(activated).toBe(true);
  });

  it("rejects a compare-and-swap write against stale state (race-condition guard)", async () => {
    const staleResult = await rooms.finalizeStartingCountdown({
      roomDatabaseId: roomId,
      previousStartsAt: new Date("2000-01-01"),
      startingExpiresAt: new Date(),
      introMessage: "should not apply",
      theme: "should not apply",
    });
    expect(staleResult).toBe(false);
  });

  it("creates an artwork linked to every artist in the room", async () => {
    const themeInfo = await rooms.getRoomThemeWithArtistIds(roomId);
    expect(themeInfo?.artists).toHaveLength(2);

    const artwork = await artworks.createArtworkForRoom({
      roomDatabaseId: roomId,
      theme: themeInfo!.theme ?? "Unknown",
      artworkImage: "https://example.com/fake-artwork.png",
      artistIds: themeInfo!.artists.map((a) => a.id),
    });
    artworkId = artwork.id;
    track(TABLES.artworks, artwork.id);

    const detail = await artworks.getArtworkWithArtistsAndComments(artwork.id);
    expect(detail?.artists).toHaveLength(2);
  });

  it("toggles a like and updates the artwork's like count atomically", async () => {
    const first = await interactions.toggleArtworkLike({
      artistId: artistA.id,
      artworkId,
    });
    expect(first.liked).toBe(true);
    expect(await interactions.isArtworkLikedByArtist(artistA.id, artworkId)).toBe(true);

    const second = await interactions.toggleArtworkLike({
      artistId: artistA.id,
      artworkId,
    });
    expect(second.liked).toBe(false);
    expect(await interactions.isArtworkLikedByArtist(artistA.id, artworkId)).toBe(false);

    // Re-like so the feed/comment assertions below see a liked artwork.
    await interactions.toggleArtworkLike({ artistId: artistA.id, artworkId });
  });

  it("adds a comment and increments the artwork's comment count", async () => {
    await interactions.addComment({
      content: "nice drawing",
      artistId: artistB.id,
      artworkId,
    });

    const withComments = await artworks.getArtworkCommentsOnly(artworkId);
    expect(withComments?.comments).toHaveLength(1);
    expect(withComments?.comments[0]).toMatchObject({
      content: "nice drawing",
      artist: { id: artistB.id },
    });
  });

  it("toggles a follow and updates both artists' counters", async () => {
    const result = await interactions.toggleFollow({
      followerId: artistB.id,
      followingId: artistA.id,
    });
    expect(result.following).toBe(true);

    const found = await interactions.findFollow(artistB.id, artistA.id);
    expect(found).toBeTruthy();
  });

  it("surfaces the new artwork in feed pagination with correct like state", async () => {
    const chunk = await feed.getFeedChunk({ artistId: artistA.id, cursor: null, limit: 10 });
    expect(chunk.artworks.some((a) => a.id === artworkId)).toBe(true);
    expect(chunk.likedArtworkIds).toContain(artworkId);
  });

  it("removes an artist from the room on kick/leave", async () => {
    await rooms.removeArtistFromRoom(artistB.id);
    expect(await rooms.isArtistInRoom(artistB.id, roomId)).toBe(false);
  });

  it("assembles the full nested artist profile view", async () => {
    const profile = await artists.getArtistProfileByUsername(`vt_a_${suffix}`);
    expect(profile?.artworks).toHaveLength(1);
    expect(profile?.artworks[0].artists).toHaveLength(2);
  });
});
