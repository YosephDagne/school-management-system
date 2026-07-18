"use client";

import React from "react";
import { useRouter } from "next/navigation";

export default function UnauthorizedPage() {
  const router = useRouter();

  return (
    <div style={{
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      height: "100vh",
      background: "var(--surface-base)",
      padding: "24px",
      textAlign: "center"
    }}>
      <div style={{
        fontSize: "72px",
        marginBottom: "16px",
        animation: "pulse 2s infinite"
      }}>
        🚫
      </div>
      
      <h1 style={{
        fontSize: "32px",
        fontWeight: "800",
        color: "#1e293b",
        marginBottom: "8px"
      }}>
        Access Denied
      </h1>

      <p style={{
        fontSize: "16px",
        color: "#64748b",
        maxWidth: "460px",
        marginBottom: "28px",
        lineHeight: "1.6"
      }}>
        You are not authorized to view this page. If you believe this is in error, please contact your school's ICT Administrator.
      </p>

      <div style={{ display: "flex", gap: "12px" }}>
        <button
          onClick={() => router.push("/dashboard")}
          className="btn btn-primary"
          style={{
            padding: "10px 20px",
            borderRadius: "6px",
            fontSize: "14px",
            fontWeight: "600",
            cursor: "pointer"
          }}
        >
          🏠 Go to Dashboard
        </button>

        <button
          onClick={() => router.push("/login")}
          className="btn btn-outline"
          style={{
            padding: "10px 20px",
            borderRadius: "6px",
            fontSize: "14px",
            fontWeight: "600",
            background: "transparent",
            border: "1px solid #cbd5e1",
            cursor: "pointer"
          }}
        >
          🔐 Sign In
        </button>
      </div>
    </div>
  );
}
