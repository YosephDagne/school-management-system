"use client";

import React, { useEffect, useState } from "react";
import SidebarLayout from "../../components/SidebarLayout";
import { api } from "../../services/api";

interface ClassSection {
  id: string;
  name: string;
  gradeLevel: number;
}

interface SubjectGrade {
  subjectId: string;
  subjectName: string;
  subjectCode: string;
  score: number;
}

interface StudentRank {
  studentId: string;
  firstName: string;
  middleName: string;
  lastName: string;
  admissionNumber: string;
  subjectGrades: SubjectGrade[];
  grandTotal: number;
  average: number;
  rank: number;
}

export default function RankingsPage() {
  const [classes, setClasses] = useState<ClassSection[]>([]);
  const [rankings, setRankings] = useState<StudentRank[]>([]);
  const [loading, setLoading] = useState(false);
  const [classesLoading, setClassesLoading] = useState(true);
  
  // Selection filters
  const [selectedClassId, setSelectedClassId] = useState("");
  const [selectedSemester, setSelectedSemester] = useState("Semester 1");
  const [selectedYear, setSelectedYear] = useState("2026-2027");
  const [expandedStudentId, setExpandedStudentId] = useState<string | null>(null);
  const [alert, setAlert] = useState<{ type: "success" | "error"; msg: string } | null>(null);

  useEffect(() => {
    loadClasses();
  }, []);

  async function loadClasses() {
    setClassesLoading(true);
    try {
      const list = await api.getClasses();
      setClasses(list);
      if (list.length > 0) {
        setSelectedClassId(list[0].id);
      }
    } catch (e: any) {
      setAlert({ type: "error", msg: e.message || "Failed to load classes." });
    } finally {
      setClassesLoading(false);
    }
  }

  const handleCalculate = async () => {
    if (!selectedClassId) return;
    setLoading(true);
    setAlert(null);
    setRankings([]);
    setExpandedStudentId(null);
    try {
      const data = await api.getClassRankings(selectedClassId, selectedSemester, selectedYear);
      setRankings(data);
    } catch (e: any) {
      setAlert({ type: "error", msg: e.message || "No exams or grades recorded yet for this selection." });
    } finally {
      setLoading(false);
    }
  };

  const getRankMedal = (rank: number) => {
    if (rank === 1) return "🥇 1st";
    if (rank === 2) return "🥈 2nd";
    if (rank === 3) return "🥉 3rd";
    return `${rank}th`;
  };

  const toggleExpand = (studentId: string) => {
    setExpandedStudentId(expandedStudentId === studentId ? null : studentId);
  };

  const activeClassName = classes.find((c) => c.id === selectedClassId)?.name || "";

  return (
    <SidebarLayout activeId="rankings">
      <div className="page animate-fade-in" style={{ padding: "28px" }}>
        {/* Breadcrumbs */}
        <div style={{ marginBottom: "24px" }}>
          <div style={{ fontSize: "18px", fontWeight: "bold", color: "#111111" }}>Class Leaderboards & Rankings</div>
          <div style={{ fontSize: "12.5px", color: "#888888", marginTop: "4px" }}>
            Home - <span style={{ color: "var(--color-primary)" }}>Academic Rankings</span>
          </div>
        </div>

        {alert && (
          <div className={`alert alert-${alert.type} mb-4`} style={{
            padding: "12px 16px",
            borderRadius: "6px",
            background: alert.type === "success" ? "#d1fae5" : "#fee2e2",
            color: alert.type === "success" ? "#065f46" : "#991b1b",
            fontSize: "13px",
            display: "flex",
            justifyContent: "space-between"
          }}>
            <span>{alert.type === "success" ? "✅" : "⚠️"} {alert.msg}</span>
            <button style={{ fontWeight: "bold" }} onClick={() => setAlert(null)}>✕</button>
          </div>
        )}

        {/* Filter Toolbar */}
        <div className="card mb-4" style={{ padding: "20px" }}>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "20px", alignItems: "flex-end" }}>
            <div className="form-group">
              <label className="form-label">Select Class Section</label>
              <select
                className="form-select"
                value={selectedClassId}
                onChange={(e) => setSelectedClassId(e.target.value)}
                style={{ background: "#f8f9fa", border: "1px solid #e0e0e0" }}
                disabled={classesLoading}
              >
                <option value="">— Select Class —</option>
                {classes.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Semester</label>
              <select
                className="form-select"
                value={selectedSemester}
                onChange={(e) => setSelectedSemester(e.target.value)}
                style={{ background: "#f8f9fa", border: "1px solid #e0e0e0" }}
              >
                <option value="Semester 1">Semester 1</option>
                <option value="Semester 2">Semester 2</option>
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Academic Year</label>
              <select
                className="form-select"
                value={selectedYear}
                onChange={(e) => setSelectedYear(e.target.value)}
                style={{ background: "#f8f9fa", border: "1px solid #e0e0e0" }}
              >
                <option value="2026-2027">2026-2027</option>
                <option value="2027-2028">2027-2028</option>
              </select>
            </div>

            <button
              className="btn btn-primary"
              onClick={handleCalculate}
              disabled={loading || !selectedClassId}
              style={{
                background: "#ffae01",
                color: "#111111",
                fontWeight: "bold",
                height: "42px",
                display: "flex",
                justifyContent: "center"
              }}
            >
              {loading ? "Calculating..." : "🏆 Calculate Rankings"}
            </button>
          </div>
        </div>

        {/* Leaderboard list */}
        {!loading && rankings.length > 0 && (
          <div className="card">
            <div className="card-header">
              <div>
                <span className="card-title" style={{ fontSize: "16px", fontWeight: "bold" }}>Academic Standings Ledger</span>
                <div style={{ fontSize: "12px", color: "#666" }}>Class: {activeClassName} · {selectedSemester} · {selectedYear}</div>
              </div>
            </div>

            <div className="card-body" style={{ padding: "0" }}>
              <div className="table-wrap">
                <table>
                  <thead>
                    <tr>
                      <th style={{ width: "100px" }}>Rank</th>
                      <th>Admission No.</th>
                      <th>Student Full Name</th>
                      <th>Grand Total</th>
                      <th>Average Score</th>
                      <th style={{ width: "140px", textAlign: "right" }}>Detailed Grades</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rankings.map((r) => {
                      const isExpanded = expandedStudentId === r.studentId;
                      return (
                        <React.Fragment key={r.studentId}>
                          <tr style={{ background: r.rank <= 3 ? "rgba(255, 174, 1, 0.04)" : "transparent" }}>
                            <td>
                              <span className={`badge ${r.rank === 1 ? "badge-amber" : r.rank === 2 ? "badge-gray" : r.rank === 3 ? "badge-teal" : "badge-blue"}`} style={{ fontWeight: "bold", fontSize: "12px" }}>
                                {getRankMedal(r.rank)}
                              </span>
                            </td>
                            <td><span className="badge badge-blue">{r.admissionNumber}</span></td>
                            <td className="td-name">{r.firstName} {r.middleName} {r.lastName}</td>
                            <td>{r.grandTotal} marks</td>
                            <td style={{ fontWeight: "bold", color: "var(--color-secondary)", fontSize: "14px" }}>
                              {r.average.toFixed(2)}%
                            </td>
                            <td style={{ textAlign: "right" }}>
                              <button
                                className="btn btn-xs btn-outline"
                                onClick={() => toggleExpand(r.studentId)}
                                style={{ background: isExpanded ? "var(--color-secondary)" : "transparent", color: isExpanded ? "#fff" : "var(--text-secondary)" }}
                              >
                                {isExpanded ? "Hide Card ▴" : "View Card ▾"}
                              </button>
                            </td>
                          </tr>

                          {/* Expanded detail row */}
                          {isExpanded && (
                            <tr>
                              <td colSpan={6} style={{ background: "#f8f9fa", padding: "16px 30px" }}>
                                <div style={{ fontWeight: "bold", marginBottom: "8px", fontSize: "12px", color: "var(--color-secondary)" }}>
                                  Subject-wise Continuous Assessment Standings:
                                </div>
                                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "12px" }}>
                                  {r.subjectGrades.map((sg) => (
                                    <div
                                      key={sg.subjectId}
                                      style={{
                                        background: "#ffffff",
                                        padding: "10px 14px",
                                        borderRadius: "4px",
                                        border: "1px solid #e2e8f0",
                                        display: "flex",
                                        justifyContent: "space-between",
                                        alignItems: "center"
                                      }}
                                    >
                                      <div>
                                        <div style={{ fontWeight: "bold", fontSize: "12px" }}>{sg.subjectName}</div>
                                        <div style={{ fontSize: "10px", color: "#666" }}>Code: {sg.subjectCode}</div>
                                      </div>
                                      <span style={{ fontWeight: "bold", fontSize: "14px", color: sg.score >= 50 ? "var(--color-success)" : "var(--color-danger)" }}>
                                        {sg.score.toFixed(1)}%
                                      </span>
                                    </div>
                                  ))}
                                </div>
                              </td>
                            </tr>
                          )}
                        </React.Fragment>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {loading && (
          <div style={{ padding: "40px", textAlign: "center" }}>
            <div className="spinner" style={{ margin: "0 auto 12px" }} />
            <div>Calculating GPAs and standinds rankings...</div>
          </div>
        )}

        {!loading && rankings.length === 0 && selectedClassId && (
          <div className="card animate-fade-in">
            <div className="card-body">
              <div className="empty-state" style={{ padding: "40px", textAlign: "center" }}>
                <div style={{ fontSize: "48px" }}>📊</div>
                <div style={{ fontWeight: "bold", fontSize: "16px", marginTop: "12px" }}>No Standings Compiled</div>
                <div style={{ color: "#777", fontSize: "13px" }}>Please check that exams and grades are registered for this class. Click "Calculate Rankings" to build leadership registers.</div>
              </div>
            </div>
          </div>
        )}
      </div>
    </SidebarLayout>
  );
}
