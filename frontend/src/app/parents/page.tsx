"use client";

import React, { useEffect, useState } from "react";
import SidebarLayout from "../../components/SidebarLayout";
import { api } from "../../services/api";

interface Parent {
  id: string;
  fullName: string;
  phoneNumber: string;
  address: string;
  email?: string;
  createdAt: string;
}

export default function ParentsPage() {
  const [parents, setParents] = useState<Parent[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"list" | "add">("list");
  const [alert, setAlert] = useState<{ type: "success" | "error"; msg: string } | null>(null);

  // Form State
  const [form, setForm] = useState({
    username: "",
    fullName: "",
    phoneNumber: "",
    address: "",
    email: "",
  });

  useEffect(() => {
    loadParents();
  }, []);

  async function loadParents() {
    setLoading(true);
    try {
      const data = await api.getParents();
      setParents(data);
    } catch (e: any) {
      setAlert({ type: "error", msg: e.message || "Failed to load parents records." });
    } finally {
      setLoading(false);
    }
  }

  const handleReset = () => {
    setForm({
      username: "",
      fullName: "",
      phoneNumber: "",
      address: "",
      email: "",
    });
    setAlert(null);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setAlert(null);
    setLoading(true);

    if (!form.username || !form.fullName || !form.phoneNumber || !form.address) {
      setAlert({ type: "error", msg: "Please fill in all required fields marked with *." });
      setLoading(false);
      return;
    }

    try {
      await api.createParent(form);
      setAlert({ type: "success", msg: `Parent record for "${form.fullName}" successfully registered!` });
      handleReset();
      await loadParents();
      setActiveTab("list");
    } catch (e: any) {
      setAlert({ type: "error", msg: e.message || "Failed to register parent record." });
    } finally {
      setLoading(false);
    }
  };

  return (
    <SidebarLayout activeId="parents">
      <div className="page animate-fade-in" style={{ padding: "28px" }}>
        {/* Breadcrumbs */}
        <div style={{ marginBottom: "24px" }}>
          <div style={{ fontSize: "18px", fontWeight: "bold", color: "#111111" }}>Parents Management</div>
          <div style={{ fontSize: "12.5px", color: "#888888", marginTop: "4px" }}>
            Home - <span style={{ color: "var(--color-primary)" }}>{activeTab === "list" ? "All Parents" : "Add Parent"}</span>
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
            👨‍👩‍👧 All Parents
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
            ➕ Add Parent
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
              <span className="card-title" style={{ fontSize: "16px", fontWeight: "bold" }}>Parents Directory</span>
              <button className="btn btn-xs" onClick={loadParents} disabled={loading} style={{ background: "#f0f1f3", color: "#333" }}>
                {loading ? "Refreshing..." : "🔄 Reload"}
              </button>
            </div>
            <div className="card-body" style={{ padding: "0" }}>
              <div className="table-wrap">
                {parents.length === 0 ? (
                  <div className="empty-state" style={{ padding: "40px", textAlign: "center" }}>
                    <div style={{ fontSize: "48px" }}>👨‍👩‍👧</div>
                    <div style={{ fontWeight: "bold", fontSize: "16px", marginTop: "12px" }}>No Parents Registered</div>
                    <div style={{ color: "#777", fontSize: "13px" }}>Start adding parent profiles using the Add Parent tab.</div>
                  </div>
                ) : (
                  <table>
                    <thead>
                      <tr>
                        <th>Parent Full Name</th>
                        <th>Phone Number</th>
                        <th>Residential Address</th>
                        <th>Email</th>
                        <th>Registration Date</th>
                      </tr>
                    </thead>
                    <tbody>
                      {parents.map((p) => (
                        <tr key={p.id}>
                          <td className="td-name">👨‍👩‍👦 {p.fullName}</td>
                          <td><span className="badge badge-teal">{p.phoneNumber}</span></td>
                          <td>{p.address}</td>
                          <td>{p.email || "—"}</td>
                          <td>{new Date(p.createdAt).toLocaleDateString()}</td>
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
              <span className="card-title" style={{ fontSize: "16px", fontWeight: "bold" }}>Parent Profile Information</span>
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
                    <label className="form-label">Full Name <span className="form-required">*</span></label>
                    <input
                      type="text"
                      className="form-input"
                      placeholder="e.g. Almaz Kebede"
                      value={form.fullName}
                      onChange={(e) => setForm({ ...form, fullName: e.target.value })}
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Phone Number <span className="form-required">*</span></label>
                    <input
                      type="text"
                      className="form-input"
                      placeholder="e.g. +251911998877"
                      value={form.phoneNumber}
                      onChange={(e) => setForm({ ...form, phoneNumber: e.target.value })}
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Residential Address <span className="form-required">*</span></label>
                    <input
                      type="text"
                      className="form-input"
                      placeholder="e.g. Addis Ababa, Bole Sub-City, Woreda 03"
                      value={form.address}
                      onChange={(e) => setForm({ ...form, address: e.target.value })}
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Parent Account Username <span className="form-required">*</span></label>
                    <input
                      type="text"
                      className="form-input"
                      placeholder="e.g. parent_almaz"
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
                      placeholder="e.g. almaz@gmail.com"
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
