"use client";

import React, { useEffect, useState } from "react";
import SidebarLayout from "../../components/SidebarLayout";
import { api } from "../../services/api";

interface Subject {
  id: string;
  name: string;
  code: string;
  gradeLevel: number;
  stream: string;
  createdAt: string;
}

export default function SubjectsPage() {
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"list" | "add">("list");
  const [alert, setAlert] = useState<{ type: "success" | "error"; msg: string } | null>(null);

  // Form State
  const [form, setForm] = useState({
    name: "",
    code: "",
    gradeLevel: 9,
    stream: "General",
  });

  useEffect(() => {
    loadSubjects();
  }, []);

  async function loadSubjects() {
    setLoading(true);
    try {
      const data = await api.getSubjects();
      setSubjects(data);
    } catch (e: any) {
      setAlert({ type: "error", msg: e.message || "Failed to load subjects." });
    } finally {
      setLoading(false);
    }
  }

  const handleReset = () => {
    setForm({
      name: "",
      code: "",
      gradeLevel: 9,
      stream: "General",
    });
    setAlert(null);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setAlert(null);
    setLoading(true);

    if (!form.name || !form.code || !form.gradeLevel) {
      setAlert({ type: "error", msg: "Please fill in all required fields marked with *." });
      setLoading(false);
      return;
    }

    try {
      await api.createSubject(form);
      setAlert({ type: "success", msg: `Subject "${form.name}" successfully created!` });
      handleReset();
      await loadSubjects();
      setActiveTab("list");
    } catch (e: any) {
      setAlert({ type: "error", msg: e.message || "Failed to create subject record." });
    } finally {
      setLoading(false);
    }
  };

  return (
    <SidebarLayout activeId="subjects">
      <div className="page animate-fade-in" style={{ padding: "28px" }}>
        {/* Breadcrumbs */}
        <div style={{ marginBottom: "24px" }}>
          <div style={{ fontSize: "18px", fontWeight: "bold", color: "#111111" }}>Subjects Catalog</div>
          <div style={{ fontSize: "12.5px", color: "#888888", marginTop: "4px" }}>
            Home - <span style={{ color: "var(--color-primary)" }}>{activeTab === "list" ? "All Subjects" : "Add Subject"}</span>
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
            📖 All Subjects
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
            ➕ Add Subject
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

        {/* LIST VIEW TAB */}
        {activeTab === "list" && (
          <div className="card">
            <div className="card-header" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span className="card-title" style={{ fontSize: "16px", fontWeight: "bold" }}>Academic Subjects</span>
              <button className="btn btn-xs" onClick={loadSubjects} disabled={loading} style={{ background: "#f0f1f3", color: "#333" }}>
                {loading ? "Refreshing..." : "🔄 Reload"}
              </button>
            </div>
            <div className="card-body" style={{ padding: "0" }}>
              <div className="table-wrap">
                {subjects.length === 0 ? (
                  <div className="empty-state" style={{ padding: "40px", textAlign: "center" }}>
                    <div style={{ fontSize: "48px" }}>📖</div>
                    <div style={{ fontWeight: "bold", fontSize: "16px", marginTop: "12px" }}>No Subjects Configured</div>
                    <div style={{ color: "#777", fontSize: "13px" }}>Add academic subjects using the Add Subject tab.</div>
                  </div>
                ) : (
                  <table>
                    <thead>
                      <tr>
                        <th>Subject Name</th>
                        <th>Subject Code</th>
                        <th>Target Grade</th>
                        <th>Stream Classification</th>
                        <th>Created Date</th>
                      </tr>
                    </thead>
                    <tbody>
                      {subjects.map((s) => (
                        <tr key={s.id}>
                          <td className="td-name">📖 {s.name}</td>
                          <td><span className="badge badge-blue">{s.code}</span></td>
                          <td>Grade {s.gradeLevel}</td>
                          <td>
                            <span className={`badge ${s.stream === "NaturalScience" ? "badge-teal" : s.stream === "SocialScience" ? "badge-amber" : "badge-gray"}`}>
                              {s.stream === "NaturalScience" ? "Natural Science" : s.stream === "SocialScience" ? "Social Science" : "General"}
                            </span>
                          </td>
                          <td>{new Date(s.createdAt).toLocaleDateString()}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ADD VIEW TAB */}
        {activeTab === "add" && (
          <div className="card">
            <div className="card-header">
              <span className="card-title" style={{ fontSize: "16px", fontWeight: "bold" }}>Subject Structure Details</span>
            </div>
            <div className="card-body" style={{ padding: "28px" }}>
              <form onSubmit={handleSave}>
                <div style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
                  gap: "20px",
                  marginBottom: "24px"
                }}>
                  <div className="form-group">
                    <label className="form-label">Subject Name <span className="form-required">*</span></label>
                    <input
                      type="text"
                      className="form-input"
                      placeholder="e.g. Amharic Language"
                      value={form.name}
                      onChange={(e) => setForm({ ...form, name: e.target.value })}
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Subject Code <span className="form-required">*</span></label>
                    <input
                      type="text"
                      className="form-input"
                      placeholder="e.g. AMH9"
                      value={form.code}
                      onChange={(e) => setForm({ ...form, code: e.target.value })}
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Target Grade Level <span className="form-required">*</span></label>
                    <select
                      className="form-select"
                      value={form.gradeLevel}
                      onChange={(e) => setForm({ ...form, gradeLevel: Number(e.target.value) || 9 })}
                      required
                    >
                      <option value="9">Grade 9</option>
                      <option value="10">Grade 10</option>
                      <option value="11">Grade 11</option>
                      <option value="12">Grade 12</option>
                    </select>
                  </div>

                  <div className="form-group">
                    <label className="form-label">Stream Classification <span className="form-required">*</span></label>
                    <select
                      className="form-select"
                      value={form.stream}
                      onChange={(e) => setForm({ ...form, stream: e.target.value })}
                      required
                    >
                      <option value="General">General / All streams</option>
                      <option value="NaturalScience">Natural Science</option>
                      <option value="SocialScience">Social Science</option>
                    </select>
                  </div>
                </div>

                <div style={{ display: "flex", gap: "10px" }}>
                  <button
                    type="submit"
                    className="btn btn-primary"
                    disabled={loading}
                    style={{ background: "#ffae01", color: "#111", fontWeight: "bold" }}
                  >
                    {loading ? "Saving..." : "Save"}
                  </button>
                  <button
                    type="button"
                    className="btn btn-outline"
                    onClick={handleReset}
                    style={{ background: "#042954", color: "#fff", border: "none" }}
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
