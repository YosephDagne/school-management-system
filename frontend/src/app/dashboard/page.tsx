"use client";

import React, { useEffect, useState } from "react";
import { api } from "../../services/api";
import { useAuth } from "../../context/AuthContext";
import SidebarLayout from "../../components/SidebarLayout";

interface Stats {
  students: number;
  teachers: number;
  parents: number;
  classes: number;
  books: number;
}

const RECENT_ACTIVITY = [
  { icon: "👨‍🎓", color: "primary", title: "New student enrolled",  desc: "Yoseph Dagne — Grade 9A", time: "2 min ago" },
  { icon: "💰", color: "green",   title: "Payment received",       desc: "RCP-266548 — 4,500 Birr",  time: "18 min ago" },
  { icon: "✅", color: "teal",    title: "Attendance taken",       desc: "Grade 9A — 45 students",   time: "1 hr ago" },
  { icon: "📚", color: "amber",   title: "Book returned",          desc: "Intro to Calculus",         time: "3 hr ago" },
  { icon: "📊", color: "danger",  title: "Grades submitted",       desc: "Math Mid-Term — 9A",        time: "Yesterday" },
];

export default function DashboardPage() {
  const { user } = useAuth();
  const [stats, setStats] = useState<Stats>({ students: 0, teachers: 0, parents: 0, classes: 0, books: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadStats() {
      try {
        const [students, teachers, parents, classes, books] = await Promise.allSettled([
          api.getStudents(),
          api.getTeachers(),
          api.getParents(),
          api.getClasses(),
          api.getBooks(),
        ]);
        setStats({
          students: students.status === "fulfilled" ? students.value.length : 0,
          teachers: teachers.status === "fulfilled" ? teachers.value.length : 0,
          parents:  parents.status  === "fulfilled" ? parents.value.length  : 0,
          classes:  classes.status  === "fulfilled" ? classes.value.length  : 0,
          books:    books.status    === "fulfilled" ? books.value.length    : 0,
        });
      } catch (_) {}
      setLoading(false);
    }
    loadStats();
  }, []);

  const greeting = () => {
    const h = new Date().getHours();
    if (h < 12) return "Good Morning";
    if (h < 17) return "Good Afternoon";
    return "Good Evening";
  };

  const STAT_CARDS = [
    { label: "Total Students",  value: stats.students, icon: "👨‍🎓", color: "primary", delta: "+3 this week",   dir: "up" },
    { label: "Total Teachers",  value: stats.teachers, icon: "👨‍🏫", color: "teal",    delta: "Active staff",   dir: "neu" },
    { label: "Parent Accounts", value: stats.parents,  icon: "👨‍👩‍👧", color: "amber",   delta: "Registered",    dir: "neu" },
    { label: "Class Sections",  value: stats.classes,  icon: "🏛️",  color: "green",   delta: "This year",     dir: "neu" },
    { label: "Library Books",   value: stats.books,    icon: "📚",  color: "danger",  delta: "In catalogue",  dir: "neu" },
  ];

  return (
    <SidebarLayout activeId="dashboard">
      <header className="header">
        <div>
          <div className="header-title">{greeting()}, {user?.username} 👋</div>
          <div className="header-sub">{new Date().toLocaleDateString("en-ET", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}</div>
        </div>
        <div className="header-actions">
          <button className="header-btn" title="Notifications">
            🔔
            <span className="notif-dot" />
          </button>
        </div>
      </header>

      <div className="page animate-fade-in">
        <div className="page-header">
          <div className="page-header-left">
            <h1 className="page-header-title">System Overview</h1>
            <p className="page-header-sub">Academic Year 2026–2027 · Semester 1</p>
          </div>
        </div>

        {/* Stats */}
        <div className="stats-grid">
          {STAT_CARDS.map((s) => (
            <div key={s.label} className={`stat-card ${s.color}`}>
              <div className={`stat-icon ${s.color}`}>{s.icon}</div>
              <div className="stat-body">
                <div className="stat-label">{s.label}</div>
                <div className="stat-value">
                  {loading ? <span style={{ opacity: 0.3 }}>—</span> : s.value.toLocaleString()}
                </div>
                <div className={`stat-delta ${s.dir}`}>
                  {s.dir === "up" ? "↑ " : s.dir === "down" ? "↓ " : "· "}{s.delta}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Content Grid */}
        <div className="content-grid sidebar-layout">
          {/* Recent Activity */}
          <div className="card">
            <div className="card-header">
              <span className="card-title">📋 Recent Activity</span>
            </div>
            <div className="card-body">
              <div className="timeline">
                {RECENT_ACTIVITY.map((a, i) => (
                  <div className="timeline-item" key={i}>
                    <div className="timeline-dot" style={{ background: "rgba(99,102,241,0.15)" }}>
                      {a.icon}
                    </div>
                    <div className="timeline-content">
                      <div className="timeline-title">{a.title}</div>
                      <div className="timeline-desc">{a.desc}</div>
                      <div className="timeline-time">{a.time}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Right Panel */}
          <div className="flex-col gap-4">
            {/* Quick Actions */}
            <div className="card">
              <div className="card-header">
                <span className="card-title">⚡ Quick Actions</span>
              </div>
              <div className="card-body flex-col gap-2">
                {[
                  { icon: "👨‍🎓", label: "Enroll Student" },
                  { icon: "✅",   label: "Take Attendance" },
                  { icon: "📊",   label: "Enter Grades" },
                  { icon: "💰",   label: "Record Payment" },
                  { icon: "📚",   label: "Issue Library Book" },
                ].map((q) => (
                  <button
                    key={q.label}
                    className="btn btn-outline w-full"
                    style={{ justifyContent: "flex-start", gap: 10 }}
                  >
                    <span style={{ fontSize: 18 }}>{q.icon}</span>
                    {q.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Attendance Summary */}
            <div className="card">
              <div className="card-header">
                <span className="card-title">📈 Today's Attendance</span>
                <span className="badge badge-green">Live</span>
              </div>
              <div className="card-body flex-col gap-3">
                {[
                  { label: "Present", pct: 87, color: "green" },
                  { label: "Absent",  pct: 8,  color: "#ef4444" },
                  { label: "Late",    pct: 5,  color: "#f59e0b" },
                ].map((a) => (
                  <div key={a.label}>
                    <div className="flex justify-between mb-1">
                      <span className="text-sm text-secondary">{a.label}</span>
                      <span className="text-sm font-bold">{a.pct}%</span>
                    </div>
                    <div className="progress-wrap">
                      <div
                        className="progress-bar"
                        style={{ width: `${a.pct}%`, background: a.color === "green" ? "var(--gradient-green)" : a.color }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </SidebarLayout>
  );
}
