import { useEffect, useState } from "react";
import { api } from "../api";
import PostCard from "../components/PostCard";

export default function FeedPage() {
  const [posts, setPosts] = useState(null);
  const [content, setContent] = useState("");
  const [posting, setPosting] = useState(false);
  const [error, setError] = useState(null);

  const loadFeed = async () => {
    const data = await api.get("/posts/feed");
    setPosts(data);
  };

  useEffect(() => {
    loadFeed();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!content.trim() || posting) return;
    setPosting(true);
    setError(null);
    try {
      const post = await api.post("/posts", { content });
      setPosts((prev) => [post, ...prev]);
      setContent("");
    } catch (err) {
      setError(err.message);
    } finally {
      setPosting(false);
    }
  };

  return (
    <div className="feed-page">
      <form className="new-post-form" onSubmit={handleSubmit}>
        <textarea
          placeholder="What's on your mind?"
          value={content}
          onChange={(e) => setContent(e.target.value)}
          maxLength={2000}
        />
        <div className="new-post-actions">
          {error && <span className="error-text">{error}</span>}
          <button type="submit" disabled={posting || !content.trim()}>
            Post
          </button>
        </div>
      </form>

      {posts === null && <p className="status">Loading feed...</p>}
      {posts?.length === 0 && (
        <p className="status">
          Nothing here yet. Follow some people or write your first post.
        </p>
      )}
      {posts?.map((post) => (
        <PostCard key={post.id} post={post} />
      ))}
    </div>
  );
}
