"use client";

import { useParams } from "next/navigation";

export default function ServicePage() {
  const params = useParams();

  return (
    <div className="p-6">
      <h1>Service: {params.type}</h1>
    </div>
  );
}
