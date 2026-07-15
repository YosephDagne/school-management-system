"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "../context/AuthContext";

export default function Home() {
  const { user, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading) {
      if (user) {
        router.push("/dashboard");
      } else {
        router.push("/login");
      }
    }
  }, [user, isLoading, router]);

  return (
    <div style={{ display: "flex", alignItems: "center", justifyItems: "center", justifyContent: "center", height: "100vh", background: "var(--surface-base)" }}>
      <div className="spinner" />
    </div>
  );
}
