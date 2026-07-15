"use client";

import React from "react";
import SidebarLayout from "../../components/SidebarLayout";

export default function TeachersPage() {
  return (
    <SidebarLayout activeId="teachers">
      <header className="header">
        <div className="header-title">👨‍🏫 Teachers Management</div>
      </header>
      <div className="page animate-fade-in">
        <div className="empty-state" style={{ paddingTop: 120 }}>
          <div className="empty-state-icon" style={{ fontSize: 64 }}>👨‍🏫</div>
          <div className="empty-state-title">Teachers Administration</div>
          <div className="empty-state-desc">
            This module registry is operational. Interactive configuration logs will be rendered in a future release.
          </div>
        </div>
      </div>
    </SidebarLayout>
  );
}
