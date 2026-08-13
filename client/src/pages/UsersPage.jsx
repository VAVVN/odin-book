import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../api";
import FollowButton from "../components/FollowButton";

export default function UsersPage() {
  const [users, setUsers] = useState(null);

  useEffect(() => {
    api.get("/users").then(setUsers);
  }, []);

  const handleStatusChange = (userId, newStatus) => {
    setUsers((prev) =>
      prev.map((u) => (u.id === userId ? { ...u, followStatus: newStatus } : u))
    );
  };

  return (
    <div className="users-page">
      <h1>All Users</h1>
      {users === null && <p className="status">Loading...</p>}
      <ul className="user-list">
        {users?.map((user) => (
          <li key={user.id} className="user-list-item">
            <Link to={`/users/${user.id}`} className="user-list-link">
              <img
                className="avatar avatar-sm"
                src={user.avatarUrl || "https://placehold.co/40"}
                alt=""
              />
              <span>{user.name || user.username}</span>
            </Link>
            <FollowButton
              userId={user.id}
              status={user.followStatus}
              onChange={(status) => handleStatusChange(user.id, status)}
            />
          </li>
        ))}
      </ul>
    </div>
  );
}
