import { Client, TablesDB, Storage } from "node-appwrite";

const client = new Client()
  .setEndpoint(process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT!)
  .setProject(process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID!)
  .setKey(process.env.APPWRITE_API_KEY!);

export const tablesDB = new TablesDB(client);
export const storage = new Storage(client);

export const APPWRITE_DATABASE_ID = process.env.APPWRITE_DATABASE_ID!;
