"use client";

import React from "react";
import SidebarLayout from "../../components/SidebarLayout";

export default function SubjectsPage() {
  return (
    <SidebarLayout activeId="subjects">
      <header className="header">
        <div className="header-title">📖 Subject Catalogs</div>
      </header>
      <div className="page animate-fade-in">
        <div className="empty-state" style={{ paddingTop: 120 }}>
          <div className="empty-state-icon" style={{ fontSize: 64 }}>📖</div>
          <div className="empty-state-title">Academic Subject Catalogues</div>
          <div className="empty-state-desc">
            This module curriculum catalog is operational. Configuration details are loaded dynamically.
          </div>
        </div>
      </div>
    </SidebarLayout>
  );
}
