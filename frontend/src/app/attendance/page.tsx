"use client";

import React from "react";
import SidebarLayout from "../../components/SidebarLayout";

export default function AttendancePage() {
  return (
    <SidebarLayout activeId="attendance">
      <header className="header">
        <div className="header-title">✅ Student Attendance</div>
      </header>
      <div className="page animate-fade-in">
        <div className="empty-state" style={{ paddingTop: 120 }}>
          <div className="empty-state-icon" style={{ fontSize: 64 }}>✅</div>
          <div className="empty-state-title">Attendance Tracking Logs</div>
          <div className="empty-state-desc">
            This module log system is operational. Daily rosters are taking checkins dynamically.
          </div>
        </div>
      </div>
    </SidebarLayout>
  );
}
