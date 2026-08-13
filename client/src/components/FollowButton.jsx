import { useState } from "react";
import { api } from "../api";

const LABELS = {
  none: "Follow",
  pending: "Pending (cancel)",
  following: "Following (unfollow)",
};

export default function FollowButton({ userId, status, onChange }) {
  const [pending, setPending] = useState(false);

  const handleClick = async () => {
    if (pending) return;
    setPending(true);
    try {
      if (status === "none") {
        await api.post(`/follows/${userId}`);
        onChange("pending");
      } else {
        await api.delete(`/follows/${userId}`);
        onChange("none");
      }
    } finally {
      setPending(false);
    }
  };

  return (
    <button
      className={`follow-button follow-${status}`}
      onClick={handleClick}
      disabled={pending}
    >
      {LABELS[status]}
    </button>
  );
}
