import { redirect } from "next/navigation";
import { db } from "./db";

export async function searchArtistsAction(formData: FormData) {
  "use server";

  const search = formData.get("search") as string;
  redirect(`/search?search=${encodeURIComponent(search)}`);
}

export async function searchArtist(searchTerm: string) {
  if (!searchTerm.trim()) {
    return [];
  }

  const artists = await db.query.artists.findMany({
    where: (a, { ilike }) => ilike(a.username, `%${searchTerm}%`),
    columns: {
      id: true,
      username: true,
    },
  });

  return artists;
}
