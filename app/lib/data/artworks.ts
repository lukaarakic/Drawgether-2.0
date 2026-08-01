import { DATA_BACKEND } from "./backend";
import * as drizzleImpl from "./artworks.drizzle";
import * as appwriteImpl from "./artworks.appwrite";

const impl = DATA_BACKEND === "appwrite" ? appwriteImpl : drizzleImpl;

export const createArtworkForRoom = impl.createArtworkForRoom;
export const getArtworkWithArtistsAndComments = impl.getArtworkWithArtistsAndComments;
export const getArtworkWithArtistsCommentsAndLikes =
  impl.getArtworkWithArtistsCommentsAndLikes;
export const getArtworkCommentsOnly = impl.getArtworkCommentsOnly;
export const getArtworkOwnerIds = impl.getArtworkOwnerIds;
export const deleteArtworkById = impl.deleteArtworkById;
