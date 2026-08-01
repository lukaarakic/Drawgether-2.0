import type { Models } from "node-appwrite";
import type { RoomStatus } from "@/drizzle/types";

// Appwrite rows carry $id/$createdAt/$updatedAt (ISO strings); the rest of
// the app was written against Drizzle's inferred shapes (id, Date columns).
// These mappers translate one to the other so callers never need to know
// which backend answered them.

function toDateOrNull(value: unknown): Date | null {
  return typeof value === "string" ? new Date(value) : null;
}

export type MappedArtist = {
  id: string;
  username: string;
  email: string;
  emailVerified: Date | null;
  avatar: string | null;
  followerCount: number;
  followingCount: number;
  artworksCount: number;
  roleId: string;
  roomId: string | null;
  createdAt: Date;
  updatedAt: Date;
};

export function mapArtist(row: Models.DefaultRow): MappedArtist {
  return {
    id: row.$id,
    username: row.username,
    email: row.email,
    emailVerified: toDateOrNull(row.emailVerified),
    avatar: row.avatar ?? null,
    followerCount: row.followerCount ?? 0,
    followingCount: row.followingCount ?? 0,
    artworksCount: row.artworksCount ?? 0,
    roleId: row.roleId,
    roomId: row.roomId ?? null,
    createdAt: new Date(row.$createdAt),
    updatedAt: new Date(row.$updatedAt),
  };
}

export type MappedRoom = {
  id: string;
  introMessage: string | null;
  theme: string | null;
  status: RoomStatus;
  code: string;
  startsAt: Date | null;
  startingExpiresAt: Date | null;
  expiresAt: Date | null;
  ownerId: string;
};

export function mapRoom(row: Models.DefaultRow): MappedRoom {
  return {
    id: row.$id,
    introMessage: row.introMessage ?? null,
    theme: row.theme ?? null,
    status: row.status as RoomStatus,
    code: row.code,
    startsAt: toDateOrNull(row.startsAt),
    startingExpiresAt: toDateOrNull(row.startingExpiresAt),
    expiresAt: toDateOrNull(row.expiresAt),
    ownerId: row.ownerId,
  };
}

export type MappedArtwork = {
  id: string;
  theme: string;
  artworkImage: string;
  likesCount: number;
  commentsCount: number;
  roomId: string | null;
  createdAt: Date;
  updatedAt: Date;
};

export function mapArtwork(row: Models.DefaultRow): MappedArtwork {
  return {
    id: row.$id,
    theme: row.theme,
    artworkImage: row.artworkImage,
    likesCount: row.likesCount ?? 0,
    commentsCount: row.commentsCount ?? 0,
    roomId: row.roomId ?? null,
    createdAt: new Date(row.$createdAt),
    updatedAt: new Date(row.$updatedAt),
  };
}

export type MappedComment = {
  id: string;
  content: string;
  artistId: string;
  artworkId: string;
  createdAt: Date;
};

export function mapComment(row: Models.DefaultRow): MappedComment {
  return {
    id: row.$id,
    content: row.content,
    artistId: row.artistId,
    artworkId: row.artworkId,
    createdAt: new Date(row.$createdAt),
  };
}
