import "dotenv/config";
import { db } from "@/app/lib/db";
import { eq } from "drizzle-orm";
import {
  artists,
  roles,
  passwords,
  artistsArtworks,
  comments,
  likes,
  follows,
  rooms,
  rolesPermissions,
  permissions,
  artworks,
} from "./schema";

async function main() {
  console.log("🌱 Seeding database...");

  // 1. CLEANUP
  await db.delete(likes);
  await db.delete(comments);
  await db.delete(follows);
  await db.delete(artistsArtworks);
  await db.delete(artworks);
  await db.delete(rooms);
  await db.delete(passwords);
  await db.delete(artists);
  await db.delete(rolesPermissions);
  await db.delete(roles);
  await db.delete(permissions);

  console.log("✅ Cleaned up existing data");

  // --- PERMISSIONS ---
  const insertedPermissions = await db
    .insert(permissions)
    .values([
      { action: "create", entity: "artwork", access: "own" },
      { action: "read", entity: "artwork", access: "any" },
      { action: "update", entity: "artwork", access: "own" },
      { action: "delete", entity: "artwork", access: "own" },
      { action: "delete", entity: "artwork", access: "any" },
      { action: "create", entity: "comment", access: "own" },
      { action: "delete", entity: "comment", access: "own" },
      { action: "delete", entity: "comment", access: "any" },
      { action: "manage", entity: "user", access: "any" },
    ])
    .returning();

  console.log(`✅ Created ${insertedPermissions.length} permissions`);

  // --- ROLES & ROLE PERMISSIONS ---
  const [userRole] = await db
    .insert(roles)
    .values({ name: "user" })
    .returning();
  const [adminRole] = await db
    .insert(roles)
    .values({ name: "admin" })
    .returning();

  const userPerms = insertedPermissions.filter((p) =>
    [
      "create:artwork:own",
      "read:artwork:any",
      "update:artwork:own",
      "delete:artwork:own",
      "create:comment:own",
      "delete:comment:own",
    ].includes(`${p.action}:${p.entity}:${p.access}`),
  );

  await db
    .insert(rolesPermissions)
    .values(
      userPerms.map((p) => ({ roleId: userRole.id, permissionId: p.id })),
    );

  await db.insert(rolesPermissions).values(
    insertedPermissions.map((p) => ({
      roleId: adminRole.id,
      permissionId: p.id,
    })),
  );

  console.log("✅ Created roles: user, admin");

  // --- ARTISTS & PASSWORDS ---
  const hashedPassword =
    "$2a$10$BQToDNdBtBKCvnrTmMi5m.NK.7i6Qx7YASs.jTkE86I5zqxzE8klC";

  const insertedArtists = await db
    .insert(artists)
    .values([
      {
        username: "alice_draws",
        email: "alice@example.com",
        avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=alice",
        roleId: userRole.id,
      },
      {
        username: "bob_artist",
        email: "bob@example.com",
        avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=bob",
        roleId: userRole.id,
      },
      {
        username: "charlie_creative",
        email: "charlie@example.com",
        avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=charlie",
        roleId: userRole.id,
      },
      {
        username: "netrunners",
        email: "admin@drawgether.com",
        emailVerified: new Date(),
        avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=netrunners",
        roleId: adminRole.id,
      },
    ])
    .returning();

  const [alice, bob, charlie, netrunners] = insertedArtists;

  await db.insert(passwords).values(
    insertedArtists.map((artist) => ({
      artistId: artist.id,
      hash: hashedPassword,
    })),
  );

  console.log(`✅ Created ${insertedArtists.length} artists`);

  // --- ARTWORKS & ARTIST-ARTWORK RELATIONS ---
  const insertedArtworks = await db
    .insert(artworks)
    .values([
      {
        theme: "sunset landscape",
        artworkImage:
          "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==",
      },
      {
        theme: "cute cat",
        artworkImage:
          "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==",
      },
      {
        theme: "abstract shapes",
        artworkImage:
          "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==",
      },
      {
        theme: "mountain view",
        artworkImage:
          "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+P+/HgAFhAJ/wlseKgAAAABJRU5ErkJggg==",
      },
    ])
    .returning();

  await db.insert(artistsArtworks).values([
    { artistId: alice.id, artworkId: insertedArtworks[0].id },
    { artistId: bob.id, artworkId: insertedArtworks[1].id },
    { artistId: charlie.id, artworkId: insertedArtworks[1].id },
    { artistId: charlie.id, artworkId: insertedArtworks[2].id },
    { artistId: alice.id, artworkId: insertedArtworks[3].id },
    { artistId: bob.id, artworkId: insertedArtworks[3].id },
  ]);

  console.log(`✅ Created ${insertedArtworks.length} artworks`);

  // --- COMMENTS ---
  const insertedComments = await db
    .insert(comments)
    .values([
      {
        content: "Love the colors in this one! 🎨",
        artistId: bob.id,
        artworkId: insertedArtworks[0].id,
      },
      {
        content: "This is amazing work!",
        artistId: charlie.id,
        artworkId: insertedArtworks[0].id,
      },
      {
        content: "Such a cute cat! 🐱",
        artistId: alice.id,
        artworkId: insertedArtworks[1].id,
      },
      {
        content: "Beautiful abstract piece",
        artistId: bob.id,
        artworkId: insertedArtworks[2].id,
      },
      {
        content: "The mountains look so peaceful",
        artistId: charlie.id,
        artworkId: insertedArtworks[3].id,
      },
    ])
    .returning();

  await db
    .update(artworks)
    .set({ commentsCount: 2 })
    .where(eq(artworks.id, insertedArtworks[0].id));
  await db
    .update(artworks)
    .set({ commentsCount: 1 })
    .where(eq(artworks.id, insertedArtworks[1].id));
  await db
    .update(artworks)
    .set({ commentsCount: 1 })
    .where(eq(artworks.id, insertedArtworks[2].id));
  await db
    .update(artworks)
    .set({ commentsCount: 1 })
    .where(eq(artworks.id, insertedArtworks[3].id));

  console.log(`✅ Created ${insertedComments.length} comments`);

  // --- LIKES ---
  const insertedLikes = await db
    .insert(likes)
    .values([
      { artistId: bob.id, artworkId: insertedArtworks[0].id },
      { artistId: charlie.id, artworkId: insertedArtworks[0].id },
      { artistId: netrunners.id, artworkId: insertedArtworks[0].id },
      { artistId: alice.id, artworkId: insertedArtworks[1].id },
      { artistId: charlie.id, artworkId: insertedArtworks[1].id },
      { artistId: alice.id, artworkId: insertedArtworks[2].id },
      { artistId: bob.id, artworkId: insertedArtworks[3].id },
    ])
    .returning();

  await db
    .update(artworks)
    .set({ likesCount: 3 })
    .where(eq(artworks.id, insertedArtworks[0].id));
  await db
    .update(artworks)
    .set({ likesCount: 2 })
    .where(eq(artworks.id, insertedArtworks[1].id));
  await db
    .update(artworks)
    .set({ likesCount: 1 })
    .where(eq(artworks.id, insertedArtworks[2].id));
  await db
    .update(artworks)
    .set({ likesCount: 1 })
    .where(eq(artworks.id, insertedArtworks[3].id));

  console.log(`✅ Created ${insertedLikes.length} likes`);

  // --- FOLLOWS ---
  const insertedFollows = await db
    .insert(follows)
    .values([
      { followerId: bob.id, followingId: alice.id },
      { followerId: charlie.id, followingId: alice.id },
      { followerId: alice.id, followingId: bob.id },
      { followerId: charlie.id, followingId: bob.id },
      { followerId: alice.id, followingId: charlie.id },
    ])
    .returning();

  await db
    .update(artists)
    .set({ followerCount: 2, followingCount: 2, artworksCount: 2 })
    .where(eq(artists.id, alice.id));
  await db
    .update(artists)
    .set({ followerCount: 2, followingCount: 1, artworksCount: 2 })
    .where(eq(artists.id, bob.id));
  await db
    .update(artists)
    .set({ followerCount: 1, followingCount: 2, artworksCount: 2 })
    .where(eq(artists.id, charlie.id));

  console.log(`✅ Created ${insertedFollows.length} follow relationships`);

  console.log("🎉 Seeding completed successfully!");
}

main()
  .catch((e) => {
    console.error("❌ Seeding failed:", e);
    process.exit(1);
  })
  .finally(() => {
    process.exit(0);
  });
