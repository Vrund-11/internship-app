"use client";

import { useAuth } from "@/context/AuthContext";

export default function Home() {
  const { user, loading, logout } = useAuth();

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <div className="p-10">
      <h1>Canovet</h1>
      {user ? <p>Welcome user</p> : <p>Not logged in</p>}
      <button onClick={logout}>Logout</button>
    </div>
  );
}
