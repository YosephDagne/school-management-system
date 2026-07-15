"use client";

import React, { useEffect, useState } from "react";
import SidebarLayout from "../../components/SidebarLayout";
import { api } from "../../services/api";

interface Teacher {
  id: string;
  employeeId: string;
  firstName: string;
  middleName: string;
  lastName: string;
  phoneNumber: string;
  email: string;
}

interface Subject {
  id: string;
  name: string;
  code: string;
  gradeLevel: number;
}

interface ClassSubjectMapped {
  id: string;
  subject: { name: string; code: string };
  teacher: { firstName: string; lastName: string };
}

interface ClassSection {
  id: string;
  name: string;
  gradeLevel: number;
  academicYear: string;
  homeroomTeacher?: Teacher;
  classSubjects?: ClassSubjectMapped[];
}

export default function ClassesPage() {
  const [classes, setClasses] = useState<ClassSection[]>([]);
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"list" | "add">("list");
  const [alert, setAlert] = useState<{ type: "success" | "error"; msg: string } | null>(null);

  // Form State
  const [form, setForm] = useState({
    teacherId: "",
    classCode: "",
    gender: "Mixed",
    gradeLevel: "9",
    subjectId: "",
    sectionName: "A",
    timeSlot: "",
    dateVal: "",
    phone: "",
    email: "",
  });

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    setLoading(true);
    try {
      const [clsData, tData, sData] = await Promise.all([
        api.getClasses(),
        api.getTeachers(),
        api.getSubjects(),
      ]);
      setClasses(clsData);
      setTeachers(tData);
      setSubjects(sData);
    } catch (e: any) {
      setAlert({ type: "error", msg: e.message || "Failed to load database registries." });
    } finally {
      setLoading(false);
    }
  }

  // Auto-populate email and phone when teacher is selected
  const handleTeacherChange = (teacherId: string) => {
    const selected = teachers.find((t) => t.id === teacherId);
    setForm((f) => ({
      ...f,
      teacherId,
      phone: selected ? selected.phoneNumber : "",
      email: selected ? selected.email : "",
    }));
  };

  const handleReset = () => {
    setForm({
      teacherId: "",
      classCode: "",
      gender: "Mixed",
      gradeLevel: "9",
      subjectId: "",
      sectionName: "A",
      timeSlot: "",
      dateVal: "",
      phone: "",
      email: "",
    });
    setAlert(null);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setAlert(null);
    setLoading(true);

    if (!form.gradeLevel || !form.sectionName) {
      setAlert({ type: "error", msg: "Class Grade and Section are required." });
      setLoading(false);
      return;
    }

    const className = `Grade ${form.gradeLevel}${form.sectionName}`;

    try {
      // 1. Create Class section
      const classRes = await api.createClass({
        name: className,
        gradeLevel: Number(form.gradeLevel),
        academicYear: "2026-2027",
        homeroomTeacherId: form.teacherId || undefined,
      });

      // 2. Map Subject to Class if selected
      if (form.subjectId && form.teacherId) {
        await api.assignClassSubject({
          classId: classRes.id,
          subjectId: form.subjectId,
          teacherId: form.teacherId,
        });
      }

      setAlert({ type: "success", msg: `Class section "${className}" successfully created and saved!` });
      handleReset();
      await loadData();
      setActiveTab("list");
    } catch (e: any) {
      setAlert({ type: "error", msg: e.message || "Failed to create class section." });
    } finally {
      setLoading(false);
    }
  };

  return (
    <SidebarLayout activeId="classes">
      <div className="page animate-fade-in" style={{ padding: "28px" }}>
        {/* Breadcrumb section */}
        <div style={{ marginBottom: "24px" }}>
          <div style={{ fontSize: "18px", fontWeight: "bold", color: "#111111" }}>Classes Dashboard</div>
          <div style={{ fontSize: "12.5px", color: "#888888", marginTop: "4px" }}>
            Home - <span style={{ color: "var(--color-primary)" }}>{activeTab === "list" ? "All Class" : "Add New Class"}</span>
          </div>
        </div>

        {/* Tab Selection */}
        <div className="chip-tabs mb-4" style={{ display: "flex", gap: "10px", borderBottom: "1px solid #e0e0e0", paddingBottom: "10px" }}>
          <button
            className={`chip ${activeTab === "list" ? "active" : ""}`}
            onClick={() => { setActiveTab("list"); setAlert(null); }}
            style={{
              padding: "8px 16px",
              borderRadius: "4px",
              background: activeTab === "list" ? "var(--color-secondary)" : "#e0e0e0",
              color: activeTab === "list" ? "#ffffff" : "#333333",
              fontWeight: "600",
              fontSize: "13px"
            }}
          >
            🏛️ All Class
          </button>
          <button
            className={`chip ${activeTab === "add" ? "active" : ""}`}
            onClick={() => { setActiveTab("add"); setAlert(null); }}
            style={{
              padding: "8px 16px",
              borderRadius: "4px",
              background: activeTab === "add" ? "var(--color-secondary)" : "#e0e0e0",
              color: activeTab === "add" ? "#ffffff" : "#333333",
              fontWeight: "600",
              fontSize: "13px"
            }}
          >
            ➕ Add New Class
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

        {/* ALL CLASSES LIST TAB */}
        {activeTab === "list" && (
          <div className="card">
            <div className="card-header" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span className="card-title" style={{ fontSize: "16px", fontWeight: "bold" }}>Class Section Listings</span>
              <button className="btn btn-xs" onClick={loadData} disabled={loading} style={{ background: "#f0f1f3", color: "#333" }}>
                {loading ? "Refreshing..." : "🔄 Reload"}
              </button>
            </div>
            <div className="card-body" style={{ padding: "0" }}>
              <div className="table-wrap">
                {classes.length === 0 ? (
                  <div className="empty-state" style={{ padding: "40px", textAlign: "center" }}>
                    <div style={{ fontSize: "48px" }}>🏛️</div>
                    <div style={{ fontWeight: "bold", fontSize: "16px", marginTop: "12px" }}>No Classes Found</div>
                    <div style={{ color: "#777", fontSize: "13px" }}>Create standard class sections by clicking the Add New Class tab.</div>
                  </div>
                ) : (
                  <table>
                    <thead>
                      <tr>
                        <th>Class Section</th>
                        <th>Grade Level</th>
                        <th>Academic Year</th>
                        <th>Homeroom Teacher</th>
                        <th>Mapped Subjects & Teachers</th>
                      </tr>
                    </thead>
                    <tbody>
                      {classes.map((cls) => (
                        <tr key={cls.id}>
                          <td><span className="badge badge-blue" style={{ fontSize: "12px", fontWeight: "bold" }}>{cls.name}</span></td>
                          <td>Grade {cls.gradeLevel}</td>
                          <td>{cls.academicYear}</td>
                          <td>
                            {cls.homeroomTeacher
                              ? `👨‍🏫 ${cls.homeroomTeacher.firstName} ${cls.homeroomTeacher.lastName}`
                              : <span className="text-muted" style={{ fontStyle: "italic" }}>Not Assigned</span>
                            }
                          </td>
                          <td>
                            {cls.classSubjects && cls.classSubjects.length > 0 ? (
                              <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                                {cls.classSubjects.map((cs) => (
                                  <div key={cs.id} style={{ fontSize: "12px", background: "#f0f1f3", padding: "4px 8px", borderRadius: "4px", display: "inline-block" }}>
                                    <strong>{cs.subject?.name || "Subject"}</strong> ({cs.teacher ? `${cs.teacher.firstName} ${cs.teacher.lastName.slice(0, 1)}.` : "No Teacher"})
                                  </div>
                                ))}
                              </div>
                            ) : (
                              <span className="text-muted" style={{ fontStyle: "italic", fontSize: "12px" }}>No mapped subjects</span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ADD NEW CLASS FORM TAB (MATCHING SCREENSHOT) */}
        {activeTab === "add" && (
          <div className="card">
            {/* Form Box Header */}
            <div className="card-header" style={{
              background: "#ffffff",
              padding: "16px 24px",
              borderBottom: "1px solid #f0f1f3",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center"
            }}>
              <span className="card-title" style={{ fontSize: "16px", fontWeight: "bold", color: "#111111" }}>Class Information</span>
              <div style={{ display: "flex", gap: "8px" }}>
                <span style={{ color: "#ffae01", cursor: "pointer", fontSize: "14px" }}>▼</span>
                <span style={{ color: "#22c55e", cursor: "pointer", fontSize: "14px" }} onClick={loadData}>🔄</span>
                <span style={{ color: "#ef4444", cursor: "pointer", fontSize: "14px" }} onClick={handleReset}>✕</span>
              </div>
            </div>

            {/* Akkhor Form Layout */}
            <div className="card-body" style={{ padding: "28px" }}>
              <form onSubmit={handleSave}>
                <div style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
                  gap: "20px",
                  marginBottom: "24px"
                }}>
                  {/* Teacher Name */}
                  <div className="form-group">
                    <label className="form-label" style={{ color: "#333333", fontSize: "13px" }}>Teacher Name</label>
                    <select
                      className="form-select"
                      value={form.teacherId}
                      onChange={(e) => handleTeacherChange(e.target.value)}
                      style={{ background: "#f8f9fa", border: "1px solid #e0e0e0" }}
                    >
                      <option value="">— Select Teacher —</option>
                      {teachers.map((t) => (
                        <option key={t.id} value={t.id}>
                          {t.firstName} {t.middleName} {t.lastName}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* ID Field */}
                  <div className="form-group">
                    <label className="form-label" style={{ color: "#333333", fontSize: "13px" }}>ID</label>
                    <input
                      type="text"
                      className="form-input"
                      placeholder="e.g. SEC-101"
                      value={form.classCode}
                      onChange={(e) => setForm({ ...form, classCode: e.target.value })}
                      style={{ background: "#f8f9fa", border: "1px solid #e0e0e0" }}
                    />
                  </div>

                  {/* Gender Select */}
                  <div className="form-group">
                    <label className="form-label" style={{ color: "#333333", fontSize: "13px" }}>Gender</label>
                    <select
                      className="form-select"
                      value={form.gender}
                      onChange={(e) => setForm({ ...form, gender: e.target.value })}
                      style={{ background: "#f8f9fa", border: "1px solid #e0e0e0" }}
                    >
                      <option value="Mixed">Mixed</option>
                      <option value="Male">Male Only</option>
                      <option value="Female">Female Only</option>
                    </select>
                  </div>

                  {/* Class Level */}
                  <div className="form-group">
                    <label className="form-label" style={{ color: "#333333", fontSize: "13px" }}>Class</label>
                    <select
                      className="form-select"
                      value={form.gradeLevel}
                      onChange={(e) => setForm({ ...form, gradeLevel: e.target.value })}
                      style={{ background: "#f8f9fa", border: "1px solid #e0e0e0" }}
                    >
                      <option value="9">Grade 9</option>
                      <option value="10">Grade 10</option>
                      <option value="11">Grade 11</option>
                      <option value="12">Grade 12</option>
                    </select>
                  </div>

                  {/* Subject */}
                  <div className="form-group">
                    <label className="form-label" style={{ color: "#333333", fontSize: "13px" }}>Subject</label>
                    <select
                      className="form-select"
                      value={form.subjectId}
                      onChange={(e) => setForm({ ...form, subjectId: e.target.value })}
                      style={{ background: "#f8f9fa", border: "1px solid #e0e0e0" }}
                    >
                      <option value="">— Select Subject —</option>
                      {subjects.filter((s) => s.gradeLevel === Number(form.gradeLevel)).map((s) => (
                        <option key={s.id} value={s.id}>
                          {s.name} ({s.code})
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Section */}
                  <div className="form-group">
                    <label className="form-label" style={{ color: "#333333", fontSize: "13px" }}>Section</label>
                    <select
                      className="form-select"
                      value={form.sectionName}
                      onChange={(e) => setForm({ ...form, sectionName: e.target.value })}
                      style={{ background: "#f8f9fa", border: "1px solid #e0e0e0" }}
                    >
                      <option value="A">Section A</option>
                      <option value="B">Section B</option>
                      <option value="C">Section C</option>
                      <option value="D">Section D</option>
                    </select>
                  </div>

                  {/* Time */}
                  <div className="form-group">
                    <label className="form-label" style={{ color: "#333333", fontSize: "13px" }}>Time</label>
                    <input
                      type="text"
                      className="form-input"
                      placeholder="e.g. 08:30 AM"
                      value={form.timeSlot}
                      onChange={(e) => setForm({ ...form, timeSlot: e.target.value })}
                      style={{ background: "#f8f9fa", border: "1px solid #e0e0e0" }}
                    />
                  </div>

                  {/* Date */}
                  <div className="form-group">
                    <label className="form-label" style={{ color: "#333333", fontSize: "13px" }}>Date</label>
                    <input
                      type="date"
                      className="form-input"
                      value={form.dateVal}
                      onChange={(e) => setForm({ ...form, dateVal: e.target.value })}
                      style={{ background: "#f8f9fa", border: "1px solid #e0e0e0" }}
                    />
                  </div>

                  {/* Phone */}
                  <div className="form-group">
                    <label className="form-label" style={{ color: "#333333", fontSize: "13px" }}>Phone</label>
                    <input
                      type="text"
                      className="form-input"
                      placeholder="Auto-filled from selected Teacher"
                      value={form.phone}
                      onChange={(e) => setForm({ ...form, phone: e.target.value })}
                      style={{ background: "#f8f9fa", border: "1px solid #e0e0e0" }}
                    />
                  </div>

                  {/* E-mail */}
                  <div className="form-group">
                    <label className="form-label" style={{ color: "#333333", fontSize: "13px" }}>E-mail</label>
                    <input
                      type="email"
                      className="form-input"
                      placeholder="Auto-filled from selected Teacher"
                      value={form.email}
                      onChange={(e) => setForm({ ...form, email: e.target.value })}
                      style={{ background: "#f8f9fa", border: "1px solid #e0e0e0" }}
                    />
                  </div>
                </div>

                {/* Form Buttons */}
                <div style={{ display: "flex", gap: "12px", marginTop: "24px" }}>
                  <button
                    type="submit"
                    className="btn btn-primary"
                    disabled={loading}
                    style={{
                      background: "#ffae01",
                      color: "#111111",
                      fontWeight: "bold",
                      padding: "10px 24px",
                      borderRadius: "4px"
                    }}
                  >
                    {loading ? "Saving..." : "Save"}
                  </button>
                  <button
                    type="button"
                    className="btn btn-outline"
                    onClick={handleReset}
                    style={{
                      background: "#042954",
                      color: "#ffffff",
                      border: "none",
                      padding: "10px 24px",
                      borderRadius: "4px"
                    }}
                  >
                    Reset
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </SidebarLayout>
  );
}
