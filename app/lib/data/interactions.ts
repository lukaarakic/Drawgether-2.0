import { DATA_BACKEND } from "./backend";
import * as drizzleImpl from "./interactions.drizzle";
import * as appwriteImpl from "./interactions.appwrite";

const impl = DATA_BACKEND === "appwrite" ? appwriteImpl : drizzleImpl;

export const getLikedArtworkIds = impl.getLikedArtworkIds;
export const isArtworkLikedByArtist = impl.isArtworkLikedByArtist;
export const toggleArtworkLike = impl.toggleArtworkLike;
export const findFollow = impl.findFollow;
export const toggleFollow = impl.toggleFollow;
export const getCommentOwnerId = impl.getCommentOwnerId;
export const addComment = impl.addComment;
export const deleteComment = impl.deleteComment;
