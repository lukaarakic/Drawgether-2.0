import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

import { eq, like } from "drizzle-orm";

// Loaded dynamically (after dotenv.config() above has run) rather than as
// static imports: static imports get hoisted above this file's own
// top-level code, so these modules would read process.env before dotenv
// had a chance to populate it.
let db: typeof import("@/app/lib/db").db;
let artworks: typeof import("@/drizzle/schema").artworks;
let uploadArtworkImage: typeof import("@/app/lib/artwork-storage").uploadArtworkImage;

// One-off migration: existing artworks store the full base64 PNG in the
// artworkImage column (the thing that was bloating every feed query).
// Uploads each to Appwrite Storage and rewrites the column to the file URL.
// Safe to re-run — only touches rows still starting with "data:".
async function main() {
  ({ db } = await import("@/app/lib/db"));
  ({ artworks } = await import("@/drizzle/schema"));
  ({ uploadArtworkImage } = await import("@/app/lib/artwork-storage"));

  const rows = await db
    .select({ id: artworks.id, artworkImage: artworks.artworkImage })
    .from(artworks)
    .where(like(artworks.artworkImage, "data:%"));

  console.log(`Found ${rows.length} artwork(s) still storing a data URL.`);

  let migrated = 0;
  for (const row of rows) {
    try {
      const url = await uploadArtworkImage(row.artworkImage);
      await db
        .update(artworks)
        .set({ artworkImage: url })
        .where(eq(artworks.id, row.id));
      migrated++;
      console.log(`  migrated: ${row.id} -> ${url}`);
    } catch (err) {
      console.error(`  failed: ${row.id}`, err);
    }
  }

  console.log(`\nDone. Migrated ${migrated}/${rows.length}.`);
  process.exit(0);
}

main().catch((err) => {
  console.error("Backfill failed:", err);
  process.exit(1);
});
