import { redirect } from "next/navigation";
import { searchArtistsByUsername } from "./data/artists";

export async function searchArtistsAction(formData: FormData) {
  "use server";

  const search = formData.get("search") as string;
  redirect(`/search?search=${encodeURIComponent(search)}`);
}

export async function searchArtist(searchTerm: string) {
  if (!searchTerm.trim()) {
    return [];
  }

  return searchArtistsByUsername(searchTerm);
}
