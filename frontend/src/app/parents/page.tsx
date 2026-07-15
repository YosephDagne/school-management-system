"use client";

import React from "react";
import SidebarLayout from "../../components/SidebarLayout";

export default function ParentsPage() {
  return (
    <SidebarLayout activeId="parents">
      <header className="header">
        <div className="header-title">👨‍👩‍👧 Parent Accounts</div>
      </header>
      <div className="page animate-fade-in">
        <div className="empty-state" style={{ paddingTop: 120 }}>
          <div className="empty-state-icon" style={{ fontSize: 64 }}>👨‍👩‍👧</div>
          <div className="empty-state-title">Parent Guardian Registry</div>
          <div className="empty-state-desc">
            This module portal is operational. Linkage structures are managed via the Students guided wizard.
          </div>
        </div>
      </div>
    </SidebarLayout>
  );
}
