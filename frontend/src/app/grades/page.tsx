"use client";

import React from "react";
import SidebarLayout from "../../components/SidebarLayout";

export default function GradesPage() {
  return (
    <SidebarLayout activeId="grades">
      <header className="header">
        <div className="header-title">📊 Grade Book</div>
      </header>
      <div className="page animate-fade-in">
        <div className="empty-state" style={{ paddingTop: 120 }}>
          <div className="empty-state-icon" style={{ fontSize: 64 }}>📊</div>
          <div className="empty-state-title">Grade Book & Assessments Logs</div>
          <div className="empty-state-desc">
            This module entry log is operational. Custom score entries are recorded via teachers checkpoints.
          </div>
        </div>
      </div>
    </SidebarLayout>
  );
}
