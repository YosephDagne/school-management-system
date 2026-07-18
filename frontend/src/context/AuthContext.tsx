"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";

interface User {
  id: string;
  username: string;
  email?: string;
  roles: string[];
  permissions: string[];
  studentId?: string;
  parentId?: string;
  teacherId?: string;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  login: (username: string, password: string) => Promise<void>;
  logout: () => void;
  isLoading: boolean;
  hasPermission: (perm: string) => boolean;
  hasRole: (role: string | string[]) => boolean;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const storedToken = localStorage.getItem("sms_token");
      const storedUser = localStorage.getItem("sms_user");
      if (storedToken && storedUser) {
        setToken(storedToken);
        setUser(JSON.parse(storedUser));
      }
    }
    setIsLoading(false);
  }, []);

  const login = async (username: string, password: string) => {
    const res = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password }),
    });
    const data = await res.json();
    if (!data.success) throw new Error(data.message);
    
    const { accessToken, refreshToken, user: userData } = data.data;
    
    setToken(accessToken);
    setUser(userData);
    
    if (typeof window !== "undefined") {
      localStorage.setItem("sms_token", accessToken);
      localStorage.setItem("sms_refresh_token", refreshToken);
      localStorage.setItem("sms_user", JSON.stringify(userData));
    }
  };

  const logout = () => {
    // Call server logout optionally in background
    if (token) {
      fetch("/api/auth/logout", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        }
      }).catch(() => {});
    }

    setUser(null);
    setToken(null);
    if (typeof window !== "undefined") {
      localStorage.removeItem("sms_token");
      localStorage.removeItem("sms_refresh_token");
      localStorage.removeItem("sms_user");
    }
  };

  const hasPermission = (perm: string) => {
    if (!user) return false;
    if (user.roles.includes("Super Admin") || user.roles.includes("SUPER_ADMIN")) return true;
    return user.permissions.includes(perm);
  };

  const hasRole = (role: string | string[]) => {
    if (!user) return false;
    if (user.roles.includes("Super Admin") || user.roles.includes("SUPER_ADMIN")) return true;
    const allowed = Array.isArray(role) ? role : [role];
    return allowed.some((r) => user.roles.includes(r));
  };

  return (
    <AuthContext.Provider value={{ user, token, login, logout, isLoading, hasPermission, hasRole }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
