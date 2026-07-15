"use client";

import React, { useEffect, useState } from "react";
import SidebarLayout from "../../components/SidebarLayout";
import { api } from "../../services/api";

interface ClassSection {
  id: string;
  name: string;
  gradeLevel: number;
}

interface Student {
  id: string;
  admissionNumber: string;
  firstName: string;
  middleName: string;
  lastName: string;
  classId: string;
}

interface AttendanceRecord {
  studentId: string;
  status: "Present" | "Absent" | "Late";
}

export default function AttendancePage() {
  const [classes, setClasses] = useState<ClassSection[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [selectedClassId, setSelectedClassId] = useState("");
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split("T")[0]);
  
  // Attendance Sheet State
  const [sheet, setSheet] = useState<Record<string, "Present" | "Absent" | "Late">>({});
  const [alert, setAlert] = useState<{ type: "success" | "error"; msg: string } | null>(null);

  useEffect(() => {
    loadClasses();
  }, []);

  useEffect(() => {
    if (selectedClassId) {
      loadAttendanceSheet();
    } else {
      setStudents([]);
      setSheet({});
    }
  }, [selectedClassId, selectedDate]);

  async function loadClasses() {
    setLoading(true);
    try {
      const cls = await api.getClasses();
      setClasses(cls);
      if (cls.length > 0) {
        setSelectedClassId(cls[0].id);
      }
    } catch (e: any) {
      setAlert({ type: "error", msg: e.message || "Failed to load classes." });
    } finally {
      setLoading(false);
    }
  }

  async function loadAttendanceSheet() {
    setLoading(true);
    setAlert(null);
    try {
      // 1. Fetch all students to identify who is in this class
      const allStudents: Student[] = await api.getStudents();
      const classStudents = allStudents.filter((s) => s.classId === selectedClassId);
      setStudents(classStudents);

      // 2. Fetch recorded attendance for this class and date
      const recorded: any[] = await api.getClassAttendance(selectedClassId, selectedDate);
      
      // 3. Map recorded attendance to our local sheet state. Default unrecorded to "Present".
      const initialSheet: Record<string, "Present" | "Absent" | "Late"> = {};
      classStudents.forEach((s) => {
        const found = recorded.find((r) => r.studentId === s.id);
        initialSheet[s.id] = found ? found.status : "Present";
      });
      setSheet(initialSheet);
    } catch (e: any) {
      setAlert({ type: "error", msg: e.message || "Failed to load attendance records." });
    } finally {
      setLoading(false);
    }
  }

  const handleStatusChange = (studentId: string, status: "Present" | "Absent" | "Late") => {
    setSheet((prev) => ({
      ...prev,
      [studentId]: status,
    }));
  };

  const handleSave = async () => {
    if (!selectedClassId) return;
    setSaving(true);
    setAlert(null);

    // Prepare bulk payload
    const records = students.map((s) => ({
      studentId: s.id,
      classId: selectedClassId,
      date: selectedDate,
      status: sheet[s.id] || "Present",
    }));

    try {
      await api.bulkAttendance({ records });
      setAlert({ type: "success", msg: "Attendance sheet successfully recorded and locked!" });
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (e: any) {
      setAlert({ type: "error", msg: e.message || "Failed to submit attendance sheet." });
    } finally {
      setSaving(false);
    }
  };

  const activeClassName = classes.find((c) => c.id === selectedClassId)?.name || "";

  return (
    <SidebarLayout activeId="attendance">
      <div className="page animate-fade-in" style={{ padding: "28px" }}>
        {/* Breadcrumbs */}
        <div style={{ marginBottom: "24px" }}>
          <div style={{ fontSize: "18px", fontWeight: "bold", color: "#111111" }}>Daily Attendance Register</div>
          <div style={{ fontSize: "12.5px", color: "#888888", marginTop: "4px" }}>
            Home - <span style={{ color: "var(--color-primary)" }}>Record Attendance</span>
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
            <span>{alert.type === "success" ? "✅" : "❌"} {alert.msg}</span>
            <button style={{ fontWeight: "bold" }} onClick={() => setAlert(null)}>✕</button>
          </div>
        )}

        {/* Filter Toolbar */}
        <div className="card mb-4" style={{ padding: "20px" }}>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "20px" }}>
            <div className="form-group">
              <label className="form-label">Select Class Section</label>
              <select
                className="form-select"
                value={selectedClassId}
                onChange={(e) => setSelectedClassId(e.target.value)}
                style={{ background: "#f8f9fa", border: "1px solid #e0e0e0" }}
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
              <label className="form-label">Register Date</label>
              <input
                type="date"
                className="form-input"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                style={{ background: "#f8f9fa", border: "1px solid #e0e0e0" }}
              />
            </div>
          </div>
        </div>

        {/* Roster Table Card */}
        {selectedClassId && (
          <div className="card">
            <div className="card-header" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div>
                <span className="card-title" style={{ fontSize: "16px", fontWeight: "bold" }}>Roster for {activeClassName}</span>
                <div style={{ fontSize: "12px", color: "#666" }}>Date: {new Date(selectedDate).toDateString()}</div>
              </div>
              <span className="badge badge-gray">{students.length} students</span>
            </div>

            <div className="card-body" style={{ padding: "0" }}>
              <div className="table-wrap">
                {loading ? (
                  <div style={{ padding: "40px", textAlign: "center" }}>
                    <div className="spinner" style={{ margin: "0 auto 12px" }} />
                    <div style={{ color: "#666" }}>Loading class list...</div>
                  </div>
                ) : students.length === 0 ? (
                  <div className="empty-state" style={{ padding: "40px", textAlign: "center" }}>
                    <div style={{ fontSize: "48px" }}>👨‍🎓</div>
                    <div style={{ fontWeight: "bold", fontSize: "16px", marginTop: "12px" }}>No Students Registered</div>
                    <div style={{ color: "#777", fontSize: "13px" }}>There are no students enrolled in {activeClassName}. Please enroll students in the Students Portal first.</div>
                  </div>
                ) : (
                  <table>
                    <thead>
                      <tr>
                        <th>Admission No.</th>
                        <th>Student Name</th>
                        <th style={{ width: "300px", textAlign: "center" }}>Attendance Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {students.map((s) => (
                        <tr key={s.id}>
                          <td><span className="badge badge-blue">{s.admissionNumber}</span></td>
                          <td className="td-name">{s.firstName} {s.middleName} {s.lastName}</td>
                          <td>
                            <div style={{ display: "flex", justifyContent: "center", gap: "16px" }}>
                              {/* Present Option */}
                              <label style={{ display: "flex", alignItems: "center", gap: "6px", cursor: "pointer", fontSize: "13px" }}>
                                <input
                                  type="radio"
                                  name={`status-${s.id}`}
                                  checked={sheet[s.id] === "Present"}
                                  onChange={() => handleStatusChange(s.id, "Present")}
                                  style={{ accentColor: "var(--color-success)" }}
                                />
                                <span style={{ color: sheet[s.id] === "Present" ? "var(--color-success)" : "#555", fontWeight: sheet[s.id] === "Present" ? "bold" : "normal" }}>
                                  Present
                                </span>
                              </label>

                              {/* Late Option */}
                              <label style={{ display: "flex", alignItems: "center", gap: "6px", cursor: "pointer", fontSize: "13px" }}>
                                <input
                                  type="radio"
                                  name={`status-${s.id}`}
                                  checked={sheet[s.id] === "Late"}
                                  onChange={() => handleStatusChange(s.id, "Late")}
                                  style={{ accentColor: "var(--color-warning)" }}
                                />
                                <span style={{ color: sheet[s.id] === "Late" ? "var(--color-warning)" : "#555", fontWeight: sheet[s.id] === "Late" ? "bold" : "normal" }}>
                                  Late
                                </span>
                              </label>

                              {/* Absent Option */}
                              <label style={{ display: "flex", alignItems: "center", gap: "6px", cursor: "pointer", fontSize: "13px" }}>
                                <input
                                  type="radio"
                                  name={`status-${s.id}`}
                                  checked={sheet[s.id] === "Absent"}
                                  onChange={() => handleStatusChange(s.id, "Absent")}
                                  style={{ accentColor: "var(--color-danger)" }}
                                />
                                <span style={{ color: sheet[s.id] === "Absent" ? "var(--color-danger)" : "#555", fontWeight: sheet[s.id] === "Absent" ? "bold" : "normal" }}>
                                  Absent
                                </span>
                              </label>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            </div>

            {students.length > 0 && !loading && (
              <div className="card-footer" style={{ display: "flex", justifyContent: "flex-end" }}>
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={handleSave}
                  disabled={saving}
                  style={{ background: "#ffae01", color: "#111111", fontWeight: "bold" }}
                >
                  {saving ? "Saving..." : "Save Attendance Sheet"}
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </SidebarLayout>
  );
}
