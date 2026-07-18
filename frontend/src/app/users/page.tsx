"use client";

import React, { useEffect, useState } from "react";
import SidebarLayout from "../../components/SidebarLayout";
import { api } from "../../services/api";
import { useAuth } from "../../context/AuthContext";

interface Role {
  id: string;
  name: string;
  description?: string;
}

interface User {
  id: string;
  username: string;
  email?: string;
  isActive: boolean;
  lastLogin?: string;
  roles: Role[];
}

export default function UsersPage() {
  const { hasPermission } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [alert, setAlert] = useState<{ type: string; msg: string } | null>(null);

  // Form States
  const [showModal, setShowModal] = useState(false);
  const [showRoleModal, setShowRoleModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  
  // Create User fields
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [selectedRoleIds, setSelectedRoleIds] = useState<string[]>([]);
  
  // Assign Role fields
  const [assignRoleIds, setAssignRoleIds] = useState<string[]>([]);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    setError("");
    try {
      const [usersData, rolesData] = await Promise.all([
        api.getUsers(),
        api.getRoles(),
      ]);
      setUsers(usersData);
      setRoles(rolesData);
    } catch (err: any) {
      setError(err.message || "Failed to load users data");
    } finally {
      setLoading(false);
    }
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setAlert(null);
    try {
      const newUser = await api.createUser({
        username,
        email,
        password,
        roleIds: selectedRoleIds,
      });
      setUsers([...users, newUser]);
      setShowModal(false);
      setUsername("");
      setEmail("");
      setPassword("");
      setSelectedRoleIds([]);
      setAlert({ type: "success", msg: "User account created successfully" });
    } catch (err: any) {
      setAlert({ type: "danger", msg: err.message || "Failed to create user" });
    }
  };

  const handleToggleStatus = async (user: User) => {
    setAlert(null);
    try {
      const res = await api.toggleUserStatus(user.id);
      setUsers(users.map(u => u.id === user.id ? { ...u, isActive: res.isActive } : u));
      setAlert({ type: "success", msg: `User status changed successfully` });
    } catch (err: any) {
      setAlert({ type: "danger", msg: err.message || "Failed to change user status" });
    }
  };

  const handleOpenRoleModal = (user: User) => {
    setSelectedUser(user);
    setAssignRoleIds(user.roles.map(r => r.id));
    setShowRoleModal(true);
  };

  const handleAssignRoles = async () => {
    if (!selectedUser) return;
    setAlert(null);
    try {
      const token = typeof window !== "undefined" ? localStorage.getItem("sms_token") : "";
      const res = await fetch("/api/rbac/assign-roles", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ userId: selectedUser.id, roleIds: assignRoleIds }),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.message);

      setShowRoleModal(false);
      setAlert({ type: "success", msg: "Roles assigned successfully" });
      loadData();
    } catch (err: any) {
      setAlert({ type: "danger", msg: err.message || "Failed to assign roles" });
    }
  };

  const handleDeleteUser = async (id: string) => {
    if (!confirm("Are you sure you want to delete this user?")) return;
    setAlert(null);
    try {
      await api.deleteUser(id);
      setUsers(users.filter(u => u.id !== id));
      setAlert({ type: "success", msg: "User account deleted successfully" });
    } catch (err: any) {
      setAlert({ type: "danger", msg: err.message || "Failed to delete user" });
    }
  };

  const handleRoleCheckboxChange = (roleId: string, setFn: React.Dispatch<React.SetStateAction<string[]>>, currentVal: string[]) => {
    if (currentVal.includes(roleId)) {
      setFn(currentVal.filter(id => id !== roleId));
    } else {
      setFn([...currentVal, roleId]);
    }
  };

  return (
    <SidebarLayout activeId="users" permissionRequired="user.read">
      <header className="header">
        <div>
          <div className="header-title">👤 User Accounts Management</div>
          <div className="header-sub">Manage logins, status settings, and role mappings</div>
        </div>
        {hasPermission("user.create") && (
          <button onClick={() => setShowModal(true)} className="btn btn-primary" style={{ padding: "8px 16px", borderRadius: "6px", cursor: "pointer" }}>
            ➕ Create New User
          </button>
        )}
      </header>

      <div className="page animate-fade-in" style={{ padding: "28px" }}>
        {alert && (
          <div className={`alert alert-${alert.type}`} style={{ marginBottom: "20px" }}>
            {alert.type === "success" ? "✅" : "⚠️"} {alert.msg}
          </div>
        )}

        {loading ? (
          <div style={{ textAlign: "center", padding: "40px" }}>
            <div className="spinner" style={{ margin: "0 auto" }} />
          </div>
        ) : error ? (
          <div className="alert alert-danger">{error}</div>
        ) : (
          <div className="card" style={{ background: "#ffffff", padding: "20px", borderRadius: "8px" }}>
            <table className="table" style={{ width: "100%", borderCollapse: "collapse", textAlign: "left" }}>
              <thead>
                <tr style={{ borderBottom: "2px solid #e2e8f0" }}>
                  <th style={{ padding: "12px 8px" }}>Username</th>
                  <th style={{ padding: "12px 8px" }}>Email</th>
                  <th style={{ padding: "12px 8px" }}>Assigned Roles</th>
                  <th style={{ padding: "12px 8px" }}>Status</th>
                  <th style={{ padding: "12px 8px" }}>Last Login</th>
                  <th style={{ padding: "12px 8px" }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.map((user) => (
                  <tr key={user.id} style={{ borderBottom: "1px solid #f1f5f9" }}>
                    <td style={{ padding: "12px 8px", fontWeight: "bold" }}>{user.username}</td>
                    <td style={{ padding: "12px 8px" }}>{user.email || "-"}</td>
                    <td style={{ padding: "12px 8px" }}>
                      <div style={{ display: "flex", gap: "4px", flexWrap: "wrap" }}>
                        {user.roles.length === 0 ? (
                          <span style={{ fontSize: "11px", padding: "2px 6px", background: "#f1f5f9", borderRadius: "4px" }}>None</span>
                        ) : (
                          user.roles.map(r => (
                            <span key={r.id} style={{ fontSize: "11px", padding: "2px 6px", background: "#e0f2fe", color: "#0369a1", borderRadius: "4px", fontWeight: "600" }}>
                              {r.name}
                            </span>
                          ))
                        )}
                      </div>
                    </td>
                    <td style={{ padding: "12px 8px" }}>
                      <span className={`badge ${user.isActive ? "badge-green" : "badge-gray"}`} style={{
                        padding: "2px 6px",
                        background: user.isActive ? "#d1fae5" : "#f3f4f6",
                        color: user.isActive ? "#065f46" : "#4b5563",
                        borderRadius: "4px",
                        fontSize: "11px"
                      }}>
                        {user.isActive ? "Active" : "Inactive"}
                      </span>
                    </td>
                    <td style={{ padding: "12px 8px", fontSize: "12px", color: "#64748b" }}>
                      {user.lastLogin ? new Date(user.lastLogin).toLocaleString() : "Never"}
                    </td>
                    <td style={{ padding: "12px 8px" }}>
                      <div style={{ display: "flex", gap: "8px" }}>
                        {hasPermission("user.update") && (
                          <>
                            <button onClick={() => handleToggleStatus(user)} className="btn btn-outline" style={{ fontSize: "12px", padding: "4px 8px", cursor: "pointer" }}>
                              {user.isActive ? "Deactivate" : "Activate"}
                            </button>
                            <button onClick={() => handleOpenRoleModal(user)} className="btn btn-outline" style={{ fontSize: "12px", padding: "4px 8px", cursor: "pointer" }}>
                              🔑 Roles
                            </button>
                          </>
                        )}
                        {hasPermission("user.delete") && (
                          <button onClick={() => handleDeleteUser(user.id)} className="btn btn-outline" style={{ fontSize: "12px", padding: "4px 8px", color: "red", border: "1px solid red", cursor: "pointer" }}>
                            🗑️ Delete
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Create User Modal */}
      {showModal && (
        <div style={{
          position: "fixed", top: 0, left: 0, right: 0, bottom: 0,
          background: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000
        }}>
          <div style={{ background: "#ffffff", padding: "28px", borderRadius: "8px", width: "420px", boxShadow: "0 20px 25px -5px rgba(0,0,0,0.1)" }}>
            <h2 style={{ marginBottom: "20px", fontSize: "18px" }}>Create New User Account</h2>
            <form onSubmit={handleCreateUser}>
              <div className="form-group" style={{ marginBottom: "14px" }}>
                <label className="form-label" style={{ fontSize: "12px", fontWeight: "600" }}>Username *</label>
                <input type="text" className="form-input" value={username} onChange={e => setUsername(e.target.value)} required style={{ width: "100%", padding: "8px", marginTop: "4px" }} />
              </div>
              <div className="form-group" style={{ marginBottom: "14px" }}>
                <label className="form-label" style={{ fontSize: "12px", fontWeight: "600" }}>Email</label>
                <input type="email" className="form-input" value={email} onChange={e => setEmail(e.target.value)} style={{ width: "100%", padding: "8px", marginTop: "4px" }} />
              </div>
              <div className="form-group" style={{ marginBottom: "14px" }}>
                <label className="form-label" style={{ fontSize: "12px", fontWeight: "600" }}>Password *</label>
                <input type="password" className="form-input" value={password} onChange={e => setPassword(e.target.value)} required style={{ width: "100%", padding: "8px", marginTop: "4px" }} />
              </div>
              <div className="form-group" style={{ marginBottom: "20px" }}>
                <label className="form-label" style={{ fontSize: "12px", fontWeight: "600" }}>Assign Roles</label>
                <div style={{ maxHeight: "120px", overflowY: "auto", border: "1px solid #cbd5e1", padding: "8px", marginTop: "4px", borderRadius: "4px" }}>
                  {roles.map(role => (
                    <div key={role.id} style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "6px" }}>
                      <input type="checkbox" checked={selectedRoleIds.includes(role.id)} onChange={() => handleRoleCheckboxChange(role.id, setSelectedRoleIds, selectedRoleIds)} />
                      <span style={{ fontSize: "12px" }}>{role.name}</span>
                    </div>
                  ))}
                </div>
              </div>
              <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px" }}>
                <button type="button" onClick={() => setShowModal(false)} className="btn btn-outline" style={{ padding: "6px 12px", cursor: "pointer" }}>Cancel</button>
                <button type="submit" className="btn btn-primary" style={{ padding: "6px 12px", cursor: "pointer" }}>Save Account</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Role Assignment Modal */}
      {showRoleModal && selectedUser && (
        <div style={{
          position: "fixed", top: 0, left: 0, right: 0, bottom: 0,
          background: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000
        }}>
          <div style={{ background: "#ffffff", padding: "28px", borderRadius: "8px", width: "400px" }}>
            <h3 style={{ marginBottom: "14px", fontSize: "16px" }}>Manage Roles: {selectedUser.username}</h3>
            <p style={{ fontSize: "12px", color: "#64748b", marginBottom: "16px" }}>Assign many-to-many role memberships to this user account.</p>
            <div style={{ maxHeight: "200px", overflowY: "auto", border: "1px solid #cbd5e1", padding: "10px", borderRadius: "4px", marginBottom: "20px" }}>
              {roles.map(role => (
                <div key={role.id} style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "8px" }}>
                  <input type="checkbox" checked={assignRoleIds.includes(role.id)} onChange={() => handleRoleCheckboxChange(role.id, setAssignRoleIds, assignRoleIds)} />
                  <div>
                    <div style={{ fontSize: "13px", fontWeight: "600" }}>{role.name}</div>
                    <div style={{ fontSize: "11px", color: "#64748b" }}>{role.description || "No description"}</div>
                  </div>
                </div>
              ))}
            </div>
            <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px" }}>
              <button type="button" onClick={() => setShowRoleModal(false)} className="btn btn-outline" style={{ padding: "6px 12px", cursor: "pointer" }}>Cancel</button>
              <button type="button" onClick={handleAssignRoles} className="btn btn-primary" style={{ padding: "6px 12px", cursor: "pointer" }}>Assign Roles</button>
            </div>
          </div>
        </div>
      )}
    </SidebarLayout>
  );
}
