export const DATA_BACKEND: "drizzle" | "appwrite" =
  process.env.DATA_BACKEND === "appwrite" ? "appwrite" : "drizzle";
