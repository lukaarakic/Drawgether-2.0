import prisma from "@/app/lib/db";
import { redirect } from "next/navigation";

export async function searchArtistsAction(formData: FormData) {
  "use server";

  const search = formData.get("search") as string;
  redirect(`/search?search=${encodeURIComponent(search)}`);
}

export async function searchArtist(searchTerm: string) {
  if (!searchTerm.trim()) {
    return [];
  }

  const artists = await prisma.artist.findMany({
    where: {
      username: {
        contains: searchTerm,
        mode: "insensitive",
      },
    },
    select: {
      id: true,
      username: true,
    },
  });

  return artists;
}
