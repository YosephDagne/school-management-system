"use client";

import React, { useState } from "react";
import { useAuth } from "../../context/AuthContext";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const { login } = useAuth();
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await login(username, password);
      router.push("/dashboard");
    } catch (err: any) {
      setError(err.message || "Login failed. Please check credentials.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page">
      <div className="login-panel">
        <div className="login-brand">
          <div className="login-brand-icon">🎓</div>
          <div className="login-brand-name">EduCore SMS</div>
          <div className="login-brand-sub">Enterprise School Management System</div>
        </div>

        <form className="login-form" onSubmit={handleSubmit}>
          <h1 className="login-form-title">Welcome back</h1>
          <p className="login-form-sub">Sign in to access your dashboard</p>

          {error && (
            <div className="alert alert-error mb-4">
              ⚠️ {error}
            </div>
          )}

          <div className="form-group mb-4">
            <label className="form-label">Username <span className="form-required">*</span></label>
            <input
              type="text"
              className="form-input"
              placeholder="Enter your username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
              autoFocus
            />
          </div>

          <div className="form-group mb-6">
            <label className="form-label">Password <span className="form-required">*</span></label>
            <input
              type="password"
              className="form-input"
              placeholder="Enter your password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          <button
            type="submit"
            className="btn btn-primary w-full btn-lg"
            disabled={loading}
          >
            {loading ? "Signing in..." : "🔐 Sign In"}
          </button>

          <p className="text-center text-xs text-muted mt-4">
            Default credentials: <strong>admin</strong> / <strong>admin123</strong>
          </p>
        </form>
      </div>

      <div className="login-hero">
        <div className="login-hero-blob b1" />
        <div className="login-hero-blob b2" />
        <div className="login-hero-content">
          <div style={{ fontSize: 72, marginBottom: 24 }}>🏫</div>
          <h2 className="login-hero-title">
            Modern School<br />Management Made<br />Simple
          </h2>
          <p className="login-hero-desc">
            A complete platform for Ethiopian schools — manage students, grades, attendance, fees, library, and more from one place.
          </p>
          <div className="login-features">
            {[
              { icon: "📊", text: "Automated Class Ranking & Report Cards" },
              { icon: "📝", text: "Continuous Assessment with Weighted Grading" },
              { icon: "💰", text: "Fee Management with CBE/Telebirr Reconciliation" },
              { icon: "📚", text: "Library Catalogue & Borrowing System" },
              { icon: "👨‍👩‍👧", text: "Parent Portal with Real-Time Notifications" },
            ].map((f, i) => (
              <div className="login-feature-item" key={i}>
                <span className="login-feature-icon">{f.icon}</span>
                <span className="login-feature-text">{f.text}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
