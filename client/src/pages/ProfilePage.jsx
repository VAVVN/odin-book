import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { api } from "../api";
import { useAuth } from "../context/AuthContext";
import PostCard from "../components/PostCard";
import FollowButton from "../components/FollowButton";

export default function ProfilePage() {
  const { id } = useParams();
  const { user: me } = useAuth();
  const [profile, setProfile] = useState(null);
  const [followStatus, setFollowStatus] = useState("none");
  const [bioDraft, setBioDraft] = useState("");
  const [editingBio, setEditingBio] = useState(false);

  const isMe = me?.id === id;

  const load = async () => {
    const data = await api.get(`/users/${id}`);
    setProfile(data);
    setBioDraft(data.bio || "");
    if (!isMe) {
      const users = await api.get("/users");
      const match = users.find((u) => u.id === id);
      setFollowStatus(match?.followStatus || "none");
    }
  };

  useEffect(() => {
    setProfile(null);
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const saveBio = async () => {
    const updated = await api.patch("/users/me", { bio: bioDraft });
    setProfile((prev) => ({ ...prev, bio: updated.bio }));
    setEditingBio(false);
  };

  if (!profile) return <p className="status">Loading...</p>;

  return (
    <div className="profile-page">
      <div className="profile-header">
        <img
          className="avatar avatar-lg"
          src={profile.avatarUrl || "https://placehold.co/96"}
          alt=""
        />
        <div>
          <h1>{profile.name || profile.username}</h1>
          <p className="username">@{profile.username}</p>
          <p className="follow-counts">
            {profile.followerCount} followers · {profile.followingCount} following
          </p>
        </div>
        {!isMe && (
          <FollowButton userId={profile.id} status={followStatus} onChange={setFollowStatus} />
        )}
      </div>

      {isMe && editingBio ? (
        <div className="bio-edit">
          <textarea value={bioDraft} onChange={(e) => setBioDraft(e.target.value)} maxLength={280} />
          <div>
            <button onClick={saveBio}>Save</button>
            <button className="secondary" onClick={() => setEditingBio(false)}>
              Cancel
            </button>
          </div>
        </div>
      ) : (
        <p className="bio">
          {profile.bio || (isMe ? "No bio yet." : "")}
          {isMe && (
            <button className="link-button" onClick={() => setEditingBio(true)}>
              Edit bio
            </button>
          )}
        </p>
      )}

      <h2>Posts</h2>
      {profile.posts.length === 0 && <p className="status">No posts yet.</p>}
      {profile.posts.map((post) => (
        <PostCard key={post.id} post={{ ...post, author: profile }} />
      ))}
    </div>
  );
}
