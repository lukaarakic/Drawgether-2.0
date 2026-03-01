"use client";

import BoxButton from "@/app/components/ui/BoxButton";
import BoxLabel from "@/app/components/ui/BoxLabel";
import followAction from "@/app/lib/actions/follow";
import { usePathname } from "next/navigation";
import { useOptimistic, useTransition } from "react";

interface FollowProps {
  artistId: string;
  followerCount: number;
  followingCount: number;
  isFollowing: boolean;
  isOwner: boolean;
}

const Follow = ({
  artistId,
  followerCount,
  followingCount,
  isFollowing,
  isOwner,
}: FollowProps) => {
  const path = usePathname();
  const [isPending, startTransition] = useTransition();

  const [optimisticFollow, addOptimisticFollow] = useOptimistic(
    {
      isFollowing,
      count: followerCount,
    },
    (state, newIsFollowing: boolean) => ({
      isFollowing: newIsFollowing,
      count: state.count + (newIsFollowing ? 1 : -1),
    }),
  );

  const handleFollowClick = () => {
    startTransition(async () => {
      addOptimisticFollow(!optimisticFollow.isFollowing);

      try {
        await followAction(artistId, path);
      } catch (error) {
        console.error("Failed to update follow status:", error);
      }
    });
  };

  return (
    <>
      {isOwner || (
        <BoxButton
          className={`px-16 py-2 text-4xl bg-blue!`}
          onClick={handleFollowClick}
          disabled={isPending}
        >
          {optimisticFollow.isFollowing ? "Unfollow" : "Follow"}
        </BoxButton>
      )}

      <BoxLabel className="text-4xl" white>
        <span className="inline-block py-2">
          {optimisticFollow.count} Followers
        </span>
      </BoxLabel>
      <BoxLabel className="text-4xl" white>
        <span className="inline-block py-2">{followingCount} Following</span>
      </BoxLabel>
    </>
  );
};

export default Follow;
