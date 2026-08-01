import { DATA_BACKEND } from "./backend";
import * as drizzleImpl from "./auth.drizzle";
import * as appwriteImpl from "./auth.appwrite";

const impl = DATA_BACKEND === "appwrite" ? appwriteImpl : drizzleImpl;

export const getArtistWithRole = impl.getArtistWithRole;
export const getArtistCredentialsByEmail = impl.getArtistCredentialsByEmail;
export const findArtistByEmailOrUsername = impl.findArtistByEmailOrUsername;
export const getRoleByName = impl.getRoleByName;
export const checkArtistAvailability = impl.checkArtistAvailability;
export const createArtistAccount = impl.createArtistAccount;
export const updateArtistPasswordHash = impl.updateArtistPasswordHash;
export const upsertVerificationToken = impl.upsertVerificationToken;
export const findVerificationToken = impl.findVerificationToken;
export const deleteVerificationToken = impl.deleteVerificationToken;
