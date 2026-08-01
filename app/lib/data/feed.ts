import { DATA_BACKEND } from "./backend";
import * as drizzleImpl from "./feed.drizzle";
import * as appwriteImpl from "./feed.appwrite";

export type { FeedArtwork, FeedComment, FeedCursor } from "./feed.drizzle";

const impl = DATA_BACKEND === "appwrite" ? appwriteImpl : drizzleImpl;

export const getFeedChunk = impl.getFeedChunk;
