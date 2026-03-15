import { relations } from "drizzle-orm";
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

export const artistsRelations = relations(artists, ({ one, many }) => ({
  role: one(roles, { fields: [artists.roleId], references: [roles.id] }),
  password: one(passwords, {
    fields: [artists.id],
    references: [passwords.artistId],
  }),
  artworks: many(artistsArtworks),
  comments: many(comments),
  likes: many(likes),
  followers: many(follows, { relationName: "following" }),
  following: many(follows, { relationName: "follower" }),
  roomOwner: many(rooms, { relationName: "RoomOwner" }),
  room: one(rooms, {
    fields: [artists.roomId],
    references: [rooms.id],
    relationName: "RoomArtists",
  }),
}));

export const passwordsRelations = relations(passwords, ({ one }) => ({
  artist: one(artists, {
    fields: [passwords.artistId],
    references: [artists.id],
  }),
}));

export const rolesRelations = relations(roles, ({ many }) => ({
  artists: many(artists),
  permissions: many(rolesPermissions),
}));

export const permissionsRelations = relations(permissions, ({ many }) => ({
  roles: many(rolesPermissions),
}));

export const rolesPermissionsRelations = relations(
  rolesPermissions,
  ({ one }) => ({
    role: one(roles, {
      fields: [rolesPermissions.roleId],
      references: [roles.id],
    }),
    permission: one(permissions, {
      fields: [rolesPermissions.permissionId],
      references: [permissions.id],
    }),
  }),
);

export const artworksRelations = relations(artworks, ({ one, many }) => ({
  room: one(rooms, { fields: [artworks.roomId], references: [rooms.id] }),
  artists: many(artistsArtworks),
  comments: many(comments),
  likes: many(likes),
}));

export const artistsArtworksRelations = relations(
  artistsArtworks,
  ({ one }) => ({
    artist: one(artists, {
      fields: [artistsArtworks.artistId],
      references: [artists.id],
    }),
    artwork: one(artworks, {
      fields: [artistsArtworks.artworkId],
      references: [artworks.id],
    }),
  }),
);

export const roomsRelations = relations(rooms, ({ one, many }) => ({
  owner: one(artists, {
    fields: [rooms.ownerId],
    references: [artists.id],
    relationName: "RoomOwner",
  }),
  artists: many(artists, { relationName: "RoomArtists" }),
  artwork: one(artworks, { fields: [rooms.id], references: [artworks.roomId] }),
}));

export const commentsRelations = relations(comments, ({ one }) => ({
  artist: one(artists, {
    fields: [comments.artistId],
    references: [artists.id],
  }),
  artwork: one(artworks, {
    fields: [comments.artworkId],
    references: [artworks.id],
  }),
}));

export const followsRelations = relations(follows, ({ one }) => ({
  follower: one(artists, {
    fields: [follows.followerId],
    references: [artists.id],
    relationName: "follower",
  }),
  following: one(artists, {
    fields: [follows.followingId],
    references: [artists.id],
    relationName: "following",
  }),
}));

export const likesRelations = relations(likes, ({ one }) => ({
  artist: one(artists, { fields: [likes.artistId], references: [artists.id] }),
  artwork: one(artworks, {
    fields: [likes.artworkId],
    references: [artworks.id],
  }),
}));
