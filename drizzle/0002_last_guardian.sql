ALTER TABLE "_prisma_migrations" DISABLE ROW LEVEL SECURITY;--> statement-breakpoint
DROP TABLE "_prisma_migrations" CASCADE;--> statement-breakpoint
ALTER TABLE "_ArtistToArtwork" DROP CONSTRAINT "_ArtistToArtwork_A_fkey";
--> statement-breakpoint
ALTER TABLE "_ArtistToArtwork" DROP CONSTRAINT "_ArtistToArtwork_B_fkey";
--> statement-breakpoint
ALTER TABLE "_PermissionToRole" DROP CONSTRAINT "_PermissionToRole_A_fkey";
--> statement-breakpoint
ALTER TABLE "_PermissionToRole" DROP CONSTRAINT "_PermissionToRole_B_fkey";
--> statement-breakpoint
ALTER TABLE "rooms" DROP CONSTRAINT "rooms_ownerId_fkey";
--> statement-breakpoint
DROP INDEX "_ArtistToArtwork_B_index";--> statement-breakpoint
ALTER TABLE "Artist" ALTER COLUMN "id" SET DATA TYPE uuid;--> statement-breakpoint
ALTER TABLE "Artist" ALTER COLUMN "id" SET DEFAULT gen_random_uuid();--> statement-breakpoint
ALTER TABLE "Artwork" ALTER COLUMN "id" SET DATA TYPE uuid;--> statement-breakpoint
ALTER TABLE "Artwork" ALTER COLUMN "id" SET DEFAULT gen_random_uuid();--> statement-breakpoint
ALTER TABLE "Comment" ALTER COLUMN "id" SET DATA TYPE uuid;--> statement-breakpoint
ALTER TABLE "Comment" ALTER COLUMN "id" SET DEFAULT gen_random_uuid();--> statement-breakpoint
ALTER TABLE "Password" ALTER COLUMN "artistId" SET DATA TYPE uuid;--> statement-breakpoint
ALTER TABLE "Permission" ALTER COLUMN "id" SET DATA TYPE uuid;--> statement-breakpoint
ALTER TABLE "Permission" ALTER COLUMN "id" SET DEFAULT gen_random_uuid();--> statement-breakpoint
ALTER TABLE "Role" ALTER COLUMN "id" SET DATA TYPE uuid;--> statement-breakpoint
ALTER TABLE "Role" ALTER COLUMN "id" SET DEFAULT gen_random_uuid();--> statement-breakpoint
ALTER TABLE "rooms" ALTER COLUMN "id" SET DATA TYPE uuid;--> statement-breakpoint
ALTER TABLE "rooms" ALTER COLUMN "id" SET DEFAULT gen_random_uuid();--> statement-breakpoint
ALTER TABLE "rooms" ALTER COLUMN "ownerId" SET DATA TYPE uuid;--> statement-breakpoint
ALTER TABLE "VerificationToken" ALTER COLUMN "id" SET DATA TYPE uuid;--> statement-breakpoint
ALTER TABLE "VerificationToken" ALTER COLUMN "id" SET DEFAULT gen_random_uuid();--> statement-breakpoint
CREATE INDEX "_ArtistToArtwork_B_index" ON "_ArtistToArtwork" USING btree ("B");