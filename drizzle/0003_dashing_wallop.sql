CREATE TYPE "public"."auth_token_type" AS ENUM('EMAIL_VERIFICATION', 'PASSWORD_RESET');--> statement-breakpoint
CREATE TYPE "public"."room_status" AS ENUM('WAITING', 'STARTING', 'ACTIVE', 'FINISHED');--> statement-breakpoint
CREATE TABLE "artists" (
	"id" text PRIMARY KEY NOT NULL,
	"username" text NOT NULL,
	"email" text NOT NULL,
	"email_verified" timestamp,
	"avatar" text,
	"follower_count" integer DEFAULT 0 NOT NULL,
	"following_count" integer DEFAULT 0 NOT NULL,
	"artworks_count" integer DEFAULT 0 NOT NULL,
	"role_id" text NOT NULL,
	"room_id" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "artists_username_unique" UNIQUE("username"),
	CONSTRAINT "artists_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "artists_artworks" (
	"artist_id" text NOT NULL,
	"artwork_id" text NOT NULL,
	CONSTRAINT "artists_artworks_artist_id_artwork_id_pk" PRIMARY KEY("artist_id","artwork_id")
);
--> statement-breakpoint
CREATE TABLE "artworks" (
	"id" text PRIMARY KEY NOT NULL,
	"theme" text NOT NULL,
	"artwork_image" text NOT NULL,
	"likes_count" integer DEFAULT 0 NOT NULL,
	"comments_count" integer DEFAULT 0 NOT NULL,
	"room_id" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "artworks_room_id_unique" UNIQUE("room_id")
);
--> statement-breakpoint
CREATE TABLE "comments" (
	"id" text PRIMARY KEY NOT NULL,
	"content" text NOT NULL,
	"artist_id" text NOT NULL,
	"artwork_id" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "follows" (
	"follower_id" text NOT NULL,
	"following_id" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "follows_follower_id_following_id_pk" PRIMARY KEY("follower_id","following_id")
);
--> statement-breakpoint
CREATE TABLE "likes" (
	"artist_id" text NOT NULL,
	"artwork_id" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "likes_artist_id_artwork_id_pk" PRIMARY KEY("artist_id","artwork_id")
);
--> statement-breakpoint
CREATE TABLE "passwords" (
	"hash" text NOT NULL,
	"artist_id" text NOT NULL,
	CONSTRAINT "passwords_artist_id_unique" UNIQUE("artist_id")
);
--> statement-breakpoint
CREATE TABLE "permissions" (
	"id" text PRIMARY KEY NOT NULL,
	"action" text NOT NULL,
	"entity" text NOT NULL,
	"access" text NOT NULL,
	CONSTRAINT "permissions_action_entity_access_unique" UNIQUE("action","entity","access")
);
--> statement-breakpoint
CREATE TABLE "roles" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	CONSTRAINT "roles_name_unique" UNIQUE("name")
);
--> statement-breakpoint
CREATE TABLE "roles_permissions" (
	"role_id" text NOT NULL,
	"permission_id" text NOT NULL,
	CONSTRAINT "roles_permissions_role_id_permission_id_pk" PRIMARY KEY("role_id","permission_id")
);
--> statement-breakpoint
CREATE TABLE "verification_tokens" (
	"id" text PRIMARY KEY NOT NULL,
	"target" text NOT NULL,
	"type" "auth_token_type" NOT NULL,
	"token" text NOT NULL,
	"secret" text NOT NULL,
	"expires_at" timestamp NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "verification_tokens_target_type_unique" UNIQUE("target","type")
);
--> statement-breakpoint
ALTER TABLE "Artist" DISABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "_ArtistToArtwork" DISABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "Artwork" DISABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "Comment" DISABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "Follows" DISABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "Like" DISABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "Password" DISABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "Permission" DISABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "_PermissionToRole" DISABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "Role" DISABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "VerificationToken" DISABLE ROW LEVEL SECURITY;--> statement-breakpoint
DROP TABLE "Artist" CASCADE;--> statement-breakpoint
DROP TABLE "_ArtistToArtwork" CASCADE;--> statement-breakpoint
DROP TABLE "Artwork" CASCADE;--> statement-breakpoint
DROP TABLE "Comment" CASCADE;--> statement-breakpoint
DROP TABLE "Follows" CASCADE;--> statement-breakpoint
DROP TABLE "Like" CASCADE;--> statement-breakpoint
DROP TABLE "Password" CASCADE;--> statement-breakpoint
DROP TABLE "Permission" CASCADE;--> statement-breakpoint
DROP TABLE "_PermissionToRole" CASCADE;--> statement-breakpoint
DROP TABLE "Role" CASCADE;--> statement-breakpoint
DROP TABLE "VerificationToken" CASCADE;--> statement-breakpoint
DROP INDEX "rooms_code_key";--> statement-breakpoint
ALTER TABLE "rooms" ALTER COLUMN "id" SET DATA TYPE text;--> statement-breakpoint
ALTER TABLE "rooms" ALTER COLUMN "id" DROP DEFAULT;--> statement-breakpoint
ALTER TABLE "rooms" ALTER COLUMN "status" DROP DEFAULT;--> statement-breakpoint
ALTER TABLE "rooms" ALTER COLUMN "status" SET DATA TYPE "public"."room_status" USING "status"::text::"public"."room_status";--> statement-breakpoint
ALTER TABLE "rooms" ALTER COLUMN "status" SET DEFAULT 'WAITING';--> statement-breakpoint
ALTER TABLE "rooms" ADD COLUMN "intro_message" text;--> statement-breakpoint
ALTER TABLE "rooms" ADD COLUMN "starts_at" timestamp;--> statement-breakpoint
ALTER TABLE "rooms" ADD COLUMN "starting_expires_at" timestamp;--> statement-breakpoint
ALTER TABLE "rooms" ADD COLUMN "expires_at" timestamp;--> statement-breakpoint
ALTER TABLE "rooms" ADD COLUMN "owner_id" text NOT NULL;--> statement-breakpoint
ALTER TABLE "artists" ADD CONSTRAINT "artists_role_id_roles_id_fk" FOREIGN KEY ("role_id") REFERENCES "public"."roles"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "artists" ADD CONSTRAINT "artists_room_id_rooms_id_fk" FOREIGN KEY ("room_id") REFERENCES "public"."rooms"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "artists_artworks" ADD CONSTRAINT "artists_artworks_artist_id_artists_id_fk" FOREIGN KEY ("artist_id") REFERENCES "public"."artists"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "artists_artworks" ADD CONSTRAINT "artists_artworks_artwork_id_artworks_id_fk" FOREIGN KEY ("artwork_id") REFERENCES "public"."artworks"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "artworks" ADD CONSTRAINT "artworks_room_id_rooms_id_fk" FOREIGN KEY ("room_id") REFERENCES "public"."rooms"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "comments" ADD CONSTRAINT "comments_artist_id_artists_id_fk" FOREIGN KEY ("artist_id") REFERENCES "public"."artists"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "comments" ADD CONSTRAINT "comments_artwork_id_artworks_id_fk" FOREIGN KEY ("artwork_id") REFERENCES "public"."artworks"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "follows" ADD CONSTRAINT "follows_follower_id_artists_id_fk" FOREIGN KEY ("follower_id") REFERENCES "public"."artists"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "follows" ADD CONSTRAINT "follows_following_id_artists_id_fk" FOREIGN KEY ("following_id") REFERENCES "public"."artists"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "likes" ADD CONSTRAINT "likes_artist_id_artists_id_fk" FOREIGN KEY ("artist_id") REFERENCES "public"."artists"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "likes" ADD CONSTRAINT "likes_artwork_id_artworks_id_fk" FOREIGN KEY ("artwork_id") REFERENCES "public"."artworks"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "passwords" ADD CONSTRAINT "passwords_artist_id_artists_id_fk" FOREIGN KEY ("artist_id") REFERENCES "public"."artists"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "roles_permissions" ADD CONSTRAINT "roles_permissions_role_id_roles_id_fk" FOREIGN KEY ("role_id") REFERENCES "public"."roles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "roles_permissions" ADD CONSTRAINT "roles_permissions_permission_id_permissions_id_fk" FOREIGN KEY ("permission_id") REFERENCES "public"."permissions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "rooms" DROP COLUMN "introMessage";--> statement-breakpoint
ALTER TABLE "rooms" DROP COLUMN "startsAt";--> statement-breakpoint
ALTER TABLE "rooms" DROP COLUMN "startingExpiresAt";--> statement-breakpoint
ALTER TABLE "rooms" DROP COLUMN "expiresAt";--> statement-breakpoint
ALTER TABLE "rooms" DROP COLUMN "ownerId";--> statement-breakpoint
ALTER TABLE "rooms" ADD CONSTRAINT "rooms_code_unique" UNIQUE("code");--> statement-breakpoint
DROP TYPE "public"."AuthTokenType";--> statement-breakpoint
DROP TYPE "public"."RoomStatus";