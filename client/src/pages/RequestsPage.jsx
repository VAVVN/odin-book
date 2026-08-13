import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../api";

export default function RequestsPage() {
  const [requests, setRequests] = useState(null);

  useEffect(() => {
    api.get("/follows/requests").then(setRequests);
  }, []);

  const accept = async (requesterId) => {
    await api.post(`/follows/${requesterId}/accept`);
    setRequests((prev) => prev.filter((r) => r.requesterId !== requesterId));
  };

  const reject = async (requesterId) => {
    await api.delete(`/follows/${requesterId}`);
    setRequests((prev) => prev.filter((r) => r.requesterId !== requesterId));
  };

  return (
    <div className="requests-page">
      <h1>Follow Requests</h1>
      {requests === null && <p className="status">Loading...</p>}
      {requests?.length === 0 && <p className="status">No pending requests.</p>}
      <ul className="user-list">
        {requests?.map((req) => (
          <li key={req.id} className="user-list-item">
            <Link to={`/users/${req.requester.id}`} className="user-list-link">
              <img
                className="avatar avatar-sm"
                src={req.requester.avatarUrl || "https://placehold.co/40"}
                alt=""
              />
              <span>{req.requester.name || req.requester.username}</span>
            </Link>
            <div className="request-actions">
              <button onClick={() => accept(req.requesterId)}>Accept</button>
              <button className="secondary" onClick={() => reject(req.requesterId)}>
                Reject
              </button>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
