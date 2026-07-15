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
  qualification: string;
  specialization: string;
  status: string;
}

export default function TeachersPage() {
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"list" | "add">("list");
  const [alert, setAlert] = useState<{ type: "success" | "error"; msg: string } | null>(null);

  // Form State
  const [form, setForm] = useState({
    username: "",
    email: "",
    employeeId: "",
    firstName: "",
    middleName: "",
    lastName: "",
    phoneNumber: "",
    qualification: "",
    specialization: "",
  });

  useEffect(() => {
    loadTeachers();
  }, []);

  async function loadTeachers() {
    setLoading(true);
    try {
      const data = await api.getTeachers();
      setTeachers(data);
    } catch (e: any) {
      setAlert({ type: "error", msg: e.message || "Failed to load teachers roster." });
    } finally {
      setLoading(false);
    }
  }

  const handleReset = () => {
    setForm({
      username: "",
      email: "",
      employeeId: "",
      firstName: "",
      middleName: "",
      lastName: "",
      phoneNumber: "",
      qualification: "",
      specialization: "",
    });
    setAlert(null);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setAlert(null);
    setLoading(true);

    if (!form.username || !form.employeeId || !form.firstName || !form.lastName || !form.phoneNumber) {
      setAlert({ type: "error", msg: "Please fill in all required fields marked with *." });
      setLoading(false);
      return;
    }

    try {
      await api.createTeacher(form);
      setAlert({ type: "success", msg: `Teacher record for "${form.firstName} ${form.lastName}" successfully registered!` });
      handleReset();
      await loadTeachers();
      setActiveTab("list");
    } catch (e: any) {
      setAlert({ type: "error", msg: e.message || "Failed to register teacher record." });
    } finally {
      setLoading(false);
    }
  };

  return (
    <SidebarLayout activeId="teachers">
      <div className="page animate-fade-in" style={{ padding: "28px" }}>
        {/* Breadcrumbs */}
        <div style={{ marginBottom: "24px" }}>
          <div style={{ fontSize: "18px", fontWeight: "bold", color: "#111111" }}>Teachers Management</div>
          <div style={{ fontSize: "12.5px", color: "#888888", marginTop: "4px" }}>
            Home - <span style={{ color: "var(--color-primary)" }}>{activeTab === "list" ? "All Teacher" : "Add Teacher"}</span>
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
            👨‍🏫 All Teacher
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
            ➕ Add Teacher
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
              <span className="card-title" style={{ fontSize: "16px", fontWeight: "bold" }}>Teachers Roster</span>
              <button className="btn btn-xs" onClick={loadTeachers} disabled={loading} style={{ background: "#f0f1f3", color: "#333" }}>
                {loading ? "Refreshing..." : "🔄 Reload"}
              </button>
            </div>
            <div className="card-body" style={{ padding: "0" }}>
              <div className="table-wrap">
                {teachers.length === 0 ? (
                  <div className="empty-state" style={{ padding: "40px", textAlign: "center" }}>
                    <div style={{ fontSize: "48px" }}>👨‍🏫</div>
                    <div style={{ fontWeight: "bold", fontSize: "16px", marginTop: "12px" }}>No Teachers Found</div>
                    <div style={{ color: "#777", fontSize: "13px" }}>Start adding teacher records using the Add Teacher tab.</div>
                  </div>
                ) : (
                  <table>
                    <thead>
                      <tr>
                        <th>Employee ID</th>
                        <th>Full Name</th>
                        <th>Specialization</th>
                        <th>Qualification</th>
                        <th>Phone Number</th>
                        <th>Email</th>
                        <th>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {teachers.map((t) => (
                        <tr key={t.id}>
                          <td><span className="badge badge-blue">{t.employeeId}</span></td>
                          <td className="td-name">{t.firstName} {t.middleName} {t.lastName}</td>
                          <td>{t.specialization || "General"}</td>
                          <td>{t.qualification || "B.Sc/B.A"}</td>
                          <td>{t.phoneNumber}</td>
                          <td>{t.email || "—"}</td>
                          <td><span className="badge badge-green">{t.status}</span></td>
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
              <span className="card-title" style={{ fontSize: "16px", fontWeight: "bold" }}>Teacher Profile Information</span>
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
                    <label className="form-label">First Name <span className="form-required">*</span></label>
                    <input
                      type="text"
                      className="form-input"
                      placeholder="e.g. Abraham"
                      value={form.firstName}
                      onChange={(e) => setForm({ ...form, firstName: e.target.value })}
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Middle Name <span className="form-required">*</span></label>
                    <input
                      type="text"
                      className="form-input"
                      placeholder="e.g. Alula"
                      value={form.middleName}
                      onChange={(e) => setForm({ ...form, middleName: e.target.value })}
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Last Name <span className="form-required">*</span></label>
                    <input
                      type="text"
                      className="form-input"
                      placeholder="e.g. Tekle"
                      value={form.lastName}
                      onChange={(e) => setForm({ ...form, lastName: e.target.value })}
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Employee ID <span className="form-required">*</span></label>
                    <input
                      type="text"
                      className="form-input"
                      placeholder="e.g. EMP1024"
                      value={form.employeeId}
                      onChange={(e) => setForm({ ...form, employeeId: e.target.value })}
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Phone Number <span className="form-required">*</span></label>
                    <input
                      type="text"
                      className="form-input"
                      placeholder="e.g. +251911223344"
                      value={form.phoneNumber}
                      onChange={(e) => setForm({ ...form, phoneNumber: e.target.value })}
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Qualification</label>
                    <input
                      type="text"
                      className="form-input"
                      placeholder="e.g. M.Sc in Mathematics"
                      value={form.qualification}
                      onChange={(e) => setForm({ ...form, qualification: e.target.value })}
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Specialization</label>
                    <input
                      type="text"
                      className="form-input"
                      placeholder="e.g. Calculus & Algebra"
                      value={form.specialization}
                      onChange={(e) => setForm({ ...form, specialization: e.target.value })}
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Account Username <span className="form-required">*</span></label>
                    <input
                      type="text"
                      className="form-input"
                      placeholder="e.g. abraham_t"
                      value={form.username}
                      onChange={(e) => setForm({ ...form, username: e.target.value })}
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Email Address</label>
                    <input
                      type="email"
                      className="form-input"
                      placeholder="e.g. abraham@wegde.edu"
                      value={form.email}
                      onChange={(e) => setForm({ ...form, email: e.target.value })}
                    />
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
