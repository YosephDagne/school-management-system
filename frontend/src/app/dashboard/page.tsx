"use client";

import React, { useEffect, useState } from "react";
import { api } from "../../services/api";
import { useAuth } from "../../context/AuthContext";
import SidebarLayout from "../../components/SidebarLayout";
import { useRouter } from "next/navigation";

interface Stats {
  students: number;
  teachers: number;
  parents: number;
  classes: number;
  books: number;
}

interface Activity {
  icon: string;
  color: string;
  title: string;
  desc: string;
  time: string;
}

export default function DashboardPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [stats, setStats] = useState<Stats>({ students: 0, teachers: 0, parents: 0, classes: 0, books: 0 });
  const [activities, setActivities] = useState<Activity[]>([]);
  const [attendance, setAttendance] = useState({ present: 100, absent: 0, late: 0, total: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    setLoading(true);
    try {
      // 1. Fetch main stats
      const [sData, tData, pData, cData, bData, brData] = await Promise.all([
        api.getStudents().catch(() => []),
        api.getTeachers().catch(() => []),
        api.getParents().catch(() => []),
        api.getClasses().catch(() => []),
        api.getBooks().catch(() => []),
        api.getActiveBorrowings().catch(() => []),
      ]);

      setStats({
        students: sData.length,
        teachers: tData.length,
        parents: pData.length,
        classes: cData.length,
        books: bData.length,
      });

      // 2. Build Recent Activity Feed dynamically from database updates
      const rawActivities: { icon: string; color: string; title: string; desc: string; date: Date }[] = [];

      // Add recent students
      sData.forEach((s: any) => {
        rawActivities.push({
          icon: "👨‍🎓",
          color: "primary",
          title: "New student enrolled",
          desc: `${s.firstName} ${s.lastName} — Reg No: ${s.admissionNumber}`,
          date: new Date(s.createdAt),
        });
      });

      // Add recent teachers
      tData.forEach((t: any) => {
        rawActivities.push({
          icon: "👨‍🏫",
          color: "teal",
          title: "New teacher registered",
          desc: `${t.firstName} ${t.lastName} — ${t.department || "Academic Staff"}`,
          date: new Date(t.createdAt),
        });
      });

      // Add recent books cataloged
      bData.forEach((b: any) => {
        rawActivities.push({
          icon: "📚",
          color: "amber",
          title: "New library book cataloged",
          desc: `"${b.title}" by ${b.author} [Stock: ${b.quantity}]`,
          date: new Date(b.createdAt),
        });
      });

      // Add active borrowings
      brData.forEach((br: any) => {
        const name = br.student ? `${br.student.firstName} ${br.student.lastName}` : "Staff";
        rawActivities.push({
          icon: "📖",
          color: "green",
          title: "Library book checked out",
          desc: `"${br.book?.title || "Book"}" issued to ${name}`,
          date: new Date(br.borrowDate),
        });
      });

      // Sort by date (newest first) and take top 5
      const sorted = rawActivities
        .sort((a, b) => b.date.getTime() - a.date.getTime())
        .slice(0, 5)
        .map((act) => ({
          icon: act.icon,
          color: act.color,
          title: act.title,
          desc: act.desc,
          time: formatRelativeTime(act.date),
        }));

      setActivities(sorted);

      // 3. Compile today's attendance rate from database
      const todayStr = new Date().toISOString().split("T")[0];
      let pCount = 0;
      let aCount = 0;
      let lCount = 0;

      // Make class logs requests
      const classAttendancePromises = cData.map((cls: any) =>
        api.getClassAttendance(cls.id, todayStr).catch(() => [])
      );
      const attendanceResults = await Promise.allSettled(classAttendancePromises);

      attendanceResults.forEach((res) => {
        if (res.status === "fulfilled" && Array.isArray(res.value)) {
          res.value.forEach((rec: any) => {
            if (rec.status === "Present") pCount++;
            else if (rec.status === "Absent") aCount++;
            else if (rec.status === "Late") lCount++;
          });
        }
      });

      const attTotal = pCount + aCount + lCount;
      if (attTotal > 0) {
        setAttendance({
          present: Math.round((pCount / attTotal) * 100),
          absent: Math.round((aCount / attTotal) * 100),
          late: Math.round((lCount / attTotal) * 100),
          total: attTotal,
        });
      } else {
        setAttendance({ present: 100, absent: 0, late: 0, total: 0 });
      }

    } catch (_) {}
    setLoading(false);
  };

  const formatRelativeTime = (date: Date) => {
    const diff = Date.now() - date.getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return "Just now";
    if (mins < 60) return `${mins} min ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs} hr ago`;
    const days = Math.floor(hrs / 24);
    if (days === 1) return "Yesterday";
    return `${days} days ago`;
  };

  const greeting = () => {
    const h = new Date().getHours();
    if (h < 12) return "Good Morning";
    if (h < 17) return "Good Afternoon";
    return "Good Evening";
  };

  const STAT_CARDS = [
    { label: "Total Students",  value: stats.students, icon: "👨‍🎓", color: "primary", delta: "Enrolled",   dir: "neu" },
    { label: "Total Teachers",  value: stats.teachers, icon: "👨‍🏫", color: "teal",    delta: "Active staff",   dir: "neu" },
    { label: "Parent Accounts", value: stats.parents,  icon: "👨‍👩‍👧", color: "amber",   delta: "Registered",    dir: "neu" },
    { label: "Class Sections",  value: stats.classes,  icon: "🏛️",  color: "green",   delta: "This year",     dir: "neu" },
    { label: "Library Books",   value: stats.books,    icon: "📚",  color: "danger",  delta: "In catalogue",  dir: "neu" },
  ];

  return (
    <SidebarLayout activeId="dashboard">
      <header className="header">
        <div>
          <div className="header-title">{greeting()}, {user?.username === "admin" ? "Wegde Staff" : (user?.username || "Staff")} 👋</div>
          <div className="header-sub">{new Date().toLocaleDateString("en-ET", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}</div>
        </div>
      </header>

      <div className="page animate-fade-in" style={{ padding: "28px" }}>
        {/* Stats */}
        <div className="stats-grid" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "20px", marginBottom: "28px" }}>
          {STAT_CARDS.map((s) => (
            <div key={s.label} className={`stat-card ${s.color}`} style={{
              background: "#ffffff",
              padding: "20px",
              borderRadius: "8px",
              boxShadow: "0 1px 3px rgba(0,0,0,0.03)",
              display: "flex",
              alignItems: "center",
              gap: "16px"
            }}>
              <div className={`stat-icon ${s.color}`} style={{ fontSize: "28px", width: "54px", height: "54px", background: "rgba(99,102,241,0.08)", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center" }}>
                {s.icon}
              </div>
              <div className="stat-body">
                <div className="stat-label" style={{ fontSize: "12px", color: "#777777", fontWeight: "600" }}>{s.label}</div>
                <div className="stat-value" style={{ fontSize: "20px", fontWeight: "bold", color: "#111111", margin: "4px 0" }}>
                  {loading ? "..." : s.value.toLocaleString()}
                </div>
                <div style={{ fontSize: "11px", color: "#999999" }}>{s.delta}</div>
              </div>
            </div>
          ))}
        </div>

        {/* Content Grid */}
        <div className="content-grid sidebar-layout" style={{ display: "grid", gridTemplateColumns: "1fr 340px", gap: "20px" }}>
          {/* Recent Activity */}
          <div className="card" style={{ background: "#ffffff", padding: "20px", borderRadius: "8px" }}>
            <div className="card-header" style={{ marginBottom: "20px" }}>
              <span className="card-title" style={{ fontSize: "16px", fontWeight: "bold" }}>📋 Real-Time Activity logs</span>
            </div>
            <div className="card-body">
              {loading ? (
                <div style={{ textAlign: "center", padding: "40px" }}>
                  <div className="spinner" style={{ margin: "0 auto 10px" }} />
                  <div>Compiling updates...</div>
                </div>
              ) : activities.length === 0 ? (
                <div style={{ textAlign: "center", padding: "40px", color: "#777" }}>
                  No recent activities recorded in the system.
                </div>
              ) : (
                <div className="timeline" style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
                  {activities.map((a, i) => (
                    <div className="timeline-item" key={i} style={{ display: "flex", gap: "16px", alignItems: "flex-start" }}>
                      <div className="timeline-dot" style={{
                        background: "rgba(4,41,84,0.06)",
                        fontSize: "20px",
                        width: "42px",
                        height: "42px",
                        borderRadius: "50%",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        flexShrink: 0
                      }}>
                        {a.icon}
                      </div>
                      <div className="timeline-content">
                        <div className="timeline-title" style={{ fontWeight: "bold", fontSize: "13.5px", color: "#111" }}>{a.title}</div>
                        <div className="timeline-desc" style={{ fontSize: "12px", color: "#555", marginTop: "2px" }}>{a.desc}</div>
                        <div className="timeline-time" style={{ fontSize: "10.5px", color: "#999", marginTop: "4px" }}>{a.time}</div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Right Panel */}
          <div className="flex-col gap-4" style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
            {/* Quick Actions */}
            <div className="card" style={{ background: "#ffffff", padding: "20px", borderRadius: "8px" }}>
              <div className="card-header" style={{ marginBottom: "16px" }}>
                <span className="card-title" style={{ fontSize: "15px", fontWeight: "bold" }}>⚡ Quick Actions Navigation</span>
              </div>
              <div className="card-body flex-col gap-2" style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                {[
                  { icon: "👨‍🎓", label: "Students Registry Portal", path: "/students" },
                  { icon: "✅",   label: "Record Daily Attendance", path: "/attendance" },
                  { icon: "📊",   label: "Record Exam Marks", path: "/grades" },
                  { icon: "💰",   label: "Tuition Fees & Payments", path: "/finance" },
                  { icon: "📚",   label: "Library Book Checkout", path: "/library" },
                ].map((q) => (
                  <button
                    key={q.label}
                    onClick={() => router.push(q.path)}
                    className="btn btn-outline w-full"
                    style={{
                      justifyContent: "flex-start",
                      gap: "12px",
                      background: "transparent",
                      border: "1px solid #e2e8f0",
                      padding: "10px 14px",
                      borderRadius: "6px",
                      fontSize: "12.5px",
                      fontWeight: "600",
                      color: "#333",
                      textAlign: "left",
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center"
                    }}
                  >
                    <span style={{ fontSize: 18 }}>{q.icon}</span>
                    {q.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Attendance Summary */}
            <div className="card" style={{ background: "#ffffff", padding: "20px", borderRadius: "8px" }}>
              <div className="card-header" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
                <span className="card-title" style={{ fontSize: "15px", fontWeight: "bold" }}>📈 Today's Attendance Standings</span>
                {attendance.total > 0 ? (
                  <span className="badge badge-green" style={{ background: "#d1fae5", color: "#065f46", fontSize: "10px", padding: "2px 6px" }}>Live</span>
                ) : (
                  <span className="badge badge-gray" style={{ background: "#f3f4f6", color: "#6b7280", fontSize: "10px", padding: "2px 6px" }}>No logs</span>
                )}
              </div>
              <div className="card-body flex-col gap-3" style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
                {attendance.total === 0 ? (
                  <div style={{ fontSize: "12px", color: "#888888", textAlign: "center", padding: "10px" }}>
                    No class attendance registers submitted today yet.
                  </div>
                ) : (
                  [
                    { label: "Present Rate", pct: attendance.present, color: "#10b981" },
                    { label: "Absent Rate",  pct: attendance.absent,  color: "#ef4444" },
                    { label: "Late Rate",    pct: attendance.late,    color: "#f59e0b" },
                  ].map((a) => (
                    <div key={a.label}>
                      <div className="flex justify-between mb-1" style={{ display: "flex", justifyContent: "space-between", fontSize: "12px", color: "#555" }}>
                        <span>{a.label}</span>
                        <span style={{ fontWeight: "bold" }}>{a.pct}%</span>
                      </div>
                      <div className="progress-wrap" style={{ height: "6px", background: "#f1f5f9", borderRadius: "3px", overflow: "hidden" }}>
                        <div
                          className="progress-bar"
                          style={{ width: `${a.pct}%`, background: a.color, height: "100%" }}
                        />
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </SidebarLayout>
  );
}
