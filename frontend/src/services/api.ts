function getToken() {
  if (typeof window !== "undefined") {
    return localStorage.getItem("sms_token") || "";
  }
  return "";
}

function getRefreshToken() {
  if (typeof window !== "undefined") {
    return localStorage.getItem("sms_refresh_token") || "";
  }
  return "";
}

async function apiFetch(path: string, options: RequestInit = {}): Promise<any> {
  const res = await fetch(path, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${getToken()}`,
      ...(options.headers || {}),
    },
  });

  if (res.status === 401 && typeof window !== "undefined") {
    // Attempt token refresh
    const rToken = getRefreshToken();
    if (rToken) {
      try {
        const refreshRes = await fetch("/api/auth/refresh", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ refreshToken: rToken }),
        });
        const refreshData = await refreshRes.json();
        if (refreshData.success && refreshData.data?.accessToken) {
          const newAccessToken = refreshData.data.accessToken;
          localStorage.setItem("sms_token", newAccessToken);
          
          // Retry the original request with the new token
          const retryRes = await fetch(path, {
            ...options,
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${newAccessToken}`,
              ...(options.headers || {}),
            },
          });
          const retryData = await retryRes.json();
          if (!retryData.success) throw new Error(retryData.message || "Retry request failed");
          return retryData.data;
        }
      } catch (err) {
        console.error("Token refresh failed:", err);
      }
    }

    // If refresh token doesn't exist or fails, log out
    localStorage.removeItem("sms_token");
    localStorage.removeItem("sms_refresh_token");
    localStorage.removeItem("sms_user");
    window.location.href = "/login";
    throw new Error("Session expired. Please log in again.");
  }

  const data = await res.json();
  if (!data.success) throw new Error(data.message || "Request failed");
  return data.data;
}

export const api = {
  // Auth
  login: (body: any) => apiFetch("/api/auth/login", { method: "POST", body: JSON.stringify(body) }),
  getProfile: () => apiFetch("/api/auth/profile"),

  // Users Management
  getUsers: () => apiFetch("/api/users"),
  createUser: (body: any) => apiFetch("/api/users", { method: "POST", body: JSON.stringify(body) }),
  updateUser: (id: string, body: any) => apiFetch(`/api/users/${id}`, { method: "PUT", body: JSON.stringify(body) }),
  deleteUser: (id: string) => apiFetch(`/api/users/${id}`, { method: "DELETE" }),
  toggleUserStatus: (id: string) => apiFetch(`/api/users/${id}/toggle-status`, { method: "PATCH" }),

  // RBAC
  getRoles: () => apiFetch("/api/rbac/roles"),
  createRole: (body: any) => apiFetch("/api/rbac/roles", { method: "POST", body: JSON.stringify(body) }),
  updateRole: (id: string, body: any) => apiFetch(`/api/rbac/roles/${id}`, { method: "PUT", body: JSON.stringify(body) }),
  deleteRole: (id: string) => apiFetch(`/api/rbac/roles/${id}`, { method: "DELETE" }),
  setRolePermissions: (roleId: string, permissionIds: string[]) => 
    apiFetch(`/api/rbac/roles/${roleId}/permissions`, { method: "POST", body: JSON.stringify({ permissionIds }) }),
  getPermissions: () => apiFetch("/api/rbac/permissions"),

  // Audit Logs
  getAuditLogs: (query = "") => apiFetch(`/api/audit${query}`),

  // Reports & Analytics
  getSchoolAnalytics: () => apiFetch("/api/reports/analytics"),
  getAcademicAverages: () => apiFetch("/api/reports/averages"),
  getMinistryReport: () => apiFetch("/api/reports/ministry"),

  // Registrar
  getStudents:   () => apiFetch("/api/registrar/students"),
  createStudent: (body: any) => apiFetch("/api/registrar/students", { method: "POST", body: JSON.stringify(body) }),
  assignStudentClass: (body: any) => apiFetch("/api/registrar/students/assign-class", { method: "POST", body: JSON.stringify(body) }),
  getTeachers:   () => apiFetch("/api/registrar/teachers"),
  createTeacher: (body: any) => apiFetch("/api/registrar/teachers", { method: "POST", body: JSON.stringify(body) }),
  getParents:    () => apiFetch("/api/registrar/parents"),
  createParent:  (body: any) => apiFetch("/api/registrar/parents", { method: "POST", body: JSON.stringify(body) }),
  getClasses:    () => apiFetch("/api/registrar/classes"),
  createClass:   (body: any) => apiFetch("/api/registrar/classes", { method: "POST", body: JSON.stringify(body) }),
  getSubjects:   () => apiFetch("/api/registrar/subjects"),
  createSubject: (body: any) => apiFetch("/api/registrar/subjects", { method: "POST", body: JSON.stringify(body) }),
  assignClassSubject: (body: any) => apiFetch("/api/registrar/class-subjects", { method: "POST", body: JSON.stringify(body) }),

  // Attendance
  recordAttendance: (body: any) => apiFetch("/api/attendance", { method: "POST", body: JSON.stringify(body) }),
  bulkAttendance: (body: any) => apiFetch("/api/attendance/bulk", { method: "POST", body: JSON.stringify(body) }),
  getClassAttendance: (classId: string, date: string) => apiFetch(`/api/attendance/class/${classId}?date=${date}`),
  getStudentAttendance: (studentId: string) => apiFetch(`/api/attendance/student/${studentId}`),

  // Exams
  createExam: (body: any) => apiFetch("/api/exams", { method: "POST", body: JSON.stringify(body) }),
  getClassSubjectExams: (csId: string) => apiFetch(`/api/exams/class-subject/${csId}`),

  // Grades
  recordGrade: (body: any) => apiFetch("/api/grades", { method: "POST", body: JSON.stringify(body) }),
  getStudentGrades: (studentId: string, semester?: string) => apiFetch(`/api/grades/student/${studentId}${semester ? `?semester=${semester}` : ""}`),
  getClassRankings: (classId: string, semester: string, academicYear: string) =>
    apiFetch(`/api/grades/class/${classId}/rankings?semester=${semester}&academicYear=${academicYear}`),

  // Finance
  getFees:       () => apiFetch("/api/finance/fees"),
  createFee:     (body: any) => apiFetch("/api/finance/fees", { method: "POST", body: JSON.stringify(body) }),
  recordPayment: (body: any) => apiFetch("/api/finance/payments", { method: "POST", body: JSON.stringify(body) }),
  getStudentLedger: (studentId: string) => apiFetch(`/api/finance/ledger/${studentId}`),

  // Library
  getBooks:      () => apiFetch("/api/library/books"),
  createBook:    (body: any) => apiFetch("/api/library/books", { method: "POST", body: JSON.stringify(body) }),
  borrowBook:    (body: any) => apiFetch("/api/library/borrow", { method: "POST", body: JSON.stringify(body) }),
  returnBook:    (borrowingId: string) => apiFetch(`/api/library/return/${borrowingId}`, { method: "POST" }),
  getActiveBorrowings: () => apiFetch("/api/library/borrowings/active"),
};
