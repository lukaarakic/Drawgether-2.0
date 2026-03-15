import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/app/lib/auth-utils";
import { getFeedChunk } from "@/app/(app)/feed/feed-query";

export async function GET(request: NextRequest) {
  const session = await getSession();

  if (!session?.sub) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const searchParams = request.nextUrl.searchParams;
  const limitParam = Number(searchParams.get("limit") ?? "6");
  const cursorCreatedAt = searchParams.get("cursorCreatedAt");
  const cursorId = searchParams.get("cursorId");

  const limit = Number.isFinite(limitParam)
    ? Math.max(1, Math.min(20, Math.floor(limitParam)))
    : 6;
  const cursor =
    cursorCreatedAt && cursorId
      ? { createdAt: cursorCreatedAt, id: cursorId }
      : null;

  const chunk = await getFeedChunk({
    artistId: session.sub,
    cursor,
    limit,
  });

  return NextResponse.json(chunk);
}
