"use client";

import { useState } from "react";

type FollowClubButtonProps = {
  clubId: string;
  initialFollowing: boolean;
  isLoggedIn: boolean;
};

export default function FollowClubButton({
  clubId,
  initialFollowing,
  isLoggedIn,
}: FollowClubButtonProps) {
  const [following, setFollowing] = useState(initialFollowing);
  const [loading, setLoading] = useState(false);

  async function toggleFollow() {
    if (!isLoggedIn) {
      window.location.href = `/auth/quick-signup?next=/club/${clubId}`;
      return;
    }

    setLoading(true);

    const response = await fetch(`/api/clubs/${clubId}/follow`, {
      method: "POST",
    });

    if (response.ok) {
      const result = await response.json();
      setFollowing(Boolean(result.following));
    }

    setLoading(false);
  }

  return (
    <button
      type="button"
      onClick={toggleFollow}
      disabled={loading}
      className="rounded-xl border border-gray-300 px-4 py-3 text-center font-semibold text-black disabled:opacity-50"
    >
      {loading ? "Attendi..." : following ? "Segui gia" : "Segui il club"}
    </button>
  );
}
