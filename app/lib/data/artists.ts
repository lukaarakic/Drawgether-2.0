import { DATA_BACKEND } from "./backend";
import * as drizzleImpl from "./artists.drizzle";
import * as appwriteImpl from "./artists.appwrite";

const impl = DATA_BACKEND === "appwrite" ? appwriteImpl : drizzleImpl;

export const getArtistProfileByUsername = impl.getArtistProfileByUsername;
export const getArtistSettingsByUsername = impl.getArtistSettingsByUsername;
export const searchArtistsByUsername = impl.searchArtistsByUsername;
export const markArtistEmailVerified = impl.markArtistEmailVerified;
