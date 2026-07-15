"use client";

import React, { useEffect, useState } from "react";
import { api } from "../../services/api";
import SidebarLayout from "../../components/SidebarLayout";

interface RankRow {
  rank: number;
  firstName: string;
  middleName: string;
  lastName: string;
  admissionNumber: string;
  average: number;
  grandTotal: number;
  subjectGrades: { subjectName: string; score: number }[];
}

export default function RankingsPage() {
  const [classes,     setClasses]     = useState<any[]>([]);
  const [rankings,    setRankings]    = useState<RankRow[]>([]);
  const [classId,     setClassId]     = useState("");
  const [semester,    setSemester]    = useState("Semester_1");
  const [academicYear,setAcademicYear]= useState("2026-2027");
  const [loading,     setLoading]     = useState(false);
  const [selectedClass, setSelectedClass] = useState<any>(null);

  useEffect(() => {
    api.getClasses().then(setClasses).catch(() => {});
  }, []);

  const loadRankings = async () => {
    if (!classId) return;
    setLoading(true);
    try {
      const data = await api.getClassRankings(classId, semester, academicYear);
      setRankings(data);
      setSelectedClass(classes.find((c) => c.id === classId));
    } catch (e) {
      setRankings([]);
    }
    setLoading(false);
  };

  const getRankClass = (rank: number) => {
    if (rank === 1) return "rank-1";
    if (rank === 2) return "rank-2";
    if (rank === 3) return "rank-3";
    return "";
  };

  const getScoreColor = (score: number) => {
    if (score >= 90) return "#22c55e";
    if (score >= 75) return "#14b8a6";
    if (score >= 60) return "#f59e0b";
    return "#ef4444";
  };

  return (
    <SidebarLayout activeId="rankings">
      <header className="header">
        <div>
          <div className="header-title">Class Rankings</div>
          <div className="header-sub">Automated homeroom ranking with weighted continuous assessment</div>
        </div>
      </header>

      <div className="page animate-fade-in">
        <div className="page-header">
          <div className="page-header-left">
            <h1 className="page-header-title">🏆 Sectional Rankings</h1>
            <p className="page-header-sub">Calculates average score across all subjects, sorted by performance</p>
          </div>
        </div>

        {/* Controls */}
        <div className="card mb-4">
          <div className="card-body">
            <div className="form-grid three-col">
              <div className="form-group">
                <label className="form-label">Class Section <span className="form-required">*</span></label>
                <select className="form-select" value={classId} onChange={(e) => setClassId(e.target.value)}>
                  <option value="">— Select Class —</option>
                  {classes.map((c) => (
                    <option key={c.id} value={c.id}>{c.name} (Grade {c.gradeLevel})</option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Semester</label>
                <select className="form-select" value={semester} onChange={(e) => setSemester(e.target.value)}>
                  <option value="Semester_1">Semester 1</option>
                  <option value="Semester_2">Semester 2</option>
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Academic Year</label>
                <input className="form-input" value={academicYear} onChange={(e) => setAcademicYear(e.target.value)} placeholder="e.g. 2026-2027" />
              </div>
            </div>
            <div className="form-actions">
              <button
                className="btn btn-primary"
                onClick={loadRankings}
                disabled={!classId || loading}
              >
                {loading ? "⏳ Calculating..." : "🏆 Generate Rankings"}
              </button>
            </div>
          </div>
        </div>

        {/* Rankings Table */}
        {rankings.length > 0 && (
          <div className="card animate-slide-up">
            <div className="card-header">
              <div>
                <span className="card-title">
                  🏆 {selectedClass?.name} Rankings — {semester.replace("_", " ")} {academicYear}
                </span>
                <p className="text-xs text-muted mt-1">{rankings.length} students ranked</p>
              </div>
              <button className="btn btn-outline btn-sm">🖨️ Print Report Card</button>
            </div>
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Rank</th>
                    <th>Student</th>
                    <th>Admission No.</th>
                    <th>Subjects</th>
                    <th style={{ textAlign: "right" }}>Average</th>
                    <th style={{ textAlign: "right" }}>Grand Total</th>
                  </tr>
                </thead>
                <tbody>
                  {rankings.map((r) => (
                    <tr key={r.admissionNumber}>
                      <td>
                        <span className={`font-bold text-lg ${getRankClass(r.rank)}`}>
                          {r.rank === 1 ? "🥇" : r.rank === 2 ? "🥈" : r.rank === 3 ? "🥉" : `#${r.rank}`}
                        </span>
                      </td>
                      <td>
                        <div className="flex items-center gap-2">
                          <div className="avatar avatar-sm" style={{ background: "linear-gradient(135deg,#6366f1,#8b5cf6)" }}>
                            {r.firstName[0]}
                          </div>
                          <div className="td-name">
                            {r.firstName} {r.middleName} {r.lastName}
                          </div>
                        </div>
                      </td>
                      <td><span className="badge badge-blue">{r.admissionNumber}</span></td>
                      <td>
                        <div className="flex-col gap-1" style={{ minWidth: 200 }}>
                          {r.subjectGrades.map((sg) => (
                            <div key={sg.subjectName} className="score-bar-wrap">
                              <span className="text-xs text-muted" style={{ minWidth: 100, fontSize: 11 }}>{sg.subjectName}</span>
                              <div className="score-bar">
                                <div
                                  className="score-bar-fill"
                                  style={{ width: `${sg.score}%`, background: getScoreColor(sg.score) }}
                                />
                              </div>
                              <span className="text-xs font-bold" style={{ color: getScoreColor(sg.score), minWidth: 36, textAlign: "right" }}>
                                {sg.score.toFixed(1)}%
                              </span>
                            </div>
                          ))}
                        </div>
                      </td>
                      <td style={{ textAlign: "right" }}>
                        <span
                          className="font-bold text-md"
                          style={{ color: getScoreColor(r.average) }}
                        >
                          {r.average.toFixed(1)}%
                        </span>
                      </td>
                      <td style={{ textAlign: "right" }}>
                        <span className="text-secondary">{r.grandTotal.toFixed(1)}</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {!loading && rankings.length === 0 && classId && (
          <div className="empty-state">
            <div className="empty-state-icon">📊</div>
            <div className="empty-state-title">No rankings yet</div>
            <div className="empty-state-desc">
              No grades found for the selected class, semester, and academic year. Enter grades first then generate rankings.
            </div>
          </div>
        )}
      </div>
    </SidebarLayout>
  );
}
