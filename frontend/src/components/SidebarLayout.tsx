"use client";

import React, { ReactNode } from "react";
import { useAuth } from "../context/AuthContext";
import { useRouter } from "next/navigation";

interface NavItem {
  id: string;
  label: string;
  icon: string;
  path: string;
  permission?: string;
  badge?: number;
}

interface SidebarLayoutProps {
  children: ReactNode;
  activeId: string;
}

const NAV_SECTIONS: Array<{ label: string; items: NavItem[] }> = [
  {
    label: "Overview",
    items: [
      { id: "dashboard", label: "Dashboard", icon: "🏠", path: "/dashboard" },
    ],
  },
  {
    label: "Academic",
    items: [
      { id: "students",   label: "Students Portal", icon: "👨‍🎓", path: "/students", permission: "manage_students" },
      { id: "teachers",   label: "Teachers",    icon: "👨‍🏫", path: "/teachers", permission: "manage_teachers" },
      { id: "parents",    label: "Parents",     icon: "👨‍👩‍👧", path: "/parents", permission: "manage_students" },
      { id: "classes",    label: "Classes",     icon: "🏛️",  path: "/classes", permission: "manage_classes" },
      { id: "subjects",   label: "Subjects",    icon: "📖",  path: "/subjects", permission: "manage_subjects" },
      { id: "attendance", label: "Attendance",  icon: "✅",  path: "/attendance", permission: "manage_attendance" },
      { id: "grades",     label: "Grades",      icon: "📊",  path: "/grades", permission: "manage_grades" },
      { id: "rankings",   label: "Rankings",    icon: "🏆",  path: "/rankings", permission: "manage_grades" },
    ],
  },
  {
    label: "Administration",
    items: [
      { id: "finance",    label: "Finance",     icon: "💰",  path: "/finance", permission: "manage_finance" },
      { id: "library",    label: "Library",     icon: "📚",  path: "/library", permission: "manage_library" },
    ],
  },
];

function getAvatarColor(role: string) {
  const map: Record<string, string> = {
    SUPER_ADMIN: "linear-gradient(135deg,#6366f1,#8b5cf6)",
    REGISTRAR:   "linear-gradient(135deg,#14b8a6,#06b6d4)",
    TEACHER:     "linear-gradient(135deg,#f59e0b,#f97316)",
    STUDENT:     "linear-gradient(135deg,#22c55e,#10b981)",
    PARENT:      "linear-gradient(135deg,#ec4899,#f43f5e)",
    LIBRARIAN:   "linear-gradient(135deg,#8b5cf6,#6366f1)",
    ACCOUNTANT:  "linear-gradient(135deg,#ef4444,#dc2626)",
  };
  return map[role] || "linear-gradient(135deg,#6366f1,#8b5cf6)";
}

export default function SidebarLayout({ children, activeId }: SidebarLayoutProps) {
  const { user, logout, hasPermission } = useAuth();
  const router = useRouter();

  const handleNavClick = (path: string) => {
    router.push(path);
  };

  const handleLogout = () => {
    logout();
    router.push("/login");
  };

  const initials = user
    ? user.username.slice(0, 2).toUpperCase()
    : "AD";

  const roleName = user?.role.replace("_", " ") ?? "";

  return (
    <div className="app-shell">
      {/* Sidebar */}
      <aside className="sidebar">
        <div className="sidebar-logo">
          <div className="sidebar-logo-icon">🎓</div>
          <div>
            <div className="sidebar-logo-text">EduCore SMS</div>
            <div className="sidebar-logo-sub">School Management</div>
          </div>
        </div>

        <nav className="sidebar-nav">
          {NAV_SECTIONS.map((section) => {
            const visibleItems = section.items.filter(
              (item) => !item.permission || hasPermission(item.permission)
            );
            if (visibleItems.length === 0) return null;
            return (
              <div key={section.label}>
                <div className="sidebar-section-label">{section.label}</div>
                {visibleItems.map((item) => (
                  <div
                    key={item.id}
                    className={`nav-item ${activeId === item.id ? "active" : ""}`}
                    onClick={() => handleNavClick(item.path)}
                    role="button"
                    tabIndex={0}
                    style={{ outline: "none" }}
                  >
                    <span className="nav-item-icon">{item.icon}</span>
                    {item.label}
                    {item.badge ? <span className="nav-badge">{item.badge}</span> : null}
                  </div>
                ))}
              </div>
            );
          })}
        </nav>

        <div className="sidebar-user">
          <div
            className="user-avatar"
            style={{ background: getAvatarColor(user?.role ?? "") }}
          >
            {initials}
          </div>
          <div className="user-info">
            <div className="user-name">{user?.username}</div>
            <div className="user-role">{roleName}</div>
          </div>
          <button className="logout-btn" onClick={handleLogout} title="Logout">
            ⏻
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="main-content">{children}</main>
    </div>
  );
}
