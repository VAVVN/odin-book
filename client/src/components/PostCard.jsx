import { Link } from "react-router-dom";
import { useState } from "react";
import { api } from "../api";

function timeAgo(dateStr) {
  const seconds = Math.floor((Date.now() - new Date(dateStr)) / 1000);
  const units = [
    ["y", 31536000],
    ["mo", 2592000],
    ["d", 86400],
    ["h", 3600],
    ["m", 60],
  ];
  for (const [label, secs] of units) {
    const value = Math.floor(seconds / secs);
    if (value >= 1) return `${value}${label} ago`;
  }
  return "just now";
}

export default function PostCard({ post, linkToDetail = true }) {
  const [likedByMe, setLikedByMe] = useState(post.likedByMe);
  const [likeCount, setLikeCount] = useState(post._count?.likes ?? 0);
  const [pending, setPending] = useState(false);

  const toggleLike = async () => {
    if (pending) return;
    setPending(true);
    try {
      const result = likedByMe
        ? await api.delete(`/posts/${post.id}/like`)
        : await api.post(`/posts/${post.id}/like`);
      setLikedByMe(result.likedByMe);
      setLikeCount(result.likeCount);
    } finally {
      setPending(false);
    }
  };

  return (
    <article className="post-card">
      <div className="post-header">
        <img
          className="avatar avatar-sm"
          src={post.author.avatarUrl || "https://placehold.co/40"}
          alt=""
        />
        <div>
          <Link to={`/users/${post.author.id}`} className="post-author">
            {post.author.name || post.author.username}
          </Link>
          <span className="post-time">{timeAgo(post.createdAt)}</span>
        </div>
      </div>

      <p className="post-content">{post.content}</p>

      <div className="post-actions">
        <button
          className={`like-button ${likedByMe ? "liked" : ""}`}
          onClick={toggleLike}
          disabled={pending}
        >
          {likedByMe ? "♥" : "♡"} {likeCount}
        </button>
        {linkToDetail ? (
          <Link to={`/posts/${post.id}`}>
            💬 {post._count?.comments ?? 0} comments
          </Link>
        ) : (
          <span>💬 {post._count?.comments ?? 0} comments</span>
        )}
      </div>
    </article>
  );
}
