"use client";

import React, { useEffect, useState } from "react";
import { api } from "../../services/api";
import { useAuth } from "../../context/AuthContext";
import SidebarLayout from "../../components/SidebarLayout";
import { useRouter } from "next/navigation";

export default function DashboardPage() {
  const { user, hasRole } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(true);

  // Super Admin / Principal Data
  const [analytics, setAnalytics] = useState<any>(null);
  const [recentLogs, setRecentLogs] = useState<any[]>([]);

  // Teacher Data
  const [teacherSubjects, setTeacherSubjects] = useState<any[]>([]);
  const [classes, setClasses] = useState<any[]>([]);

  // Student & Parent Data
  const [studentProfile, setStudentProfile] = useState<any>(null);
  const [studentGrades, setStudentGrades] = useState<any[]>([]);
  const [studentAttendance, setStudentAttendance] = useState<{ summary: any; records: any[] }>({ summary: null, records: [] });
  const [studentLedger, setStudentLedger] = useState<any>(null);

  // Parent specific children mapping
  const [myChildren, setMyChildren] = useState<any[]>([]);
  const [selectedChildId, setSelectedChildId] = useState<string>("");

  // Accountant Data
  const [fees, setFees] = useState<any[]>([]);
  const [auditSummary, setAuditSummary] = useState<any[]>([]);

  // Librarian Data
  const [books, setBooks] = useState<any[]>([]);
  const [activeBorrowings, setActiveBorrowings] = useState<any[]>([]);

  useEffect(() => {
    loadDashboard();
  }, [selectedChildId]);

  const loadDashboard = async () => {
    if (!user) return;
    setLoading(true);
    try {
      if (hasRole(["Super Admin", "SUPER_ADMIN", "Principal", "Vice Principal", "Registrar", "ICT Administrator"])) {
        const [anData, audData] = await Promise.all([
          api.getSchoolAnalytics().catch(() => null),
          api.getAuditLogs("?limit=5").catch(() => ({ logs: [] })),
        ]);
        setAnalytics(anData);
        setRecentLogs(audData.logs);
      } 
      
      if (hasRole(["Teacher", "Department Head"])) {
        const [clsData, tData] = await Promise.all([
          api.getClasses().catch(() => []),
          api.getTeachers().catch(() => []),
        ]);
        setClasses(clsData);
        
        // Find self inside teacher profiles to discover assigned classes
        const selfTeacher = tData.find((t: any) => t.userId === user.id);
        if (selfTeacher) {
          // Flatten subjects taught by self
          const mySubjects = clsData.flatMap((c: any) => 
            (c.classSubjects || []).filter((cs: any) => cs.teacherId === selfTeacher.id).map((cs: any) => ({
              ...cs,
              className: c.name
            }))
          );
          setTeacherSubjects(mySubjects);
        }
      } 
      
      if (hasRole("Student")) {
        const sId = user.studentId;
        if (sId) {
          const [grades, attendance, ledger] = await Promise.all([
            api.getStudentGrades(sId).catch(() => []),
            api.getStudentAttendance(sId).catch(() => ({ summary: null, records: [] })),
            api.getStudentLedger(sId).catch(() => null),
          ]);
          setStudentGrades(Array.isArray(grades) ? grades : []);
          setStudentAttendance(attendance && typeof attendance === "object" && !Array.isArray(attendance) ? attendance : { summary: null, records: [] });
          setStudentLedger(ledger);
        }
      } 
      
      if (hasRole("Parent")) {
        const rawChildren = await api.getStudents().catch(() => []);
        const children = Array.isArray(rawChildren) ? rawChildren : [];
        setMyChildren(children);

        // Auto-select first child if not selected
        let activeChildId = selectedChildId;
        if (!activeChildId && children.length > 0) {
          activeChildId = children[0].id;
          setSelectedChildId(activeChildId);
        }

        if (activeChildId) {
          const matchedChild = children.find((c: any) => c.id === activeChildId);
          setStudentProfile(matchedChild);

          const [grades, attendance, ledger] = await Promise.all([
            api.getStudentGrades(activeChildId).catch(() => []),
            api.getStudentAttendance(activeChildId).catch(() => ({ summary: null, records: [] })),
            api.getStudentLedger(activeChildId).catch(() => null),
          ]);
          setStudentGrades(Array.isArray(grades) ? grades : []);
          setStudentAttendance(attendance && typeof attendance === "object" && !Array.isArray(attendance) ? attendance : { summary: null, records: [] });
          setStudentLedger(ledger);
        }
      } 
      
      if (hasRole("Accountant")) {
        const [feesData, audData] = await Promise.all([
          api.getFees().catch(() => []),
          api.getAuditLogs("?module=Finance&limit=5").catch(() => ({ logs: [] }))
        ]);
        setFees(Array.isArray(feesData) ? feesData : []);
        setAuditSummary(Array.isArray(audData?.logs) ? audData.logs : []);
      } 
      
      if (hasRole("Librarian")) {
        const [bData, brData] = await Promise.all([
          api.getBooks().catch(() => []),
          api.getActiveBorrowings().catch(() => [])
        ]);
        setBooks(bData);
        setActiveBorrowings(brData);
      }
    } catch (_) {}
    setLoading(false);
  };

  const getGreeting = () => {
    const hours = new Date().getHours();
    if (hours < 12) return "Good Morning";
    if (hours < 17) return "Good Afternoon";
    return "Good Evening";
  };

  return (
    <SidebarLayout activeId="dashboard">
      <header className="header" style={{ background: "#ffffff", padding: "20px 28px", borderBottom: "1px solid #e2e8f0" }}>
        <div>
          <div className="header-title" style={{ fontSize: "22px", fontWeight: "800", color: "#0f172a" }}>
            {getGreeting()}, {user?.username} 👋
          </div>
          <div className="header-sub" style={{ fontSize: "13px", color: "#64748b", marginTop: "2px" }}>
            Role Membership: <span style={{ color: "#3b82f6", fontWeight: "600" }}>{user?.roles.join(", ")}</span>
          </div>
        </div>
      </header>

      <div className="page animate-fade-in" style={{ padding: "28px", background: "var(--surface-base)", minHeight: "calc(100vh - 68px)" }}>
        {loading ? (
          <div style={{ textAlign: "center", padding: "60px" }}>
            <div className="spinner" style={{ margin: "0 auto 10px" }} />
            <div style={{ color: "#64748b" }}>Preparing your workspaces...</div>
          </div>
        ) : (
          <div>
            {/* ─── ADMIN / PRINCIPAL DASHBOARD ────────────────────────────────────────── */}
            {hasRole(["Super Admin", "SUPER_ADMIN", "Principal", "Vice Principal", "Registrar", "ICT Administrator"]) && analytics && (
              <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
                {/* Stats Counters */}
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "20px" }}>
                  {[
                    { label: "Total Students", value: analytics.counters?.students, icon: "👨‍🎓", color: "#3b82f6" },
                    { label: "Total Teachers", value: analytics.counters?.teachers, icon: "👨‍🏫", color: "#10b981" },
                    { label: "Class Sections", value: analytics.counters?.classes, icon: "🏛️", color: "#f59e0b" },
                    { label: "Library Catalog", value: analytics.counters?.books, icon: "📚", color: "#ef4444" },
                  ].map((stat) => (
                    <div key={stat.label} style={{ background: "#ffffff", padding: "24px", borderRadius: "10px", boxShadow: "0 1px 3px rgba(0,0,0,0.02)", display: "flex", alignItems: "center", gap: "16px" }}>
                      <span style={{ fontSize: "36px" }}>{stat.icon}</span>
                      <div>
                        <div style={{ fontSize: "12px", color: "#64748b", fontWeight: "600" }}>{stat.label}</div>
                        <div style={{ fontSize: "24px", fontWeight: "800", color: "#0f172a", marginTop: "4px" }}>{stat.value || 0}</div>
                      </div>
                    </div>
                  ))}
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "24px" }}>
                  {/* Gender Distribution Chart Info */}
                  <div className="card" style={{ background: "#ffffff", padding: "24px", borderRadius: "8px" }}>
                    <h3 style={{ fontSize: "15px", fontWeight: "700", marginBottom: "16px" }}>📊 Student Demographics</h3>
                    <div style={{ display: "flex", gap: "32px", alignItems: "center", justifyContent: "center", padding: "20px 0" }}>
                      <div style={{ textAlign: "center" }}>
                        <div style={{ fontSize: "36px" }}>🙋‍♂️</div>
                        <div style={{ fontWeight: "700", fontSize: "18px", color: "#1e293b" }}>{analytics.gender?.male || 0}</div>
                        <div style={{ fontSize: "11px", color: "#64748b" }}>Male Students</div>
                      </div>
                      <div style={{ height: "40px", width: "1px", background: "#e2e8f0" }} />
                      <div style={{ textAlign: "center" }}>
                        <div style={{ fontSize: "36px" }}>🙋‍♀️</div>
                        <div style={{ fontWeight: "700", fontSize: "18px", color: "#1e293b" }}>{analytics.gender?.female || 0}</div>
                        <div style={{ fontSize: "11px", color: "#64748b" }}>Female Students</div>
                      </div>
                    </div>
                  </div>

                  {/* Ministry Reporting High School candidate info */}
                  <div className="card" style={{ background: "#ffffff", padding: "24px", borderRadius: "8px" }}>
                    <h3 style={{ fontSize: "15px", fontWeight: "700", marginBottom: "16px" }}>🇪🇹 Ministry Candidate Metrics</h3>
                    <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                      <div style={{ display: "flex", justifyContent: "space-between", fontSize: "13px" }}>
                        <span>Grade 10 National Exam Candidates</span>
                        <strong style={{ color: "#0f172a" }}>{analytics.streams?.find((s: any) => s.groupName === "Grade 10A" || s.groupName === "Grade 10B")?.count || 0}</strong>
                      </div>
                      <div style={{ height: "1px", background: "#f1f5f9" }} />
                      <div style={{ display: "flex", justifyContent: "space-between", fontSize: "13px" }}>
                        <span>Grade 12 ESSLCE Candidates</span>
                        <strong style={{ color: "#0f172a" }}>{analytics.streams?.find((s: any) => s.groupName === "Grade 12A" || s.groupName === "Grade 12B")?.count || 0}</strong>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Audit logs quick panel */}
                <div className="card" style={{ background: "#ffffff", padding: "24px", borderRadius: "8px" }}>
                  <h3 style={{ fontSize: "15px", fontWeight: "700", marginBottom: "16px" }}>📋 Recent Security Actions Audit</h3>
                  <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                    {recentLogs.map((log: any) => (
                      <div key={log.id} style={{ display: "flex", justifyItems: "center", justifyContent: "space-between", fontSize: "12.5px", padding: "10px", background: "#f8fafc", borderRadius: "6px" }}>
                        <div>
                          <strong>{log.user?.username || "System"}</strong> - <span style={{ color: "#64748b" }}>{log.action} ({log.module})</span>
                        </div>
                        <span style={{ fontSize: "11px", color: "#94a3b8" }}>{new Date(log.createdAt).toLocaleTimeString()}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* ─── TEACHER DASHBOARD ──────────────────────────────────────────────────── */}
            {hasRole(["Teacher", "Department Head"]) && (
              <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
                <div className="card" style={{ background: "#ffffff", padding: "24px", borderRadius: "8px" }}>
                  <h3 style={{ fontSize: "16px", fontWeight: "700", marginBottom: "14px" }}>📖 My Assigned Class Subjects</h3>
                  {teacherSubjects.length === 0 ? (
                    <div style={{ color: "#64748b", textAlign: "center", padding: "20px" }}>
                      No class subject mappings currently registered under your name.
                    </div>
                  ) : (
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: "16px" }}>
                      {teacherSubjects.map((sub, i) => (
                        <div key={i} style={{ border: "1px solid #e2e8f0", padding: "16px", borderRadius: "8px" }}>
                          <div style={{ fontSize: "16px", fontWeight: "700", color: "#1e293b" }}>{sub.className}</div>
                          <div style={{ fontSize: "13px", color: "#64748b", marginTop: "4px" }}>Subject ID: {sub.subjectId}</div>
                          <div style={{ display: "flex", gap: "8px", marginTop: "12px" }}>
                            <button onClick={() => router.push("/attendance")} className="btn btn-outline" style={{ fontSize: "11px", padding: "4px 8px", cursor: "pointer" }}>Record Attendance</button>
                            <button onClick={() => router.push("/grades")} className="btn btn-outline" style={{ fontSize: "11px", padding: "4px 8px", cursor: "pointer" }}>Input Marks</button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* ─── STUDENT DASHBOARD ─────────────────────────────────────────────────── */}
            {hasRole("Student") && (
              <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: "24px" }}>
                {/* Grades assessment */}
                <div className="card" style={{ background: "#ffffff", padding: "24px", borderRadius: "8px" }}>
                  <h3 style={{ fontSize: "16px", fontWeight: "700", marginBottom: "16px" }}>📝 Continuous Assessment Grades</h3>
                  {studentGrades.length === 0 ? (
                    <p style={{ color: "#64748b" }}>No marks logged for your student profile yet.</p>
                  ) : (
                    <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left", fontSize: "13.5px" }}>
                      <thead>
                        <tr style={{ borderBottom: "2px solid #e2e8f0" }}>
                          <th style={{ padding: "8px 0" }}>Exam/Test</th>
                          <th style={{ padding: "8px 0" }}>Marks Obtained</th>
                          <th style={{ padding: "8px 0" }}>Remarks</th>
                        </tr>
                      </thead>
                      <tbody>
                        {studentGrades.map((g: any) => (
                          <tr key={g.id} style={{ borderBottom: "1px solid #f1f5f9" }}>
                            <td style={{ padding: "8px 0", fontWeight: "600" }}>{g.exam?.name || "Test"}</td>
                            <td style={{ padding: "8px 0" }}>{g.marksObtained} / {g.exam?.maxMarks}</td>
                            <td style={{ padding: "8px 0", color: "#64748b" }}>{g.remarks || "-"}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </div>

                {/* Attendance Standing */}
                <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
                  <div className="card" style={{ background: "#ffffff", padding: "24px", borderRadius: "8px" }}>
                    <h3 style={{ fontSize: "15px", fontWeight: "700", marginBottom: "16px" }}>✅ My Attendance Rate</h3>
                    {!studentAttendance.summary || studentAttendance.summary.totalDays === 0 ? (
                      <p style={{ color: "#64748b" }}>No attendance registered.</p>
                    ) : (
                      <div style={{ textAlign: "center" }}>
                        <div style={{ fontSize: "48px" }}>📈</div>
                        <div style={{ fontSize: "20px", fontWeight: "800", marginTop: "10px" }}>
                          {Math.round(((studentAttendance.summary.Present + studentAttendance.summary.Late) / studentAttendance.summary.totalDays) * 100)}%
                        </div>
                        <p style={{ fontSize: "12px", color: "#64748b", marginTop: "4px" }}>Attendance Standing</p>
                        <div style={{ display: "flex", justifyContent: "center", gap: "12px", marginTop: "10px", fontSize: "12px", color: "#64748b" }}>
                          <span>✅ Present: {studentAttendance.summary.Present}</span>
                          <span>❌ Absent: {studentAttendance.summary.Absent}</span>
                          <span>⏰ Late: {studentAttendance.summary.Late}</span>
                        </div>
                      </div>
                    )}
                  </div>
                  
                  {/* Fees balance */}
                  <div className="card" style={{ background: "#ffffff", padding: "24px", borderRadius: "8px" }}>
                    <h3 style={{ fontSize: "15px", fontWeight: "700", marginBottom: "14px" }}>💰 Tuition Fees Balance</h3>
                    {!studentLedger || (Array.isArray(studentLedger?.fees) && studentLedger.fees.length === 0) ? (
                      <p style={{ color: "#64748b" }}>No invoices outstanding.</p>
                    ) : (
                      <div>
                        <div style={{ fontSize: "20px", fontWeight: "800", color: "#ef4444" }}>
                          {(studentLedger?.totalOutstanding ?? studentLedger?.balance ?? 0).toLocaleString()} ETB
                        </div>
                        <p style={{ fontSize: "12px", color: "#64748b", marginTop: "4px" }}>Pending Outstanding Amount</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* ─── PARENT DASHBOARD ──────────────────────────────────────────────────── */}
            {hasRole("Parent") && (
              <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
                {/* Child Select Bar */}
                <div className="card" style={{ background: "#ffffff", padding: "16px 20px", borderRadius: "8px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                    <span style={{ fontSize: "20px" }}>👪</span>
                    <span style={{ fontWeight: "700", fontSize: "14.5px" }}>Select Ward Student Profile</span>
                  </div>
                  <select value={selectedChildId} onChange={e => setSelectedChildId(e.target.value)} style={{ padding: "6px 12px", borderRadius: "6px", border: "1px solid #cbd5e1" }}>
                    {myChildren.map((c: any) => (
                      <option key={c.id} value={c.id}>{c.firstName} {c.lastName} ({c.admissionNumber})</option>
                    ))}
                  </select>
                </div>

                {selectedChildId ? (
                  <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: "24px" }}>
                    {/* Grades continuous assessment */}
                    <div className="card" style={{ background: "#ffffff", padding: "24px", borderRadius: "8px" }}>
                      <h3 style={{ fontSize: "16px", fontWeight: "700", marginBottom: "16px" }}>📝 Academic Marks Progress</h3>
                      {studentGrades.length === 0 ? (
                        <p style={{ color: "#64748b" }}>No marks logged for this student yet.</p>
                      ) : (
                        <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left", fontSize: "13.5px" }}>
                          <thead>
                            <tr style={{ borderBottom: "2px solid #e2e8f0" }}>
                              <th style={{ padding: "8px 0" }}>Exam/Test</th>
                              <th style={{ padding: "8px 0" }}>Marks Obtained</th>
                              <th style={{ padding: "8px 0" }}>Remarks</th>
                            </tr>
                          </thead>
                          <tbody>
                            {studentGrades.map((g: any) => (
                              <tr key={g.id} style={{ borderBottom: "1px solid #f1f5f9" }}>
                                <td style={{ padding: "8px 0", fontWeight: "600" }}>{g.exam?.name || "Test"}</td>
                                <td style={{ padding: "8px 0" }}>{g.marksObtained} / {g.exam?.maxMarks}</td>
                                <td style={{ padding: "8px 0", color: "#64748b" }}>{g.remarks || "-"}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      )}
                    </div>

                    <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
                      {/* Attendance */}
                      <div className="card" style={{ background: "#ffffff", padding: "24px", borderRadius: "8px" }}>
                        <h3 style={{ fontSize: "15px", fontWeight: "700", marginBottom: "16px" }}>📅 Attendance rate</h3>
                        {!studentAttendance.summary || studentAttendance.summary.totalDays === 0 ? (
                          <p style={{ color: "#64748b" }}>No logs registered.</p>
                        ) : (
                          <div style={{ textAlign: "center" }}>
                            <div style={{ fontSize: "36px" }}>📈</div>
                            <div style={{ fontSize: "20px", fontWeight: "800", marginTop: "10px" }}>
                              {Math.round(((studentAttendance.summary.Present + studentAttendance.summary.Late) / studentAttendance.summary.totalDays) * 100)}%
                            </div>
                            <p style={{ fontSize: "12px", color: "#64748b", marginTop: "4px" }}>Attendance Percentage</p>
                            <div style={{ display: "flex", justifyContent: "center", gap: "10px", marginTop: "8px", fontSize: "12px", color: "#64748b" }}>
                              <span>✅ Present: {studentAttendance.summary.Present}</span>
                              <span>❌ Absent: {studentAttendance.summary.Absent}</span>
                              <span>⏰ Late: {studentAttendance.summary.Late}</span>
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Fees */}
                      <div className="card" style={{ background: "#ffffff", padding: "24px", borderRadius: "8px" }}>
                        <h3 style={{ fontSize: "15px", fontWeight: "700", marginBottom: "14px" }}>💰 Fees Outstanding</h3>
                        {!studentLedger || (Array.isArray(studentLedger?.fees) && studentLedger.fees.length === 0) ? (
                          <p style={{ color: "#64748b" }}>No outstanding balances.</p>
                        ) : (
                          <div>
                            <div style={{ fontSize: "20px", fontWeight: "800", color: "#ef4444" }}>
                              {(studentLedger?.totalOutstanding ?? studentLedger?.balance ?? 0).toLocaleString()} ETB
                            </div>
                            <p style={{ fontSize: "12px", color: "#64748b", marginTop: "4px" }}>Total Outstanding Tuition Fees</p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div style={{ textAlign: "center", color: "#64748b", padding: "20px" }}>
                    No ward student accounts found linked to your parent user session.
                  </div>
                )}
              </div>
            )}

            {/* ─── ACCOUNTANT DASHBOARD ───────────────────────────────────────────────── */}
            {hasRole("Accountant") && (
              <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 2fr", gap: "24px" }}>
                  <div className="card" style={{ background: "#ffffff", padding: "24px", borderRadius: "8px" }}>
                    <h3 style={{ fontSize: "15px", fontWeight: "700", marginBottom: "16px" }}>💵 Active Fee Templates</h3>
                    <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                      {fees.map((fee: any) => (
                        <div key={fee.id} style={{ padding: "10px", background: "#f8fafc", borderRadius: "6px" }}>
                          <div style={{ fontWeight: "700", fontSize: "13px" }}>{fee.title}</div>
                          <div style={{ fontSize: "14.5px", color: "#065f46", fontWeight: "600", marginTop: "4px" }}>{Number(fee.amount).toLocaleString()} ETB</div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="card" style={{ background: "#ffffff", padding: "24px", borderRadius: "8px" }}>
                    <h3 style={{ fontSize: "15px", fontWeight: "700", marginBottom: "16px" }}>💰 Recent Financial Actions Logs</h3>
                    <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                      {auditSummary.map((log: any) => (
                        <div key={log.id} style={{ display: "flex", justifyItems: "center", justifyContent: "space-between", fontSize: "12.5px", padding: "10px", background: "#f8fafc", borderRadius: "6px" }}>
                          <div>
                            <strong>{log.user?.username || "System"}</strong> - <span style={{ color: "#64748b" }}>{log.action}</span>
                          </div>
                          <span style={{ fontSize: "11px", color: "#94a3b8" }}>{new Date(log.createdAt).toLocaleDateString()}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* ─── LIBRARIAN DASHBOARD ────────────────────────────────────────────────── */}
            {hasRole("Librarian") && (
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "24px" }}>
                <div className="card" style={{ background: "#ffffff", padding: "24px", borderRadius: "8px" }}>
                  <h3 style={{ fontSize: "15px", fontWeight: "700", marginBottom: "16px" }}>📚 Books Inventory</h3>
                  <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                    {books.slice(0, 5).map((book: any) => (
                      <div key={book.id} style={{ display: "flex", justifyContent: "space-between", padding: "10px", background: "#f8fafc", borderRadius: "6px", fontSize: "13px" }}>
                        <span>{book.title} ({book.author})</span>
                        <strong style={{ color: "#334155" }}>Qty: {book.quantity}</strong>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="card" style={{ background: "#ffffff", padding: "24px", borderRadius: "8px" }}>
                  <h3 style={{ fontSize: "15px", fontWeight: "700", marginBottom: "16px" }}>📖 Active Borrowings</h3>
                  {activeBorrowings.length === 0 ? (
                    <p style={{ color: "#64748b" }}>No active checkouts logged.</p>
                  ) : (
                    <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                      {activeBorrowings.slice(0, 5).map((borrow: any) => (
                        <div key={borrow.id} style={{ display: "flex", justifyContent: "space-between", padding: "10px", background: "#f8fafc", borderRadius: "6px", fontSize: "13px" }}>
                          <span>{borrow.book?.title} checkout to student</span>
                          <span style={{ fontSize: "11px", color: "#ef4444" }}>Due: {new Date(borrow.dueDate).toLocaleDateString()}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </SidebarLayout>
  );
}
