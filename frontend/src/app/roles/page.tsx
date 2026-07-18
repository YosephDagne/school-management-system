"use client";

import React, { useEffect, useState } from "react";
import SidebarLayout from "../../components/SidebarLayout";
import { api } from "../../services/api";
import { useAuth } from "../../context/AuthContext";

interface Permission {
  id: string;
  name: string;
  description?: string;
}

interface Role {
  id: string;
  name: string;
  description?: string;
  permissions: Permission[];
}

export default function RolesPage() {
  const { hasPermission } = useAuth();
  const [roles, setRoles] = useState<Role[]>([]);
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [selectedRole, setSelectedRole] = useState<Role | null>(null);
  const [selectedPermIds, setSelectedPermIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [alert, setAlert] = useState<{ type: string; msg: string } | null>(null);

  // Form States
  const [showRoleModal, setShowRoleModal] = useState(false);
  const [roleName, setRoleName] = useState("");
  const [roleDesc, setRoleDesc] = useState("");

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    setError("");
    try {
      const [rolesData, permsData] = await Promise.all([
        api.getRoles(),
        api.getPermissions(),
      ]);
      setRoles(rolesData);
      setPermissions(permsData);
      if (rolesData.length > 0) {
        handleSelectRole(rolesData[0]);
      }
    } catch (err: any) {
      setError(err.message || "Failed to load roles configuration");
    } finally {
      setLoading(false);
    }
  };

  const handleSelectRole = (role: Role) => {
    setSelectedRole(role);
    setSelectedPermIds(role.permissions.map(p => p.id));
  };

  const handleCreateRole = async (e: React.FormEvent) => {
    e.preventDefault();
    setAlert(null);
    try {
      const newRole = await api.createRole({ name: roleName, description: roleDesc });
      setRoles([...roles, { ...newRole, permissions: [] }]);
      setShowRoleModal(false);
      setRoleName("");
      setRoleDesc("");
      setAlert({ type: "success", msg: "Role created successfully" });
    } catch (err: any) {
      setAlert({ type: "danger", msg: err.message || "Failed to create role" });
    }
  };

  const handleSavePermissions = async () => {
    if (!selectedRole) return;
    setAlert(null);
    try {
      await api.setRolePermissions(selectedRole.id, selectedPermIds);
      setAlert({ type: "success", msg: "Role permissions saved successfully" });
      // Update local state
      setRoles(roles.map(r => {
        if (r.id === selectedRole.id) {
          const updatedPerms = permissions.filter(p => selectedPermIds.includes(p.id));
          return { ...r, permissions: updatedPerms };
        }
        return r;
      }));
    } catch (err: any) {
      setAlert({ type: "danger", msg: err.message || "Failed to save permissions" });
    }
  };

  const handleDeleteRole = async (id: string) => {
    if (!confirm("Are you sure you want to delete this role? All user mappings for this role will be removed.")) return;
    setAlert(null);
    try {
      await api.deleteRole(id);
      const filtered = roles.filter(r => r.id !== id);
      setRoles(filtered);
      if (selectedRole?.id === id && filtered.length > 0) {
        handleSelectRole(filtered[0]);
      } else if (filtered.length === 0) {
        setSelectedRole(null);
        setSelectedPermIds([]);
      }
      setAlert({ type: "success", msg: "Role removed successfully" });
    } catch (err: any) {
      setAlert({ type: "danger", msg: err.message || "Failed to delete role" });
    }
  };

  const handlePermissionCheckboxChange = (permId: string) => {
    if (selectedPermIds.includes(permId)) {
      setSelectedPermIds(selectedPermIds.filter(id => id !== permId));
    } else {
      setSelectedPermIds([...selectedPermIds, permId]);
    }
  };

  return (
    <SidebarLayout activeId="roles" permissionRequired="role.manage">
      <header className="header">
        <div>
          <div className="header-title">🔑 Roles & Permissions Dashboard</div>
          <div className="header-sub">Configure authorization mapping matrices for school staff and portals</div>
        </div>
        {hasPermission("role.manage") && (
          <button onClick={() => setShowRoleModal(true)} className="btn btn-primary" style={{ padding: "8px 16px", borderRadius: "6px", cursor: "pointer" }}>
            ➕ Create New Role
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
          <div style={{ display: "grid", gridTemplateColumns: "280px 1fr", gap: "24px" }}>
            {/* Roles Sidebar List */}
            <div className="card" style={{ background: "#ffffff", padding: "20px", borderRadius: "8px", height: "fit-content" }}>
              <h3 style={{ fontSize: "14px", fontWeight: "700", marginBottom: "14px", color: "#475569" }}>System Roles</h3>
              <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                {roles.map((r) => (
                  <div
                    key={r.id}
                    onClick={() => handleSelectRole(r)}
                    style={{
                      padding: "10px 12px",
                      borderRadius: "6px",
                      cursor: "pointer",
                      fontSize: "13px",
                      fontWeight: selectedRole?.id === r.id ? "600" : "400",
                      background: selectedRole?.id === r.id ? "#f1f5f9" : "transparent",
                      borderLeft: selectedRole?.id === r.id ? "4px solid #3b82f6" : "4px solid transparent",
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center"
                    }}
                    onMouseEnter={(e) => { if (selectedRole?.id !== r.id) e.currentTarget.style.background = "#f8fafc"; }}
                    onMouseLeave={(e) => { if (selectedRole?.id !== r.id) e.currentTarget.style.background = "transparent"; }}
                  >
                    <span>{r.name}</span>
                    {r.name !== "Super Admin" && hasPermission("role.manage") && (
                      <span onClick={(e) => { e.stopPropagation(); handleDeleteRole(r.id); }} style={{ color: "#ef4444", fontSize: "12px", opacity: 0.7, padding: "2px" }}>🗑️</span>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Selected Role Permissions Matrix */}
            {selectedRole ? (
              <div className="card" style={{ background: "#ffffff", padding: "24px", borderRadius: "8px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid #e2e8f0", paddingBottom: "14px", marginBottom: "20px" }}>
                  <div>
                    <h2 style={{ fontSize: "20px", fontWeight: "800", color: "#0f172a" }}>Role: {selectedRole.name}</h2>
                    <p style={{ fontSize: "12px", color: "#64748b", marginTop: "4px" }}>{selectedRole.description || "No description set for this role."}</p>
                  </div>
                  {selectedRole.name !== "Super Admin" && hasPermission("role.manage") && (
                    <button onClick={handleSavePermissions} className="btn btn-primary" style={{ padding: "8px 16px", borderRadius: "6px", cursor: "pointer" }}>
                      💾 Save Permissions Mapping
                    </button>
                  )}
                </div>

                {selectedRole.name === "Super Admin" ? (
                  <div style={{ padding: "20px", background: "#f8fafc", borderRadius: "6px", border: "1px dashed #cbd5e1", textAlign: "center" }}>
                    🔒 <strong>Super Admin has full system access overrides.</strong> All permission rules are dynamically approved for Super Admin accounts.
                  </div>
                ) : (
                  <div>
                    <h3 style={{ fontSize: "14px", fontWeight: "700", marginBottom: "14px", color: "#475569" }}>Granted Permission List</h3>
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: "12px" }}>
                      {permissions.map((perm) => (
                        <label key={perm.id} style={{
                          display: "flex", gap: "10px", alignItems: "flex-start", padding: "10px", border: "1px solid #e2e8f0", borderRadius: "6px", cursor: "pointer"
                        }}>
                          <input
                            type="checkbox"
                            style={{ marginTop: "3px" }}
                            checked={selectedPermIds.includes(perm.id)}
                            onChange={() => handlePermissionCheckboxChange(perm.id)}
                          />
                          <div>
                            <div style={{ fontSize: "12.5px", fontWeight: "600", color: "#334155" }}>{perm.name}</div>
                            <div style={{ fontSize: "11px", color: "#64748b", marginTop: "2px" }}>{perm.description}</div>
                          </div>
                        </label>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div style={{ padding: "40px", textAlign: "center", color: "#64748b" }}>
                Select a role from the list to manage its configuration.
              </div>
            )}
          </div>
        )}
      </div>

      {/* Create Role Modal */}
      {showRoleModal && (
        <div style={{
          position: "fixed", top: 0, left: 0, right: 0, bottom: 0,
          background: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000
        }}>
          <div style={{ background: "#ffffff", padding: "28px", borderRadius: "8px", width: "400px" }}>
            <h3 style={{ marginBottom: "20px", fontSize: "16px" }}>Create System Role</h3>
            <form onSubmit={handleCreateRole}>
              <div className="form-group" style={{ marginBottom: "14px" }}>
                <label className="form-label" style={{ fontSize: "12px", fontWeight: "600" }}>Role Name *</label>
                <input type="text" className="form-input" value={roleName} onChange={e => setRoleName(e.target.value)} required placeholder="e.g. Guidance Counselor" style={{ width: "100%", padding: "8px", marginTop: "4px" }} />
              </div>
              <div className="form-group" style={{ marginBottom: "20px" }}>
                <label className="form-label" style={{ fontSize: "12px", fontWeight: "600" }}>Description</label>
                <textarea className="form-input" value={roleDesc} onChange={e => setRoleDesc(e.target.value)} rows={3} placeholder="Describe duties and permissions..." style={{ width: "100%", padding: "8px", marginTop: "4px", resize: "vertical" }} />
              </div>
              <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px" }}>
                <button type="button" onClick={() => setShowRoleModal(false)} className="btn btn-outline" style={{ padding: "6px 12px", cursor: "pointer" }}>Cancel</button>
                <button type="submit" className="btn btn-primary" style={{ padding: "6px 12px", cursor: "pointer" }}>Save Role</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </SidebarLayout>
  );
}
