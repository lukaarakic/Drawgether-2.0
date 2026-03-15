"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import BoxLabel from "@/app/components/ui/BoxLabel";
import ArtworkLikeButton from "@/app/components/artwork-module/ArtworkLikeButton";
import ArtistCircle from "@/app/components/ui/ArtistCircle";
import ArtworkComments from "@/app/components/artwork-module/ArtworkComments";
import ArtworkDeleteButton from "@/app/components/artwork-module/ArtworkDeleteButton";
import CommentIcon from "@/app/assets/misc/comment.svg";
import type { FeedArtwork, FeedCursor } from "./feed-query";

const PAGE_SIZE = 6;

function generateRandomRotation(seed: number): number {
  return ((seed * 7) % 5) - 2.5;
}

export default function FeedInfiniteList({
  initialArtworks,
  initialLikedArtworkIds,
  initialHasMore,
  initialCursor,
  currentArtistId,
  currentArtistRole,
}: {
  initialArtworks: FeedArtwork[];
  initialLikedArtworkIds: string[];
  initialHasMore: boolean;
  initialCursor: FeedCursor | null;
  currentArtistId: string;
  currentArtistRole: string;
}) {
  const [artworks, setArtworks] = useState<FeedArtwork[]>(initialArtworks);
  const [hasMore, setHasMore] = useState(initialHasMore);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [loadMoreError, setLoadMoreError] = useState<string | null>(null);
  const [likedArtworkIds, setLikedArtworkIds] = useState(
    () => new Set(initialLikedArtworkIds),
  );

  const sentinelRef = useRef<HTMLDivElement | null>(null);
  const cursorRef = useRef<FeedCursor | null>(initialCursor);
  const hasMoreRef = useRef(initialHasMore);
  const isLoadingRef = useRef(false);
  const loadMoreErrorRef = useRef<string | null>(null);

  const canDeleteArtwork = useCallback(
    (artwork: FeedArtwork) => {
      if (currentArtistRole === "admin") return true;

      return artwork.artists.some((artist) => artist.id === currentArtistId);
    },
    [currentArtistId, currentArtistRole],
  );

  const loadMore = useCallback(async () => {
    if (
      !hasMoreRef.current ||
      isLoadingRef.current ||
      loadMoreErrorRef.current
    ) {
      return;
    }

    isLoadingRef.current = true;
    setIsLoadingMore(true);
    setLoadMoreError(null);
    loadMoreErrorRef.current = null;

    try {
      const queryParams = new URLSearchParams({
        limit: String(PAGE_SIZE),
      });

      if (cursorRef.current) {
        queryParams.set("cursorCreatedAt", cursorRef.current.createdAt);
        queryParams.set("cursorId", cursorRef.current.id);
      }

      const response = await fetch(`/api/feed?${queryParams.toString()}`, {
        method: "GET",
        cache: "no-store",
      });

      if (!response.ok) {
        throw new Error(`Failed to load artworks (${response.status})`);
      }

      const data: {
        artworks: FeedArtwork[];
        likedArtworkIds: string[];
        hasMore: boolean;
        nextCursor: FeedCursor | null;
      } = await response.json();

      setArtworks((previous) => {
        const existingIds = new Set(previous.map((item) => item.id));
        const uniqueIncoming = data.artworks.filter(
          (item) => !existingIds.has(item.id),
        );

        return [...previous, ...uniqueIncoming];
      });

      setLikedArtworkIds((previous) => {
        const next = new Set(previous);
        data.likedArtworkIds.forEach((id) => next.add(id));
        return next;
      });

      setHasMore(data.hasMore);
      hasMoreRef.current = data.hasMore;
      cursorRef.current = data.nextCursor;
    } catch {
      setLoadMoreError("Could not load more artworks.");
      loadMoreErrorRef.current = "Could not load more artworks.";
    } finally {
      isLoadingRef.current = false;
      setIsLoadingMore(false);
    }
  }, []);

  const handleRetry = async () => {
    loadMoreErrorRef.current = null;
    setLoadMoreError(null);
    await loadMore();
  };

  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          void loadMore();
        }
      },
      {
        root: null,
        rootMargin: "600px 0px 200px 0px",
        threshold: 0,
      },
    );

    observer.observe(sentinel);

    return () => {
      observer.disconnect();
    };
  }, [loadMore]);

  const artworkNodes = artworks.map((artwork, index) => (
    <article key={artwork.id} className="mb-50">
      <BoxLabel degree={generateRandomRotation((index % 12) + 1)}>
        <h2
          data-text={artwork.theme}
          className="text-border text-border-lg whitespace-break-spaces p-2 text-25 md:text-32"
        >
          {artwork.theme}
        </h2>
      </BoxLabel>

      <div
        className="relative mb-24"
        style={{
          rotate: `${generateRandomRotation((index % 12) + 1)}deg`,
        }}
      >
        <Image
          src={artwork.artworkImage}
          alt={artwork.theme}
          width={572}
          height={572}
          className="box-shadow mt-5 h-[57.2rem] w-[57.2rem] aspect-square object-cover"
        />

        <div className="absolute -bottom-12 -left-5 flex">
          <ArtworkLikeButton
            artworkId={artwork.id}
            likeCount={artwork.likesCount}
            isLiked={likedArtworkIds.has(artwork.id)}
          />

          <Link href={`/feed/artwork/${artwork.id}`} className="flex items-end">
            <Image src={CommentIcon} alt="Comments" className="h-24 w-24" />
          </Link>

          {canDeleteArtwork(artwork) ? (
            <ArtworkDeleteButton artworkId={artwork.id} />
          ) : null}
        </div>

        <div className="absolute -bottom-10 -right-8 flex items-baseline">
          {artwork.artists.map((artist) => (
            <Link
              href={`/artist/${artist.username}`}
              key={artist.id}
              className="-mr-10 last-of-type:mr-0"
            >
              <ArtistCircle username={artist.username || "default"} />
            </Link>
          ))}
        </div>
      </div>

      <ArtworkComments comments={artwork.comments} artworkId={artwork.id} />
    </article>
  ));

  return (
    <div className="flex flex-col mt-20 md:mt-72 px-10 overflow-hidden">
      {artworkNodes}

      <div ref={sentinelRef} className="h-20 w-full" />

      {isLoadingMore ? (
        <p className="text-center text-25 text-blue pb-20">Loading more...</p>
      ) : null}

      {loadMoreError ? (
        <div className="pb-20 text-center">
          <p className="text-25 text-pink">{loadMoreError}</p>
          <button
            type="button"
            onClick={() => void handleRetry()}
            className="mt-4 box-shadow bg-pink px-8 py-2 text-20 text-white transition-transform hover:scale-105 active:scale-90"
          >
            Retry
          </button>
        </div>
      ) : null}

      {!hasMore && artworks.length > 0 ? (
        <p className="text-center text-25 text-blue pb-20">
          You are all caught up.
        </p>
      ) : null}
    </div>
  );
}
