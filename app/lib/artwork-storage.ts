import { ID } from "node-appwrite";
import { InputFile } from "node-appwrite/file";
import { storage } from "./appwrite";

const ARTWORKS_BUCKET_ID = "artworks";

function buildFileViewUrl(fileId: string): string {
  const endpoint = process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT!;
  const projectId = process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID!;
  return `${endpoint}/storage/buckets/${ARTWORKS_BUCKET_ID}/files/${fileId}/view?project=${projectId}`;
}

// Takes a `data:image/png;base64,...` URL and returns a public Storage URL.
// Keeping the DB column a short URL instead of a multi-MB data URL is the
// whole point of this move — it's what was bloating every feed query.
export async function uploadArtworkImage(dataUrl: string): Promise<string> {
  const base64 = dataUrl.slice(dataUrl.indexOf(",") + 1);
  const buffer = Buffer.from(base64, "base64");
  const fileId = ID.unique();

  await storage.createFile({
    bucketId: ARTWORKS_BUCKET_ID,
    fileId,
    file: InputFile.fromBuffer(buffer, `${fileId}.png`),
  });

  return buildFileViewUrl(fileId);
}
