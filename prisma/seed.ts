import prisma from "@/app/lib/db";

async function main() {
  console.log("🌱 Seeding database...");

  // Clean up existing data (in reverse order of dependencies)
  await prisma.like.deleteMany();
  await prisma.comment.deleteMany();
  await prisma.follows.deleteMany();
  await prisma.artwork.deleteMany();
  await prisma.room.deleteMany();
  await prisma.password.deleteMany();
  await prisma.artist.deleteMany();
  await prisma.role.deleteMany();
  await prisma.permission.deleteMany();

  console.log("✅ Cleaned up existing data");

  // --- PERMISSIONS ---
  const permissions = await Promise.all([
    prisma.permission.create({
      data: { action: "create", entity: "artwork", access: "own" },
    }),
    prisma.permission.create({
      data: { action: "read", entity: "artwork", access: "any" },
    }),
    prisma.permission.create({
      data: { action: "update", entity: "artwork", access: "own" },
    }),
    prisma.permission.create({
      data: { action: "delete", entity: "artwork", access: "own" },
    }),
    prisma.permission.create({
      data: { action: "delete", entity: "artwork", access: "any" },
    }),
    prisma.permission.create({
      data: { action: "create", entity: "comment", access: "own" },
    }),
    prisma.permission.create({
      data: { action: "delete", entity: "comment", access: "own" },
    }),
    prisma.permission.create({
      data: { action: "delete", entity: "comment", access: "any" },
    }),
    prisma.permission.create({
      data: { action: "manage", entity: "user", access: "any" },
    }),
  ]);

  console.log(`✅ Created ${permissions.length} permissions`);

  // --- ROLES ---
  const userRole = await prisma.role.create({
    data: {
      name: "user",
      permissions: {
        connect: permissions
          .filter((p) =>
            [
              "create:artwork:own",
              "read:artwork:any",
              "update:artwork:own",
              "delete:artwork:own",
              "create:comment:own",
              "delete:comment:own",
            ].includes(`${p.action}:${p.entity}:${p.access}`),
          )
          .map((p) => ({ id: p.id })),
      },
    },
  });

  const adminRole = await prisma.role.create({
    data: {
      name: "admin",
      permissions: {
        connect: permissions.map((p) => ({ id: p.id })),
      },
    },
  });

  console.log("✅ Created roles: user, admin");

  // --- ARTISTS ---
  // This is a verified bcrypt hash (10 rounds) for the word: "password"
  const hashedPassword =
    "$2a$10$BQToDNdBtBKCvnrTmMi5m.NK.7i6Qx7YASs.jTkE86I5zqxzE8klC";

  const artists = await Promise.all([
    prisma.artist.create({
      data: {
        username: "alice_draws",
        email: "alice@example.com",
        avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=alice",
        roleId: userRole.id,
        password: {
          create: { hash: hashedPassword },
        },
      },
    }),
    prisma.artist.create({
      data: {
        username: "bob_artist",
        email: "bob@example.com",
        avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=bob",
        roleId: userRole.id,
        password: {
          create: { hash: hashedPassword },
        },
      },
    }),
    prisma.artist.create({
      data: {
        username: "charlie_creative",
        email: "charlie@example.com",
        avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=charlie",
        roleId: userRole.id,
        password: {
          create: { hash: hashedPassword },
        },
      },
    }),
    prisma.artist.create({
      data: {
        username: "netrunners",
        email: "admin@drawgether.com",
        emailVerified: new Date(),
        avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=netrunners",
        roleId: adminRole.id,
        password: {
          create: { hash: hashedPassword },
        },
      },
    }),
  ]);

  const [alice, bob, charlie, netrunners] = artists;
  console.log(`✅ Created ${artists.length} artists`);

  // --- ROOMS ---
  const rooms = await Promise.all([
    prisma.room.create({
      data: {
        theme: "sunset landscape",
        status: "FINISHED",
        startsAt: new Date(Date.now() - 3600000 * 2),
        expiresAt: new Date(Date.now() - 3600000),
      },
    }),
    prisma.room.create({
      data: {
        theme: "cute cat",
        status: "FINISHED",
        startsAt: new Date(Date.now() - 3600000 * 4),
        expiresAt: new Date(Date.now() - 3600000 * 3),
      },
    }),
    prisma.room.create({
      data: {
        theme: "space adventure",
        status: "ACTIVE",
        startsAt: new Date(),
        expiresAt: new Date(Date.now() + 3600000),
      },
    }),
    prisma.room.create({
      data: {
        theme: "underwater world",
        status: "WAITING",
      },
    }),
  ]);

  console.log(`✅ Created ${rooms.length} rooms`);

  // --- ARTWORKS ---
  const artworks = await Promise.all([
    prisma.artwork.create({
      data: {
        theme: "sunset landscape",
        artworkImage:
          "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==",
        artists: { connect: [{ id: alice.id }] },
        roomId: rooms[0].id,
      },
    }),
    prisma.artwork.create({
      data: {
        theme: "cute cat",
        artworkImage:
          "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==",
        artists: { connect: [{ id: bob.id }, { id: charlie.id }] },
        roomId: rooms[1].id,
      },
    }),
    prisma.artwork.create({
      data: {
        theme: "abstract shapes",
        artworkImage:
          "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==",
        artists: { connect: [{ id: charlie.id }] },
      },
    }),
    prisma.artwork.create({
      data: {
        theme: "mountain view",
        artworkImage:
          "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+P+/HgAFhAJ/wlseKgAAAABJRU5ErkJggg==",
        artists: { connect: [{ id: alice.id }, { id: bob.id }] },
      },
    }),
  ]);

  console.log(`✅ Created ${artworks.length} artworks`);

  // --- COMMENTS ---
  const comments = await Promise.all([
    prisma.comment.create({
      data: {
        content: "Love the colors in this one! 🎨",
        artistId: bob.id,
        artworkId: artworks[0].id,
      },
    }),
    prisma.comment.create({
      data: {
        content: "This is amazing work!",
        artistId: charlie.id,
        artworkId: artworks[0].id,
      },
    }),
    prisma.comment.create({
      data: {
        content: "Such a cute cat! 🐱",
        artistId: alice.id,
        artworkId: artworks[1].id,
      },
    }),
    prisma.comment.create({
      data: {
        content: "Beautiful abstract piece",
        artistId: bob.id,
        artworkId: artworks[2].id,
      },
    }),
    prisma.comment.create({
      data: {
        content: "The mountains look so peaceful",
        artistId: charlie.id,
        artworkId: artworks[3].id,
      },
    }),
  ]);

  // Update artwork comment counts
  await prisma.artwork.update({
    where: { id: artworks[0].id },
    data: { commentsCount: 2 },
  });
  await prisma.artwork.update({
    where: { id: artworks[1].id },
    data: { commentsCount: 1 },
  });
  await prisma.artwork.update({
    where: { id: artworks[2].id },
    data: { commentsCount: 1 },
  });
  await prisma.artwork.update({
    where: { id: artworks[3].id },
    data: { commentsCount: 1 },
  });

  console.log(`✅ Created ${comments.length} comments`);

  // --- LIKES ---
  const likes = await Promise.all([
    prisma.like.create({
      data: { artistId: bob.id, artworkId: artworks[0].id },
    }),
    prisma.like.create({
      data: { artistId: charlie.id, artworkId: artworks[0].id },
    }),
    prisma.like.create({
      data: { artistId: netrunners.id, artworkId: artworks[0].id }, // <-- Updated to netrunners
    }),
    prisma.like.create({
      data: { artistId: alice.id, artworkId: artworks[1].id },
    }),
    prisma.like.create({
      data: { artistId: charlie.id, artworkId: artworks[1].id },
    }),
    prisma.like.create({
      data: { artistId: alice.id, artworkId: artworks[2].id },
    }),
    prisma.like.create({
      data: { artistId: bob.id, artworkId: artworks[3].id },
    }),
  ]);

  // Update artwork like counts
  await prisma.artwork.update({
    where: { id: artworks[0].id },
    data: { likesCount: 3 },
  });
  await prisma.artwork.update({
    where: { id: artworks[1].id },
    data: { likesCount: 2 },
  });
  await prisma.artwork.update({
    where: { id: artworks[2].id },
    data: { likesCount: 1 },
  });
  await prisma.artwork.update({
    where: { id: artworks[3].id },
    data: { likesCount: 1 },
  });

  console.log(`✅ Created ${likes.length} likes`);

  // --- FOLLOWS ---
  const follows = await Promise.all([
    prisma.follows.create({
      data: { followerId: bob.id, followingId: alice.id },
    }),
    prisma.follows.create({
      data: { followerId: charlie.id, followingId: alice.id },
    }),
    prisma.follows.create({
      data: { followerId: alice.id, followingId: bob.id },
    }),
    prisma.follows.create({
      data: { followerId: charlie.id, followingId: bob.id },
    }),
    prisma.follows.create({
      data: { followerId: alice.id, followingId: charlie.id },
    }),
  ]);

  // Update follower/following counts
  await prisma.artist.update({
    where: { id: alice.id },
    data: { followerCount: 2, followingCount: 2, artworksCount: 2 },
  });
  await prisma.artist.update({
    where: { id: bob.id },
    data: { followerCount: 2, followingCount: 1, artworksCount: 2 },
  });
  await prisma.artist.update({
    where: { id: charlie.id },
    data: { followerCount: 1, followingCount: 2, artworksCount: 2 },
  });

  console.log(`✅ Created ${follows.length} follow relationships`);

  console.log("🎉 Seeding completed successfully!");
}

main()
  .catch((e) => {
    console.error("❌ Seeding failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
