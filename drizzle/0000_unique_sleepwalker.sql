-- Current sql file was generated after introspecting the database
-- If you want to run this migration please uncomment this code before executing migrations
/*
CREATE TYPE "public"."AuthTokenType" AS ENUM('EMAIL_VERIFICATION', 'PASSWORD_RESET');--> statement-breakpoint
CREATE TYPE "public"."RoomStatus" AS ENUM('WAITING', 'STARTING', 'ACTIVE', 'FINISHED');--> statement-breakpoint
CREATE TABLE "Password" (
	"hash" text NOT NULL,
	"artistId" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "Artist" (
	"id" text PRIMARY KEY NOT NULL,
	"username" text NOT NULL,
	"email" text NOT NULL,
	"emailVerified" timestamp(3),
	"avatar" text,
	"followerCount" integer DEFAULT 0 NOT NULL,
	"followingCount" integer DEFAULT 0 NOT NULL,
	"artworksCount" integer DEFAULT 0 NOT NULL,
	"roleId" text NOT NULL,
	"created_at" timestamp(3) DEFAULT CURRENT_TIMESTAMP NOT NULL,
	"updated_at" timestamp(3) NOT NULL,
	"roomId" text
);
--> statement-breakpoint
CREATE TABLE "VerificationToken" (
	"id" text PRIMARY KEY NOT NULL,
	"target" text NOT NULL,
	"type" "AuthTokenType" NOT NULL,
	"token" text NOT NULL,
	"secret" text NOT NULL,
	"expiresAt" timestamp(3) NOT NULL,
	"createdAt" timestamp(3) DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
CREATE TABLE "Artwork" (
	"id" text PRIMARY KEY NOT NULL,
	"theme" text NOT NULL,
	"artworkImage" text NOT NULL,
	"likesCount" integer DEFAULT 0 NOT NULL,
	"commentsCount" integer DEFAULT 0 NOT NULL,
	"roomId" text,
	"createdAt" timestamp(3) DEFAULT CURRENT_TIMESTAMP NOT NULL,
	"updatedAt" timestamp(3) NOT NULL
);
--> statement-breakpoint
CREATE TABLE "Comment" (
	"id" text PRIMARY KEY NOT NULL,
	"content" text NOT NULL,
	"artistId" text NOT NULL,
	"artworkId" text NOT NULL,
	"created_at" timestamp(3) DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
CREATE TABLE "Role" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "Permission" (
	"id" text PRIMARY KEY NOT NULL,
	"action" text NOT NULL,
	"entity" text NOT NULL,
	"access" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "rooms" (
	"id" text PRIMARY KEY NOT NULL,
	"introMessage" text,
	"theme" text,
	"status" "RoomStatus" DEFAULT 'WAITING' NOT NULL,
	"code" varchar(6) NOT NULL,
	"startsAt" timestamp(3),
	"startingExpiresAt" timestamp(3),
	"expiresAt" timestamp(3),
	"ownerId" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "_prisma_migrations" (
	"id" varchar(36) PRIMARY KEY NOT NULL,
	"checksum" varchar(64) NOT NULL,
	"finished_at" timestamp with time zone,
	"migration_name" varchar(255) NOT NULL,
	"logs" text,
	"rolled_back_at" timestamp with time zone,
	"started_at" timestamp with time zone DEFAULT now() NOT NULL,
	"applied_steps_count" integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE TABLE "_ArtistToArtwork" (
	"A" text NOT NULL,
	"B" text NOT NULL,
	CONSTRAINT "_ArtistToArtwork_AB_pkey" PRIMARY KEY("A","B")
);
--> statement-breakpoint
CREATE TABLE "_PermissionToRole" (
	"A" text NOT NULL,
	"B" text NOT NULL,
	CONSTRAINT "_PermissionToRole_AB_pkey" PRIMARY KEY("A","B")
);
--> statement-breakpoint
CREATE TABLE "Follows" (
	"followerId" text NOT NULL,
	"followingId" text NOT NULL,
	"createdAt" timestamp(3) DEFAULT CURRENT_TIMESTAMP NOT NULL,
	CONSTRAINT "Follows_pkey" PRIMARY KEY("followerId","followingId")
);
--> statement-breakpoint
CREATE TABLE "Like" (
	"artistId" text NOT NULL,
	"artworkId" text NOT NULL,
	"createdAt" timestamp(3) DEFAULT CURRENT_TIMESTAMP NOT NULL,
	CONSTRAINT "Like_pkey" PRIMARY KEY("artistId","artworkId")
);
--> statement-breakpoint
ALTER TABLE "Password" ADD CONSTRAINT "Password_artistId_fkey" FOREIGN KEY ("artistId") REFERENCES "public"."Artist"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "Artist" ADD CONSTRAINT "Artist_roleId_fkey" FOREIGN KEY ("roleId") REFERENCES "public"."Role"("id") ON DELETE restrict ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "Artist" ADD CONSTRAINT "Artist_roomId_fkey" FOREIGN KEY ("roomId") REFERENCES "public"."rooms"("id") ON DELETE set null ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "Artwork" ADD CONSTRAINT "Artwork_roomId_fkey" FOREIGN KEY ("roomId") REFERENCES "public"."rooms"("id") ON DELETE set null ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "Comment" ADD CONSTRAINT "Comment_artistId_fkey" FOREIGN KEY ("artistId") REFERENCES "public"."Artist"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "Comment" ADD CONSTRAINT "Comment_artworkId_fkey" FOREIGN KEY ("artworkId") REFERENCES "public"."Artwork"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "rooms" ADD CONSTRAINT "rooms_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "public"."Artist"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "_ArtistToArtwork" ADD CONSTRAINT "_ArtistToArtwork_A_fkey" FOREIGN KEY ("A") REFERENCES "public"."Artist"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "_ArtistToArtwork" ADD CONSTRAINT "_ArtistToArtwork_B_fkey" FOREIGN KEY ("B") REFERENCES "public"."Artwork"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "_PermissionToRole" ADD CONSTRAINT "_PermissionToRole_A_fkey" FOREIGN KEY ("A") REFERENCES "public"."Permission"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "_PermissionToRole" ADD CONSTRAINT "_PermissionToRole_B_fkey" FOREIGN KEY ("B") REFERENCES "public"."Role"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "Follows" ADD CONSTRAINT "Follows_followerId_fkey" FOREIGN KEY ("followerId") REFERENCES "public"."Artist"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "Follows" ADD CONSTRAINT "Follows_followingId_fkey" FOREIGN KEY ("followingId") REFERENCES "public"."Artist"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "Like" ADD CONSTRAINT "Like_artistId_fkey" FOREIGN KEY ("artistId") REFERENCES "public"."Artist"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "Like" ADD CONSTRAINT "Like_artworkId_fkey" FOREIGN KEY ("artworkId") REFERENCES "public"."Artwork"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
CREATE UNIQUE INDEX "Password_artistId_key" ON "Password" USING btree ("artistId" text_ops);--> statement-breakpoint
CREATE UNIQUE INDEX "Artist_email_key" ON "Artist" USING btree ("email" text_ops);--> statement-breakpoint
CREATE UNIQUE INDEX "Artist_username_key" ON "Artist" USING btree ("username" text_ops);--> statement-breakpoint
CREATE UNIQUE INDEX "VerificationToken_target_type_key" ON "VerificationToken" USING btree ("target" text_ops,"type" text_ops);--> statement-breakpoint
CREATE UNIQUE INDEX "Artwork_roomId_key" ON "Artwork" USING btree ("roomId" text_ops);--> statement-breakpoint
CREATE UNIQUE INDEX "Role_name_key" ON "Role" USING btree ("name" text_ops);--> statement-breakpoint
CREATE UNIQUE INDEX "Permission_action_entity_access_key" ON "Permission" USING btree ("action" text_ops,"entity" text_ops,"access" text_ops);--> statement-breakpoint
CREATE UNIQUE INDEX "rooms_code_key" ON "rooms" USING btree ("code" text_ops);--> statement-breakpoint
CREATE INDEX "_ArtistToArtwork_B_index" ON "_ArtistToArtwork" USING btree ("B" text_ops);--> statement-breakpoint
CREATE INDEX "_PermissionToRole_B_index" ON "_PermissionToRole" USING btree ("B" text_ops);
*/