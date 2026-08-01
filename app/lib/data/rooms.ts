import { DATA_BACKEND } from "./backend";
import * as drizzleImpl from "./rooms.drizzle";
import * as appwriteImpl from "./rooms.appwrite";

const impl = DATA_BACKEND === "appwrite" ? appwriteImpl : drizzleImpl;

export const createRoomWithOwner = impl.createRoomWithOwner;
export const getRoomForLobby = impl.getRoomForLobby;
export const getRoomJoinInfo = impl.getRoomJoinInfo;
export const getArtistRoomId = impl.getArtistRoomId;
export const joinRoomAsArtist = impl.joinRoomAsArtist;
export const getRoomOwnerId = impl.getRoomOwnerId;
export const removeArtistFromRoom = impl.removeArtistFromRoom;
export const getArtistRoomCode = impl.getArtistRoomCode;
export const getHostRoomSnapshot = impl.getHostRoomSnapshot;
export const beginStartCountdown = impl.beginStartCountdown;
export const cacheRoomOpening = impl.cacheRoomOpening;
export const cancelStartCountdown = impl.cancelStartCountdown;
export const finalizeStartingCountdown = impl.finalizeStartingCountdown;
export const getRoomActivationSnapshot = impl.getRoomActivationSnapshot;
export const activateRoomState = impl.activateRoomState;
export const isArtistInRoom = impl.isArtistInRoom;
export const getRoomThemeWithArtistIds = impl.getRoomThemeWithArtistIds;
