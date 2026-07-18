"use client";

import React, { useEffect, useState } from "react";
import SidebarLayout from "../../components/SidebarLayout";
import { api } from "../../services/api";

interface AuditLog {
  id: string;
  userId: string;
  action: string;
  module: string;
  ipAddress?: string;
  details?: string;
  createdAt: string;
  user?: {
    username: string;
    email?: string;
  };
}

export default function AuditLogsPage() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Filter States
  const [module, setModule] = useState("");
  const [action, setAction] = useState("");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  
  // Pagination
  const [page, setPage] = useState(1);
  const limit = 20;

  useEffect(() => {
    loadLogs();
  }, [page]);

  const loadLogs = async () => {
    setLoading(true);
    setError("");
    try {
      let query = `?page=${page}&limit=${limit}`;
      if (module) query += `&module=${encodeURIComponent(module)}`;
      if (action) query += `&action=${encodeURIComponent(action)}`;
      if (from) query += `&from=${from}`;
      if (to) query += `&to=${to}`;

      const res = await api.getAuditLogs(query);
      setLogs(res.logs);
      setTotal(res.total);
    } catch (err: any) {
      setError(err.message || "Failed to load audit logs");
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    loadLogs();
  };

  const handleReset = () => {
    setModule("");
    setAction("");
    setFrom("");
    setTo("");
    setPage(1);
    // Reload logs
    setTimeout(() => {
      loadLogs();
    }, 50);
  };

  const totalPages = Math.ceil(total / limit);

  return (
    <SidebarLayout activeId="audit" permissionRequired="audit.read">
      <header className="header">
        <div>
          <div className="header-title">📋 System Security Audit Logs</div>
          <div className="header-sub">Trace system-wide creations, modifications, deletions, logins, and logouts</div>
        </div>
      </header>

      <div className="page animate-fade-in" style={{ padding: "28px" }}>
        {/* Filters */}
        <div className="card" style={{ background: "#ffffff", padding: "20px", borderRadius: "8px", marginBottom: "20px" }}>
          <form onSubmit={handleSearch} style={{ display: "flex", flexWrap: "wrap", gap: "16px", alignItems: "flex-end" }}>
            <div style={{ flex: 1, minWidth: "150px" }}>
              <label style={{ fontSize: "11px", fontWeight: "600", color: "#64748b" }}>Filter by Module</label>
              <select value={module} onChange={e => setModule(e.target.value)} style={{ width: "100%", padding: "8px", border: "1px solid #cbd5e1", borderRadius: "6px", marginTop: "4px", fontSize: "13px" }}>
                <option value="">All Modules</option>
                <option value="Auth">Authentication</option>
                <option value="Users">Users</option>
                <option value="RBAC">RBAC Configuration</option>
                <option value="Registrar">Registrar</option>
                <option value="Grades">Exams & Grades</option>
                <option value="Attendance">Attendance</option>
                <option value="Finance">Finance</option>
                <option value="Library">Library</option>
              </select>
            </div>

            <div style={{ flex: 1, minWidth: "150px" }}>
              <label style={{ fontSize: "11px", fontWeight: "600", color: "#64748b" }}>Action Search</label>
              <input type="text" placeholder="e.g. CREATE, LOGIN" value={action} onChange={e => setAction(e.target.value)} style={{ width: "100%", padding: "8px", border: "1px solid #cbd5e1", borderRadius: "6px", marginTop: "4px", fontSize: "13px" }} />
            </div>

            <div style={{ minWidth: "120px" }}>
              <label style={{ fontSize: "11px", fontWeight: "600", color: "#64748b" }}>From Date</label>
              <input type="date" value={from} onChange={e => setFrom(e.target.value)} style={{ width: "100%", padding: "8px", border: "1px solid #cbd5e1", borderRadius: "6px", marginTop: "4px", fontSize: "13px" }} />
            </div>

            <div style={{ minWidth: "120px" }}>
              <label style={{ fontSize: "11px", fontWeight: "600", color: "#64748b" }}>To Date</label>
              <input type="date" value={to} onChange={e => setTo(e.target.value)} style={{ width: "100%", padding: "8px", border: "1px solid #cbd5e1", borderRadius: "6px", marginTop: "4px", fontSize: "13px" }} />
            </div>

            <div style={{ display: "flex", gap: "8px" }}>
              <button type="submit" className="btn btn-primary" style={{ padding: "8px 16px", borderRadius: "6px", cursor: "pointer" }}>
                🔍 Filter
              </button>
              <button type="button" onClick={handleReset} className="btn btn-outline" style={{ padding: "8px 16px", borderRadius: "6px", cursor: "pointer" }}>
                Reset
              </button>
            </div>
          </form>
        </div>

        {/* Table logs */}
        {loading ? (
          <div style={{ textAlign: "center", padding: "40px" }}>
            <div className="spinner" style={{ margin: "0 auto" }} />
          </div>
        ) : error ? (
          <div className="alert alert-danger">{error}</div>
        ) : logs.length === 0 ? (
          <div className="card" style={{ background: "#ffffff", padding: "40px", textAlign: "center", color: "#64748b", borderRadius: "8px" }}>
            No audit logs matched the specified filters.
          </div>
        ) : (
          <div>
            <div className="card" style={{ background: "#ffffff", padding: "20px", borderRadius: "8px", marginBottom: "20px" }}>
              <table className="table" style={{ width: "100%", borderCollapse: "collapse", textAlign: "left" }}>
                <thead>
                  <tr style={{ borderBottom: "2px solid #e2e8f0" }}>
                    <th style={{ padding: "12px 8px" }}>Timestamp</th>
                    <th style={{ padding: "12px 8px" }}>Username</th>
                    <th style={{ padding: "12px 8px" }}>Module</th>
                    <th style={{ padding: "12px 8px" }}>Action</th>
                    <th style={{ padding: "12px 8px" }}>IP Address</th>
                    <th style={{ padding: "12px 8px" }}>Details / Payload</th>
                  </tr>
                </thead>
                <tbody>
                  {logs.map((log) => (
                    <tr key={log.id} style={{ borderBottom: "1px solid #f1f5f9" }}>
                      <td style={{ padding: "12px 8px", fontSize: "12px", color: "#64748b" }}>
                        {new Date(log.createdAt).toLocaleString()}
                      </td>
                      <td style={{ padding: "12px 8px", fontWeight: "bold" }}>
                        {log.user ? log.user.username : "System / Unknown"}
                      </td>
                      <td style={{ padding: "12px 8px" }}>
                        <span style={{ fontSize: "11px", padding: "2px 6px", background: "#f1f5f9", borderRadius: "4px", fontWeight: "600" }}>
                          {log.module}
                        </span>
                      </td>
                      <td style={{ padding: "12px 8px" }}>
                        <span style={{
                          fontSize: "11px", padding: "2px 6px", borderRadius: "4px", fontWeight: "600",
                          background: log.action.includes("CREATE") ? "#d1fae5" : log.action.includes("DELETE") ? "#fee2e2" : "#fef3c7",
                          color: log.action.includes("CREATE") ? "#065f46" : log.action.includes("DELETE") ? "#991b1b" : "#92400e"
                        }}>
                          {log.action}
                        </span>
                      </td>
                      <td style={{ padding: "12px 8px", fontSize: "12.5px" }}>{log.ipAddress || "-"}</td>
                      <td style={{ padding: "12px 8px", fontSize: "11.5px", color: "#475569", fontFamily: "monospace", maxWidth: "250px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }} title={log.details}>
                        {log.details || "-"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination Controls */}
            {totalPages > 1 && (
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span style={{ fontSize: "13px", color: "#64748b" }}>
                  Showing logs {(page - 1) * limit + 1} to {Math.min(page * limit, total)} of {total} entries
                </span>
                <div style={{ display: "flex", gap: "8px" }}>
                  <button disabled={page === 1} onClick={() => setPage(page - 1)} className="btn btn-outline" style={{ padding: "6px 12px", cursor: "pointer", opacity: page === 1 ? 0.5 : 1 }}>
                    Previous
                  </button>
                  <span style={{ alignSelf: "center", fontSize: "13.5px", fontWeight: "600" }}>
                    Page {page} of {totalPages}
                  </span>
                  <button disabled={page === totalPages} onClick={() => setPage(page + 1)} className="btn btn-outline" style={{ padding: "6px 12px", cursor: "pointer", opacity: page === totalPages ? 0.5 : 1 }}>
                    Next
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </SidebarLayout>
  );
}
