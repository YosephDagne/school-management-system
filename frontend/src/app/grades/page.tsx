"use client";

import React, { useEffect, useState } from "react";
import SidebarLayout from "../../components/SidebarLayout";
import { api } from "../../services/api";

interface ClassSection {
  id: string;
  name: string;
  gradeLevel: number;
  classSubjects?: Array<{
    id: string;
    subject: { id: string; name: string; code: string };
    teacher: { firstName: string; lastName: string };
  }>;
}

interface Student {
  id: string;
  admissionNumber: string;
  firstName: string;
  middleName: string;
  lastName: string;
  classId: string;
}

interface Exam {
  id: string;
  name: string;
  weight: number;
  date: string;
  classSubjectId: string;
}

interface GradeRecord {
  id: string;
  marksObtained: number;
  remarks?: string;
  exam: { name: string; weight: number };
  examId: string;
  studentId: string;
}

export default function GradesPage() {
  const [classes, setClasses] = useState<ClassSection[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState<"enter" | "exam" | "report">("enter");
  const [alert, setAlert] = useState<{ type: "success" | "error"; msg: string } | null>(null);

  // Selector states
  const [selectedClassId, setSelectedClassId] = useState("");
  const [selectedClassSubjectId, setSelectedClassSubjectId] = useState("");
  const [exams, setExams] = useState<Exam[]>([]);
  const [selectedExamId, setSelectedExamId] = useState("");

  // Grade Entry State
  const [gradesForm, setGradesForm] = useState<Record<string, { marks: string; remarks: string }>>({});

  // Exam Creation State
  const [examForm, setExamForm] = useState({
    name: "Mid-Term Exam",
    weight: "30",
    date: new Date().toISOString().split("T")[0],
  });

  // Report Card State
  const [selectedStudentId, setSelectedStudentId] = useState("");
  const [studentGrades, setStudentGrades] = useState<any[]>([]);
  const [reportLoading, setReportLoading] = useState(false);

  useEffect(() => {
    loadClassesAndStudents();
  }, []);

  useEffect(() => {
    // When selected class changes, select the first subject mapped to it
    const activeClass = classes.find((c) => c.id === selectedClassId);
    if (activeClass && activeClass.classSubjects && activeClass.classSubjects.length > 0) {
      setSelectedClassSubjectId(activeClass.classSubjects[0].id);
    } else {
      setSelectedClassSubjectId("");
    }
  }, [selectedClassId, classes]);

  useEffect(() => {
    if (selectedClassSubjectId) {
      loadExams();
    } else {
      setExams([]);
      setSelectedExamId("");
    }
  }, [selectedClassSubjectId]);

  useEffect(() => {
    if (selectedClassId) {
      const classStudents = students.filter((s) => s.classId === selectedClassId);
      const initialFormState: Record<string, { marks: string; remarks: string }> = {};
      classStudents.forEach((s) => {
        initialFormState[s.id] = { marks: "", remarks: "" };
      });
      setGradesForm(initialFormState);
    }
  }, [selectedClassId, selectedExamId, students]);

  async function loadClassesAndStudents() {
    setLoading(true);
    try {
      const [clsData, stdData] = await Promise.all([
        api.getClasses(),
        api.getStudents(),
      ]);
      setClasses(clsData);
      setStudents(stdData);
      if (clsData.length > 0) {
        setSelectedClassId(clsData[0].id);
      }
    } catch (e: any) {
      setAlert({ type: "error", msg: e.message || "Failed to load academic records." });
    } finally {
      setLoading(false);
    }
  }

  async function loadExams() {
    try {
      const list = await api.getClassSubjectExams(selectedClassSubjectId);
      setExams(list);
      if (list.length > 0) {
        setSelectedExamId(list[0].id);
      } else {
        setSelectedExamId("");
      }
    } catch (_) {
      setExams([]);
      setSelectedExamId("");
    }
  }

  const handleCreateExam = async (e: React.FormEvent) => {
    e.preventDefault();
    setAlert(null);
    if (!selectedClassSubjectId) {
      setAlert({ type: "error", msg: "Please select a Class and Subject mapping first." });
      return;
    }
    setSaving(true);
    try {
      await api.createExam({
        classSubjectId: selectedClassSubjectId,
        name: examForm.name,
        weight: Number(examForm.weight) || 30,
        date: examForm.date,
      });
      setAlert({ type: "success", msg: `Exam "${examForm.name}" successfully created!` });
      await loadExams();
      setActiveTab("enter");
    } catch (e: any) {
      setAlert({ type: "error", msg: e.message || "Failed to create exam record." });
    } finally {
      setSaving(false);
    }
  };

  const handleSaveGrades = async () => {
    if (!selectedExamId) return;
    setSaving(true);
    setAlert(null);

    const classStudents = students.filter((s) => s.classId === selectedClassId);
    let successCount = 0;
    let failCount = 0;

    try {
      for (const student of classStudents) {
        const data = gradesForm[student.id];
        if (data && data.marks !== "") {
          try {
            await api.recordGrade({
              examId: selectedExamId,
              studentId: student.id,
              marksObtained: Number(data.marks),
              remarks: data.remarks || undefined,
            });
            successCount++;
          } catch (_) {
            failCount++;
          }
        }
      }
      if (failCount === 0) {
        setAlert({ type: "success", msg: `Grades recorded successfully for ${successCount} students!` });
      } else {
        setAlert({ type: "error", msg: `Grades recorded for ${successCount} students. Failed for ${failCount} records.` });
      }
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (e: any) {
      setAlert({ type: "error", msg: e.message || "Failed to save grades sheet." });
    } finally {
      setSaving(false);
    }
  };

  // Load selected student report card
  const loadReportCard = async (studentId: string) => {
    setSelectedStudentId(studentId);
    if (!studentId) {
      setStudentGrades([]);
      return;
    }
    setReportLoading(true);
    setAlert(null);
    try {
      const data = await api.getStudentGrades(studentId);
      setStudentGrades(data);
    } catch (e: any) {
      setAlert({ type: "error", msg: e.message || "Failed to load report card." });
      setStudentGrades([]);
    } finally {
      setReportLoading(false);
    }
  };

  const activeClass = classes.find((c) => c.id === selectedClassId);
  const activeClassSubjects = activeClass?.classSubjects || [];
  const classStudents = students.filter((s) => s.classId === selectedClassId);

  return (
    <SidebarLayout activeId="grades">
      <div className="page animate-fade-in" style={{ padding: "28px" }}>
        {/* Breadcrumbs */}
        <div style={{ marginBottom: "24px" }}>
          <div style={{ fontSize: "18px", fontWeight: "bold", color: "#111111" }}>Exams & Grades Board</div>
          <div style={{ fontSize: "12.5px", color: "#888888", marginTop: "4px" }}>
            Home - <span style={{ color: "var(--color-primary)" }}>Continuous Assessment</span>
          </div>
        </div>

        {/* Tab Selection */}
        <div className="chip-tabs mb-4" style={{ display: "flex", gap: "10px", borderBottom: "1px solid #e0e0e0", paddingBottom: "10px" }}>
          <button
            className={`chip ${activeTab === "enter" ? "active" : ""}`}
            onClick={() => { setActiveTab("enter"); setAlert(null); }}
            style={{
              padding: "8px 16px",
              borderRadius: "4px",
              background: activeTab === "enter" ? "var(--color-secondary)" : "#e0e0e0",
              color: activeTab === "enter" ? "#ffffff" : "#333333",
              fontWeight: "600",
              fontSize: "13px"
            }}
          >
            📊 Record Marks
          </button>
          <button
            className={`chip ${activeTab === "exam" ? "active" : ""}`}
            onClick={() => { setActiveTab("exam"); setAlert(null); }}
            style={{
              padding: "8px 16px",
              borderRadius: "4px",
              background: activeTab === "exam" ? "var(--color-secondary)" : "#e0e0e0",
              color: activeTab === "exam" ? "#ffffff" : "#333333",
              fontWeight: "600",
              fontSize: "13px"
            }}
          >
            📝 Add Assessment/Exam
          </button>
          <button
            className={`chip ${activeTab === "report" ? "active" : ""}`}
            onClick={() => { setActiveTab("report"); setAlert(null); }}
            style={{
              padding: "8px 16px",
              borderRadius: "4px",
              background: activeTab === "report" ? "var(--color-secondary)" : "#e0e0e0",
              color: activeTab === "report" ? "#ffffff" : "#333333",
              fontWeight: "600",
              fontSize: "13px"
            }}
          >
            📋 Student Report Card
          </button>
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

        {/* ENTER GRADES TAB */}
        {activeTab === "enter" && (
          <div className="flex-col gap-4">
            {/* Filter toolbar */}
            <div className="card" style={{ padding: "20px" }}>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "20px" }}>
                <div className="form-group">
                  <label className="form-label">Select Class</label>
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
                  <label className="form-label">Subject</label>
                  <select
                    className="form-select"
                    value={selectedClassSubjectId}
                    onChange={(e) => setSelectedClassSubjectId(e.target.value)}
                    style={{ background: "#f8f9fa", border: "1px solid #e0e0e0" }}
                    disabled={activeClassSubjects.length === 0}
                  >
                    <option value="">— Select Subject —</option>
                    {activeClassSubjects.map((cs) => (
                      <option key={cs.id} value={cs.id}>
                        {cs.subject.name} (Code: {cs.subject.code})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">Assessment / Exam</label>
                  <select
                    className="form-select"
                    value={selectedExamId}
                    onChange={(e) => setSelectedExamId(e.target.value)}
                    style={{ background: "#f8f9fa", border: "1px solid #e0e0e0" }}
                    disabled={exams.length === 0}
                  >
                    <option value="">— Select Assessment —</option>
                    {exams.map((ex) => (
                      <option key={ex.id} value={ex.id}>
                        {ex.name} (Max: {ex.weight}%)
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* Roster Entry Card */}
            {selectedExamId && (
              <div className="card">
                <div className="card-header" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <div>
                    <span className="card-title" style={{ fontSize: "16px", fontWeight: "bold" }}>Marks Sheet Register</span>
                    <div style={{ fontSize: "12px", color: "#666" }}>
                      Assessment: {exams.find((e) => e.id === selectedExamId)?.name} (Weight: {exams.find((e) => e.id === selectedExamId)?.weight}%)
                    </div>
                  </div>
                </div>

                <div className="card-body" style={{ padding: "0" }}>
                  <div className="table-wrap">
                    {loading ? (
                      <div style={{ padding: "40px", textAlign: "center" }}>
                        <div className="spinner" style={{ margin: "0 auto 12px" }} />
                        <div>Loading rosters...</div>
                      </div>
                    ) : classStudents.length === 0 ? (
                      <div className="empty-state" style={{ padding: "40px", textAlign: "center" }}>
                        <div>No Students</div>
                      </div>
                    ) : (
                      <table>
                        <thead>
                          <tr>
                            <th>Admission No.</th>
                            <th>Student Name</th>
                            <th style={{ width: "150px" }}>Marks Obtained</th>
                            <th>Teacher remarks</th>
                          </tr>
                        </thead>
                        <tbody>
                          {classStudents.map((s) => (
                            <tr key={s.id}>
                              <td><span className="badge badge-blue">{s.admissionNumber}</span></td>
                              <td className="td-name">{s.firstName} {s.middleName} {s.lastName}</td>
                              <td>
                                <input
                                  type="number"
                                  className="form-input"
                                  placeholder="0.00"
                                  value={gradesForm[s.id]?.marks || ""}
                                  max={exams.find((e) => e.id === selectedExamId)?.weight || 100}
                                  min={0}
                                  onChange={(e) => setGradesForm({
                                    ...gradesForm,
                                    [s.id]: { ...(gradesForm[s.id] || { remarks: "" }), marks: e.target.value }
                                  })}
                                  style={{ background: "#f8f9fa", padding: "6px 10px" }}
                                />
                              </td>
                              <td>
                                <input
                                  type="text"
                                  className="form-input"
                                  placeholder="remarks (optional)"
                                  value={gradesForm[s.id]?.remarks || ""}
                                  onChange={(e) => setGradesForm({
                                    ...gradesForm,
                                    [s.id]: { ...(gradesForm[s.id] || { marks: "" }), remarks: e.target.value }
                                  })}
                                  style={{ background: "#f8f9fa", padding: "6px 10px" }}
                                />
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    )}
                  </div>
                </div>

                <div className="card-footer" style={{ display: "flex", justifyContent: "flex-end" }}>
                  <button
                    type="button"
                    className="btn btn-primary"
                    onClick={handleSaveGrades}
                    disabled={saving || classStudents.length === 0}
                    style={{ background: "#ffae01", color: "#111111", fontWeight: "bold" }}
                  >
                    {saving ? "Saving Grades..." : "Lock and Submit Grades"}
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* CREATE ASSESSMENT TAB */}
        {activeTab === "exam" && (
          <div className="card">
            <div className="card-header">
              <span className="card-title" style={{ fontSize: "16px", fontWeight: "bold" }}>New Assessment Setup</span>
            </div>
            <div className="card-body" style={{ padding: "28px" }}>
              <form onSubmit={handleCreateExam}>
                <div style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
                  gap: "20px",
                  marginBottom: "24px"
                }}>
                  <div className="form-group">
                    <label className="form-label">Select Class Section</label>
                    <select
                      className="form-select"
                      value={selectedClassId}
                      onChange={(e) => setSelectedClassId(e.target.value)}
                      style={{ background: "#f8f9fa", border: "1px solid #e0e0e0" }}
                      required
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
                    <label className="form-label">Subject</label>
                    <select
                      className="form-select"
                      value={selectedClassSubjectId}
                      onChange={(e) => setSelectedClassSubjectId(e.target.value)}
                      style={{ background: "#f8f9fa", border: "1px solid #e0e0e0" }}
                      disabled={activeClassSubjects.length === 0}
                      required
                    >
                      <option value="">— Select Subject —</option>
                      {activeClassSubjects.map((cs) => (
                        <option key={cs.id} value={cs.id}>
                          {cs.subject.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="form-group">
                    <label className="form-label">Assessment Title <span className="form-required">*</span></label>
                    <input
                      type="text"
                      className="form-input"
                      value={examForm.name}
                      onChange={(e) => setExamForm({ ...examForm, name: e.target.value })}
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Max Score / Weight (%) <span className="form-required">*</span></label>
                    <input
                      type="number"
                      className="form-input"
                      value={examForm.weight}
                      onChange={(e) => setExamForm({ ...examForm, weight: e.target.value })}
                      max={100}
                      min={1}
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Date of Assessment <span className="form-required">*</span></label>
                    <input
                      type="date"
                      className="form-input"
                      value={examForm.date}
                      onChange={(e) => setExamForm({ ...examForm, date: e.target.value })}
                      required
                    />
                  </div>
                </div>

                <div style={{ display: "flex", gap: "10px" }}>
                  <button
                    type="submit"
                    className="btn btn-primary"
                    disabled={saving}
                    style={{ background: "#ffae01", color: "#111", fontWeight: "bold" }}
                  >
                    {saving ? "Creating..." : "Create Assessment"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* STUDENT REPORT CARD TAB */}
        {activeTab === "report" && (
          <div className="flex-col gap-4">
            <div className="card" style={{ padding: "20px" }}>
              <div className="form-group" style={{ maxWidth: "360px" }}>
                <label className="form-label">Select Student Profile</label>
                <select
                  className="form-select"
                  value={selectedStudentId}
                  onChange={(e) => loadReportCard(e.target.value)}
                  style={{ background: "#f8f9fa", border: "1px solid #e0e0e0" }}
                >
                  <option value="">— Select Student —</option>
                  {students.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.firstName} {s.middleName} {s.lastName} ({s.admissionNumber})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {selectedStudentId && (
              <div className="card" style={{ background: "#ffffff" }}>
                <div className="card-header text-center" style={{ borderBottom: "2px dashed #e0e0e0", padding: "24px 20px" }}>
                  <div style={{ fontSize: "20px", fontWeight: "bold", color: "var(--color-secondary)" }}>
                     Wegde School Management System
                  </div>
                  <div style={{ fontSize: "14px", color: "#666", marginTop: "4px" }}>
                    Student Progress Report Card (Semester 1)
                  </div>
                </div>

                <div className="card-body" style={{ padding: "24px" }}>
                  {reportLoading ? (
                    <div style={{ textAlign: "center", padding: "20px" }}>
                      <div className="spinner" style={{ margin: "0 auto 10px" }} />
                      <div>Compiling continuous assessment logs...</div>
                    </div>
                  ) : studentGrades.length === 0 ? (
                    <div style={{ textAlign: "center", padding: "20px", color: "#777" }}>
                      No grades recorded yet for this student.
                    </div>
                  ) : (
                    <div>
                      <table>
                        <thead>
                          <tr>
                            <th>Assessment Name</th>
                            <th>Max Mark/Weight</th>
                            <th>Obtained Marks</th>
                            <th>Score Percentage</th>
                            <th>Teacher remarks</th>
                          </tr>
                        </thead>
                        <tbody>
                          {studentGrades.map((g: GradeRecord) => {
                            const pct = ((g.marksObtained / g.exam.weight) * 100).toFixed(1);
                            return (
                              <tr key={g.id}>
                                <td>{g.exam.name}</td>
                                <td>{g.exam.weight} marks</td>
                                <td style={{ fontWeight: "bold", color: "var(--color-secondary)" }}>{g.marksObtained}</td>
                                <td>
                                  <span className={`badge ${Number(pct) >= 80 ? "badge-green" : Number(pct) >= 50 ? "badge-blue" : "badge-red"}`}>
                                    {pct}%
                                  </span>
                                </td>
                                <td>{g.remarks || "—"}</td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>

                      <div style={{
                        marginTop: "24px",
                        padding: "16px",
                        background: "#f8f9fa",
                        borderRadius: "4px",
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center"
                      }}>
                        <span style={{ fontWeight: "bold" }}>Total Accumulated Assessment Score</span>
                        <span style={{ fontSize: "18px", fontWeight: "bold", color: "var(--color-secondary)" }}>
                          {studentGrades.reduce((sum, current) => sum + current.marksObtained, 0)} Marks / {studentGrades.reduce((sum, current) => sum + current.exam.weight, 0)} Weight
                        </span>
                      </div>
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
