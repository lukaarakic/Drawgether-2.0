import {
  pgTable,
  pgEnum,
  text,
  timestamp,
  integer,
  varchar,
  primaryKey,
  unique,
} from "drizzle-orm/pg-core";
import { createId } from "@paralleldrive/cuid2";

// --- ENUMS ---
export const authTokenTypeEnum = pgEnum("auth_token_type", [
  "EMAIL_VERIFICATION",
  "PASSWORD_RESET",
]);
export const roomStatusEnum = pgEnum("room_status", [
  "WAITING",
  "STARTING",
  "ACTIVE",
  "FINISHED",
]);

export type AuthTokenType = (typeof authTokenTypeEnum.enumValues)[number];
export type RoomStatus = (typeof roomStatusEnum.enumValues)[number];

export type Artist = typeof artists.$inferSelect;

// --- PERMISSIONS ---
export const roles = pgTable("roles", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => createId()),
  name: text("name").unique().notNull(),
});

export const permissions = pgTable(
  "permissions",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => createId()),
    action: text("action").notNull(),
    entity: text("entity").notNull(),
    access: text("access").notNull(),
  },
  (t) => [unique().on(t.action, t.entity, t.access)],
);

export const rolesPermissions = pgTable(
  "roles_permissions",
  {
    roleId: text("role_id")
      .notNull()
      .references(() => roles.id, { onDelete: "cascade" }),
    permissionId: text("permission_id")
      .notNull()
      .references(() => permissions.id, { onDelete: "cascade" }),
  },
  (t) => [primaryKey({ columns: [t.roleId, t.permissionId] })],
);

// --- GAME & ARTWORK ---
export const rooms = pgTable("rooms", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => createId()),
  introMessage: text("intro_message"),
  theme: text("theme"),
  status: roomStatusEnum("status").default("WAITING").notNull(),
  code: varchar("code", { length: 6 }).unique().notNull(),
  startsAt: timestamp("starts_at", { mode: "date" }),
  startingExpiresAt: timestamp("starting_expires_at", { mode: "date" }),
  expiresAt: timestamp("expires_at", { mode: "date" }),
  ownerId: text("owner_id").notNull(),
});

export const artworks = pgTable("artworks", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => createId()),
  theme: text("theme").notNull(),
  artworkImage: text("artwork_image").notNull(),
  likesCount: integer("likes_count").default(0).notNull(),
  commentsCount: integer("comments_count").default(0).notNull(),
  roomId: text("room_id")
    .unique()
    .references(() => rooms.id),
  createdAt: timestamp("created_at", { mode: "date" }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { mode: "date" })
    .defaultNow()
    .$onUpdate(() => new Date())
    .notNull(),
});

// --- USER / ARTIST ENTITY ---
export const artists = pgTable("artists", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => createId()),
  username: text("username").unique().notNull(),
  email: text("email").unique().notNull(),
  emailVerified: timestamp("email_verified", { mode: "date" }),
  avatar: text("avatar"),

  followerCount: integer("follower_count").default(0).notNull(),
  followingCount: integer("following_count").default(0).notNull(),
  artworksCount: integer("artworks_count").default(0).notNull(),

  roleId: text("role_id")
    .notNull()
    .references(() => roles.id),
  roomId: text("room_id").references(() => rooms.id),

  createdAt: timestamp("created_at", { mode: "date" }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { mode: "date" })
    .defaultNow()
    .$onUpdate(() => new Date())
    .notNull(),
});

export const artistsArtworks = pgTable(
  "artists_artworks",
  {
    artistId: text("artist_id")
      .notNull()
      .references(() => artists.id, { onDelete: "cascade" }),
    artworkId: text("artwork_id")
      .notNull()
      .references(() => artworks.id, { onDelete: "cascade" }),
  },
  (t) => [primaryKey({ columns: [t.artistId, t.artworkId] })],
);

// --- AUTHENTICATION ---
export const passwords = pgTable("passwords", {
  hash: text("hash").notNull(),
  artistId: text("artist_id")
    .unique()
    .notNull()
    .references(() => artists.id, { onDelete: "cascade", onUpdate: "cascade" }),
});

export const verificationTokens = pgTable(
  "verification_tokens",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => createId()),
    target: text("target").notNull(),
    type: authTokenTypeEnum("type").notNull(),
    token: text("token").notNull(),
    secret: text("secret").notNull(),
    expiresAt: timestamp("expires_at", { mode: "date" }).notNull(),
    createdAt: timestamp("created_at", { mode: "date" }).defaultNow().notNull(),
  },
  (t) => [unique().on(t.target, t.type)],
);

// --- INTERACTIONS ---
export const comments = pgTable("comments", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => createId()),
  content: text("content").notNull(),
  artistId: text("artist_id")
    .notNull()
    .references(() => artists.id, { onDelete: "cascade" }),
  artworkId: text("artwork_id")
    .notNull()
    .references(() => artworks.id, { onDelete: "cascade" }),
  createdAt: timestamp("created_at", { mode: "date" }).defaultNow().notNull(),
});

export const follows = pgTable(
  "follows",
  {
    followerId: text("follower_id")
      .notNull()
      .references(() => artists.id, { onDelete: "cascade" }),
    followingId: text("following_id")
      .notNull()
      .references(() => artists.id, { onDelete: "cascade" }),
    createdAt: timestamp("created_at", { mode: "date" }).defaultNow().notNull(),
  },
  (t) => [primaryKey({ columns: [t.followerId, t.followingId] })],
);

export const likes = pgTable(
  "likes",
  {
    artistId: text("artist_id")
      .notNull()
      .references(() => artists.id, { onDelete: "cascade" }),
    artworkId: text("artwork_id")
      .notNull()
      .references(() => artworks.id, { onDelete: "cascade" }),
    createdAt: timestamp("created_at", { mode: "date" }).defaultNow().notNull(),
  },
  (t) => [primaryKey({ columns: [t.artistId, t.artworkId] })],
);
