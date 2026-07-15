"use client";

import React, { ReactNode, useEffect, useState, useRef } from "react";
import { useAuth } from "../context/AuthContext";
import { useRouter } from "next/navigation";
import { api } from "../services/api";

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
    label: "Main Menu",
    items: [
      { id: "dashboard", label: "Dashboard", icon: "🏠", path: "/dashboard" },
      { id: "students",   label: "Students Portal", icon: "👨‍🎓", path: "/students", permission: "manage_students" },
      { id: "teachers",   label: "Teachers",    icon: "👨‍🏫", path: "/teachers", permission: "manage_teachers" },
      { id: "parents",    label: "Parents",     icon: "👨‍👩‍👧", path: "/parents", permission: "manage_students" },
      { id: "classes",    label: "Class & Sections", icon: "🏛️",  path: "/classes", permission: "manage_classes" },
      { id: "subjects",   label: "Subjects",    icon: "📖",  path: "/subjects", permission: "manage_subjects" },
      { id: "attendance", label: "Attendance",  icon: "✅",  path: "/attendance", permission: "manage_attendance" },
      { id: "grades",     label: "Exams & Grades", icon: "📝",  path: "/grades", permission: "manage_grades" },
      { id: "rankings",   label: "Class Rankings", icon: "🏆",  path: "/rankings", permission: "manage_grades" },
    ],
  },
  {
    label: "School Finance & Library",
    items: [
      { id: "finance",    label: "Finance & Fees", icon: "💰",  path: "/finance", permission: "manage_finance" },
      { id: "library",    label: "Library Desk",   icon: "📚",  path: "/library", permission: "manage_library" },
    ],
  },
];

export default function SidebarLayout({ children, activeId }: SidebarLayoutProps) {
  const { user, logout, hasPermission } = useAuth();
  const router = useRouter();

  // Dropdown States
  const [showLangDropdown, setShowLangDropdown] = useState(false);
  const [showMsgDropdown, setShowMsgDropdown] = useState(false);
  const [showNotifDropdown, setShowNotifDropdown] = useState(false);
  const [showProfileDropdown, setShowProfileDropdown] = useState(false);
  
  // Language State
  const [lang, setLang] = useState("English");

  // Search State
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [searchData, setSearchData] = useState<{ students: any[]; teachers: any[]; books: any[] }>({ students: [], teachers: [], books: [] });

  // Notifications State (Dynamic)
  const [notifications, setNotifications] = useState<string[]>([]);

  // Refs for clicking outside to close
  const langRef = useRef<HTMLDivElement>(null);
  const msgRef = useRef<HTMLDivElement>(null);
  const notifRef = useRef<HTMLDivElement>(null);
  const profileRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    loadGlobalNavbarData();
    
    // Close dropdowns on outside click
    const handleOutsideClick = (e: MouseEvent) => {
      if (langRef.current && !langRef.current.contains(e.target as Node)) setShowLangDropdown(false);
      if (msgRef.current && !msgRef.current.contains(e.target as Node)) setShowMsgDropdown(false);
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) setShowNotifDropdown(false);
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) setShowProfileDropdown(false);
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) setSearchQuery("");
    };

    document.addEventListener("mousedown", handleOutsideClick);
    return () => document.removeEventListener("mousedown", handleOutsideClick);
  }, []);

  const loadGlobalNavbarData = async () => {
    try {
      const [sList, tList, bList] = await Promise.all([
        api.getStudents().catch(() => []),
        api.getTeachers().catch(() => []),
        api.getBooks().catch(() => []),
      ]);
      setSearchData({ students: sList, teachers: tList, books: bList });

      // Compile actual recent notifications based on recently added registry items
      const notifs: string[] = [];
      sList.slice(0, 3).forEach((s: any) => notifs.push(`👨‍🎓 Student ${s.firstName} ${s.lastName} enrolled.`));
      tList.slice(0, 2).forEach((t: any) => notifs.push(`👨‍🏫 Teacher ${t.firstName} ${t.lastName} joined.`));
      bList.slice(0, 3).forEach((b: any) => notifs.push(`📚 Book "${b.title}" added to catalog.`));
      setNotifications(notifs.slice(0, 6));
    } catch (_) {}
  };

  // Search filter effect
  useEffect(() => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      return;
    }
    const query = searchQuery.toLowerCase();
    const results: any[] = [];

    searchData.students.forEach((s) => {
      if (`${s.firstName} ${s.lastName}`.toLowerCase().includes(query) || s.admissionNumber.toLowerCase().includes(query)) {
        results.push({ type: "student", label: `👨‍🎓 Student: ${s.firstName} ${s.lastName} (${s.admissionNumber})`, path: "/students" });
      }
    });

    searchData.teachers.forEach((t) => {
      if (`${t.firstName} ${t.lastName}`.toLowerCase().includes(query) || (t.employeeId && t.employeeId.toLowerCase().includes(query))) {
        results.push({ type: "teacher", label: `👨‍🏫 Teacher: ${t.firstName} ${t.lastName}`, path: "/teachers" });
      }
    });

    searchData.books.forEach((b) => {
      if (b.title.toLowerCase().includes(query) || b.isbn.toLowerCase().includes(query)) {
        results.push({ type: "book", label: `📚 Book: ${b.title} (ISBN: ${b.isbn})`, path: "/library" });
      }
    });

    setSearchResults(results.slice(0, 5));
  }, [searchQuery, searchData]);

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

  const roleName = user?.role.replace("_", " ") ?? "ADMIN";

  const recentMessages = [
    { sender: "Parent Yoseph", text: "Inquiring about report card details.", time: "10m ago" },
    { sender: "Teacher Abera", text: "Attendance sheet locking pending.", time: "45m ago" },
    { sender: "Librarian", text: "Overdue calculus textbook reminder.", time: "2h ago" },
  ];

  return (
    <div className="app-shell" style={{ background: "var(--surface-base)" }}>
      {/* Sidebar */}
      <aside className="sidebar" style={{ background: "var(--gradient-sidebar)", borderRight: "none" }}>
        <div className="sidebar-logo" style={{ borderBottom: "1px solid rgba(255,255,255,0.06)", padding: "20px 24px" }}>
          <div className="sidebar-logo-icon" style={{ background: "#ffae01", color: "#042954", fontWeight: "bold" }}>🎓</div>
          <div>
            <div className="sidebar-logo-text" style={{ fontSize: "20px", fontWeight: 800, letterSpacing: "-0.5px" }}>
              <span style={{ color: "#ffae01" }}>Wegde</span><span style={{ color: "#ffffff", fontSize: "10px", verticalAlign: "super", marginLeft: "2px" }}>TM</span>
            </div>
            <div className="sidebar-logo-sub" style={{ color: "rgba(255,255,255,0.5)", fontSize: "10.5px" }}>School Management</div>
          </div>
        </div>

        <nav className="sidebar-nav" style={{ padding: "16px 0" }}>
          {NAV_SECTIONS.map((section) => {
            const visibleItems = section.items.filter(
              (item) => !item.permission || hasPermission(item.permission)
            );
            if (visibleItems.length === 0) return null;
            return (
              <div key={section.label}>
                <div className="sidebar-section-label" style={{ color: "rgba(255,255,255,0.35)", fontSize: "9px" }}>{section.label}</div>
                {visibleItems.map((item) => (
                  <div
                    key={item.id}
                    className={`nav-item ${activeId === item.id ? "active" : ""}`}
                    onClick={() => handleNavClick(item.path)}
                    role="button"
                    tabIndex={0}
                    style={{
                      outline: "none",
                      color: activeId === item.id ? "#ffae01" : "rgba(255,255,255,0.75)",
                      background: activeId === item.id ? "rgba(255,255,255,0.05)" : "transparent",
                      borderLeft: activeId === item.id ? "4px solid #ffae01" : "4px solid transparent",
                      paddingLeft: "20px"
                    }}
                  >
                    <span className="nav-item-icon" style={{ fontSize: "16px" }}>{item.icon}</span>
                    <span style={{ fontWeight: activeId === item.id ? "600" : "400" }}>{item.label}</span>
                  </div>
                ))}
              </div>
            );
          })}
        </nav>

        <div className="sidebar-user" style={{ borderTop: "1px solid rgba(255,255,255,0.06)", padding: "16px 24px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div className="user-avatar" style={{ background: "#ffae01", color: "#042954" }}>
            {initials}
          </div>
          <button className="logout-btn" onClick={handleLogout} title="Logout" style={{ color: "rgba(255,255,255,0.5)", background: "transparent", border: "none", cursor: "pointer" }}>
            ⏻
          </button>
        </div>
      </aside>

      {/* Main Content Column */}
      <main className="main-content" style={{ background: "var(--surface-base)" }}>
        {/* Global top header */}
        <header className="header" style={{
          background: "#ffffff",
          boxShadow: "0 1px 3px rgba(0,0,0,0.04)",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          padding: "0 28px",
          height: "68px",
          position: "relative",
          zIndex: 90
        }}>
          {/* Welcome Text Left */}
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <span style={{ fontSize: "22px", background: "#f0f1f3", width: "36px", height: "36px", borderRadius: "50%", display: "flex", alignItems: "center", justifyItems: "center", justifyContent: "center" }}>🎓</span>
            <div>
              <div style={{ fontSize: "14px", fontWeight: "bold", color: "#111111" }}>
                Welcome To Wegde <span style={{ fontWeight: 400, color: "#666666" }}>School Management System</span>
              </div>
            </div>
          </div>

          {/* Search bar middle with float menu */}
          <div ref={searchRef} style={{ position: "relative", width: "280px" }}>
            <input
              type="text"
              placeholder="Search students, teachers, books..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onFocus={loadGlobalNavbarData}
              style={{
                width: "100%",
                padding: "8px 36px 8px 16px",
                borderRadius: "20px",
                border: "1px solid #e0e0e0",
                background: "#f0f1f3",
                fontSize: "12.5px",
                outline: "none",
                color: "#333333"
              }}
            />
            <span style={{ position: "absolute", right: "12px", top: "8px", color: "#888888", fontSize: "13px" }}>🔍</span>

            {/* Float Search Dropdown */}
            {searchResults.length > 0 && (
              <div style={{
                position: "absolute",
                top: "42px",
                left: 0,
                right: 0,
                background: "#ffffff",
                border: "1px solid #e2e8f0",
                borderRadius: "8px",
                boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.1)",
                padding: "6px 0",
                zIndex: 1000
              }}>
                {searchResults.map((res, index) => (
                  <div
                    key={index}
                    onClick={() => {
                      router.push(res.path);
                      setSearchQuery("");
                    }}
                    style={{
                      padding: "10px 16px",
                      fontSize: "12px",
                      cursor: "pointer",
                      borderBottom: index < searchResults.length - 1 ? "1px solid #f1f5f9" : "none"
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.background = "#f8fafc")}
                    onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                  >
                    {res.label}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* User actions right */}
          <div style={{ display: "flex", alignItems: "center", gap: "20px" }}>
            {/* Language dropdown */}
            <div ref={langRef} style={{ position: "relative" }}>
              <div
                onClick={() => setShowLangDropdown(!showLangDropdown)}
                style={{ fontSize: "12.5px", color: "#555555", cursor: "pointer", display: "flex", alignItems: "center", gap: "4px" }}
              >
                🌐 {lang} <span style={{ fontSize: "10px" }}>▼</span>
              </div>
              {showLangDropdown && (
                <div style={{
                  position: "absolute", top: "30px", right: 0,
                  background: "#ffffff", border: "1px solid #e2e8f0",
                  borderRadius: "6px", boxShadow: "0 4px 6px rgba(0,0,0,0.08)",
                  width: "120px", zIndex: 1000, padding: "4px 0"
                }}>
                  {["English", "Amharic (አማርኛ)"].map((l) => (
                    <div
                      key={l}
                      onClick={() => {
                        setLang(l);
                        setShowLangDropdown(false);
                      }}
                      style={{ padding: "8px 12px", fontSize: "12px", cursor: "pointer" }}
                      onMouseEnter={(e) => (e.currentTarget.style.background = "#f8fafc")}
                      onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                    >
                      {l}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Message alert */}
            <div ref={msgRef} style={{ position: "relative" }}>
              <div
                onClick={() => setShowMsgDropdown(!showMsgDropdown)}
                style={{ cursor: "pointer", fontSize: "16px" }}
              >
                ✉️
                <span style={{
                  position: "absolute", top: "-5px", right: "-8px",
                  background: "#307ef3", color: "#ffffff", fontSize: "9px",
                  fontWeight: "bold", padding: "1px 5px", borderRadius: "8px"
                }}>3</span>
              </div>
              {showMsgDropdown && (
                <div style={{
                  position: "absolute", top: "30px", right: 0,
                  background: "#ffffff", border: "1px solid #e2e8f0",
                  borderRadius: "8px", boxShadow: "0 6px 12px rgba(0,0,0,0.1)",
                  width: "280px", zIndex: 1000, padding: "10px 0"
                }}>
                  <div style={{ padding: "0 14px 8px", borderBottom: "1px solid #f1f5f9", fontWeight: "bold", fontSize: "12.5px" }}>
                    Recent Messages
                  </div>
                  {recentMessages.map((msg, i) => (
                    <div
                      key={i}
                      style={{ padding: "10px 14px", borderBottom: i < 2 ? "1px solid #f1f5f9" : "none", cursor: "pointer" }}
                      onMouseEnter={(e) => (e.currentTarget.style.background = "#f8fafc")}
                      onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                    >
                      <div style={{ display: "flex", justifyContent: "space-between", fontSize: "11px", fontWeight: "bold" }}>
                        <span>{msg.sender}</span>
                        <span style={{ color: "#999" }}>{msg.time}</span>
                      </div>
                      <div style={{ fontSize: "11.5px", color: "#666", marginTop: "2px" }}>{msg.text}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Notification alert */}
            <div ref={notifRef} style={{ position: "relative" }}>
              <div
                onClick={() => setShowNotifDropdown(!showNotifDropdown)}
                style={{ cursor: "pointer", fontSize: "16px" }}
              >
                🔔
                {notifications.length > 0 && (
                  <span style={{
                    position: "absolute", top: "-5px", right: "-8px",
                    background: "#ffae01", color: "#111111", fontSize: "9px",
                    fontWeight: "bold", padding: "1px 5px", borderRadius: "8px"
                  }}>{notifications.length}</span>
                )}
              </div>
              {showNotifDropdown && (
                <div style={{
                  position: "absolute", top: "30px", right: 0,
                  background: "#ffffff", border: "1px solid #e2e8f0",
                  borderRadius: "8px", boxShadow: "0 6px 12px rgba(0,0,0,0.1)",
                  width: "300px", zIndex: 1000, padding: "10px 0"
                }}>
                  <div style={{ padding: "0 14px 8px", borderBottom: "1px solid #f1f5f9", fontWeight: "bold", fontSize: "12.5px" }}>
                    System Notifications
                  </div>
                  {notifications.length === 0 ? (
                    <div style={{ padding: "14px", fontSize: "11.5px", color: "#888", textAlign: "center" }}>
                      No new notifications.
                    </div>
                  ) : (
                    notifications.map((notif, i) => (
                      <div
                        key={i}
                        style={{ padding: "10px 14px", borderBottom: i < notifications.length - 1 ? "1px solid #f1f5f9" : "none", fontSize: "11.5px", color: "#444" }}
                      >
                        ℹ️ {notif}
                      </div>
                    ))
                  )}
                </div>
              )}
            </div>

            <div style={{ height: "24px", width: "1px", background: "#e0e0e0" }} />

            {/* User profile info */}
            <div ref={profileRef} style={{ position: "relative" }}>
              <div
                onClick={() => setShowProfileDropdown(!showProfileDropdown)}
                style={{ display: "flex", alignItems: "center", cursor: "pointer" }}
              >
                <div style={{
                  width: "36px", height: "36px", borderRadius: "50%",
                  background: "#042954", color: "#ffae01",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontWeight: "bold", fontSize: "13px"
                }}>
                  {initials}
                </div>
              </div>

              {showProfileDropdown && (
                <div style={{
                  position: "absolute", top: "45px", right: 0,
                  background: "#ffffff", border: "1px solid #e2e8f0",
                  borderRadius: "8px", boxShadow: "0 6px 12px rgba(0,0,0,0.1)",
                  width: "180px", zIndex: 1000, padding: "8px 0"
                }}>
                  <div style={{ padding: "6px 14px", borderBottom: "1px solid #f1f5f9" }}>
                    <div style={{ fontSize: "12px", fontWeight: "bold" }}>{user?.username === "admin" ? "Active Session" : user?.username}</div>
                  </div>
                  <div
                    onClick={() => {
                      router.push("/dashboard");
                      setShowProfileDropdown(false);
                    }}
                    style={{ padding: "8px 14px", fontSize: "12px", cursor: "pointer" }}
                    onMouseEnter={(e) => (e.currentTarget.style.background = "#f8fafc")}
                    onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                  >
                    Dashboard Home
                  </div>
                  <div style={{ borderBottom: "1px solid #f1f5f9", margin: "4px 0" }} />
                  <div
                    onClick={handleLogout}
                    style={{ padding: "8px 14px", fontSize: "12px", cursor: "pointer", color: "var(--color-danger)", fontWeight: "600" }}
                    onMouseEnter={(e) => (e.currentTarget.style.background = "#fdf2f2")}
                    onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                  >
                    Log Out Session
                  </div>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Inner Page Render */}
        <div style={{ flex: 1, display: "flex", flexDirection: "column" }}>
          {children}
        </div>
      </main>
    </div>
  );
}
