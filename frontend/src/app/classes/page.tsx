"use client";

import React from "react";
import SidebarLayout from "../../components/SidebarLayout";

export default function ClassesPage() {
  return (
    <SidebarLayout activeId="classes">
      <header className="header">
        <div className="header-title">🏛️ Class Sections</div>
      </header>
      <div className="page animate-fade-in">
        <div className="empty-state" style={{ paddingTop: 120 }}>
          <div className="empty-state-icon" style={{ fontSize: 64 }}>🏛️</div>
          <div className="empty-state-title">Classroom Sections Allocation</div>
          <div className="empty-state-desc">
            This module configuration is operational. Registration allocations are managed via the Students guided wizard.
          </div>
        </div>
      </div>
    </SidebarLayout>
  );
}
