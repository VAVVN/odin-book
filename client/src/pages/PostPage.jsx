import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { api } from "../api";
import PostCard from "../components/PostCard";

export default function PostPage() {
  const { id } = useParams();
  const [post, setPost] = useState(null);
  const [commentText, setCommentText] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const load = async () => {
    const data = await api.get(`/posts/${id}`);
    setPost(data);
  };

  useEffect(() => {
    setPost(null);
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!commentText.trim() || submitting) return;
    setSubmitting(true);
    try {
      const comment = await api.post(`/posts/${id}/comments`, { content: commentText });
      setPost((prev) => ({ ...prev, comments: [...prev.comments, comment] }));
      setCommentText("");
    } finally {
      setSubmitting(false);
    }
  };

  if (!post) return <p className="status">Loading...</p>;

  return (
    <div className="post-page">
      <PostCard post={post} linkToDetail={false} />

      <form className="new-comment-form" onSubmit={handleSubmit}>
        <input
          type="text"
          placeholder="Write a comment..."
          value={commentText}
          onChange={(e) => setCommentText(e.target.value)}
          maxLength={500}
        />
        <button type="submit" disabled={submitting || !commentText.trim()}>
          Reply
        </button>
      </form>

      <ul className="comment-list">
        {post.comments.map((comment) => (
          <li key={comment.id} className="comment">
            <img
              className="avatar avatar-sm"
              src={comment.author.avatarUrl || "https://placehold.co/32"}
              alt=""
            />
            <div>
              <Link to={`/users/${comment.author.id}`} className="comment-author">
                {comment.author.name || comment.author.username}
              </Link>
              <p>{comment.content}</p>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
