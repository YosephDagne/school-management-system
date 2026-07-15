"use client";

import React, { useEffect, useState } from "react";
import { api } from "../../services/api";
import SidebarLayout from "../../components/SidebarLayout";

interface Student {
  id: string;
  admissionNumber: string;
  firstName: string;
  middleName: string;
  lastName: string;
  gender: string;
  status: string;
  class?: { name: string; gradeLevel: number };
  parent?: { fullName: string; phoneNumber: string };
}

interface Parent {
  id: string;
  fullName: string;
  phoneNumber: string;
  address: string;
}

interface ClassSection {
  id: string;
  name: string;
  gradeLevel: number;
  capacity?: number;
  studentsCount?: number;
}

export default function StudentsPage() {
  const [students, setStudents] = useState<Student[]>([]);
  const [parents, setParents] = useState<Parent[]>([]);
  const [classes, setClasses] = useState<ClassSection[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [alert, setAlert] = useState<{ type: string; msg: string } | null>(null);

  // Wizard State
  const [showWizard, setShowWizard] = useState(false);
  const [step, setStep] = useState(1);

  // Parent search result state
  const [parentSearchPhone, setParentSearchPhone] = useState("");
  const [foundParent, setFoundParent] = useState<Parent | null>(null);
  const [parentSearchMode, setParentSearchMode] = useState<"search" | "new">("search");

  // Step 1: Student details
  const [studentForm, setStudentForm] = useState({
    username: "",
    email: "",
    admissionNumber: "",
    firstName: "",
    middleName: "",
    lastName: "",
    gender: "M" as "M" | "F",
    dateOfBirth: "",
    gradeLevel: 9,
    stream: "General",
  });

  // Step 2: Parent details
  const [parentForm, setParentForm] = useState({
    username: "",
    fullName: "",
    phoneNumber: "",
    address: "",
    email: "",
  });

  // Step 3: Class section details
  const [selectedClassId, setSelectedClassId] = useState("");

  // Step 4: Complete & Slip state
  const [enrollmentSlip, setEnrollmentSlip] = useState<any>(null);

  // Dynamic Class Creation state
  const [isCreatingClass, setIsCreatingClass] = useState(false);
  const [newClassName, setNewClassName] = useState("");
  const [creatingClassLoading, setCreatingClassLoading] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    setLoading(true);
    try {
      const [s, p, c] = await Promise.all([
        api.getStudents(),
        api.getParents(),
        api.getClasses(),
      ]);
      setStudents(s);
      setParents(p);
      
      // Augment classes with student counts
      const updatedClasses = c.map((cls: any) => {
        const count = s.filter((student: any) => student.classId === cls.id).length;
        return {
          ...cls,
          capacity: 45, // default capacity
          studentsCount: count,
        };
      });
      setClasses(updatedClasses);
    } catch (e: any) {
      setAlert({ type: "error", msg: e.message });
    }
    setLoading(false);
  }

  // search parent
  const handleSearchParent = () => {
    setFoundParent(null);
    if (!parentSearchPhone) return;
    const matched = parents.find(p => p.phoneNumber === parentSearchPhone);
    if (matched) {
      setFoundParent(matched);
      setAlert(null);
    } else {
      setAlert({ type: "warning", msg: "No existing parent found with that phone number. Try entering a new parent." });
    }
  };

  const handleNextStep1 = () => {
    if (!studentForm.firstName || !studentForm.middleName || !studentForm.lastName || !studentForm.admissionNumber || !studentForm.username || !studentForm.dateOfBirth) {
      setAlert({ type: "error", msg: "Please fill in all required student details." });
      return;
    }
    // Check duplicates
    if (students.some(s => s.admissionNumber === studentForm.admissionNumber)) {
      setAlert({ type: "error", msg: "Admission number already exists." });
      return;
    }
    setAlert(null);
    setStep(2);
  };

  const handleNextStep2 = async () => {
    if (parentSearchMode === "search") {
      if (!foundParent) {
        setAlert({ type: "error", msg: "Please select/link an existing parent or change mode to create a new parent profile." });
        return;
      }
    } else {
      if (!parentForm.fullName || !parentForm.phoneNumber || !parentForm.address || !parentForm.username) {
        setAlert({ type: "error", msg: "Please fill in all parent profile details." });
        return;
      }
    }
    setAlert(null);
    setStep(3);
  };

  const handleNextStep3 = async () => {
    if (!selectedClassId) {
      setAlert({ type: "error", msg: "Please allocate a class section." });
      return;
    }

    const targetClass = classes.find(c => c.id === selectedClassId);
    if (targetClass && targetClass.studentsCount !== undefined && targetClass.capacity !== undefined) {
      if (targetClass.studentsCount >= targetClass.capacity) {
        setAlert({ type: "error", msg: `Cannot allocate: Section ${targetClass.name} is at maximum capacity (${targetClass.capacity} students).` });
        return;
      }
    }

    // Now finalize student enrollment!
    setLoading(true);
    setAlert(null);
    try {
      let linkedParentId = "";
      
      // If parent is new, create them first
      if (parentSearchMode === "new") {
        const res = await api.createParent({
          username: parentForm.username,
          fullName: parentForm.fullName,
          phoneNumber: parentForm.phoneNumber,
          address: parentForm.address,
          email: parentForm.email,
        });
        linkedParentId = res.parent.id;
      } else {
        linkedParentId = foundParent!.id;
      }

      // Enrol student
      const enrollRes = await api.createStudent({
        username: studentForm.username,
        email: studentForm.email,
        admissionNumber: studentForm.admissionNumber,
        firstName: studentForm.firstName,
        middleName: studentForm.middleName,
        lastName: studentForm.lastName,
        gender: studentForm.gender,
        dateOfBirth: new Date(studentForm.dateOfBirth),
        parentId: linkedParentId,
        classId: selectedClassId,
      });

      // Prepare confirmation invoice / credentials slip
      setEnrollmentSlip({
        student: enrollRes.student,
        parentName: parentSearchMode === "new" ? parentForm.fullName : foundParent!.fullName,
        className: targetClass?.name,
        stream: studentForm.stream,
        fees: 4500.00, // Standard Semester 1 fees
      });

      setStep(4);
      await loadData();
    } catch (e: any) {
      setAlert({ type: "error", msg: e.message || "Enrollment failed." });
    }
    setLoading(false);
  };

  const closeWizard = () => {
    setShowWizard(false);
    setStep(1);
    setFoundParent(null);
    setParentSearchPhone("");
    setEnrollmentSlip(null);
    setSelectedClassId("");
    setStudentForm({
      username: "", email: "", admissionNumber: "", firstName: "",
      middleName: "", lastName: "", gender: "M", dateOfBirth: "", gradeLevel: 9, stream: "General",
    });
    setParentForm({ username: "", fullName: "", phoneNumber: "", address: "", email: "" });
    setIsCreatingClass(false);
    setNewClassName("");
  };

  const handleCreateClassInline = async () => {
    if (!newClassName.trim()) {
      setAlert({ type: "error", msg: "Please enter a class name." });
      return;
    }
    setCreatingClassLoading(true);
    setAlert(null);
    try {
      const res = await api.createClass({
        name: newClassName.trim(),
        gradeLevel: studentForm.gradeLevel,
        academicYear: "2026-2027",
      });
      setAlert({ type: "success", msg: `Class section ${res.name} created and allocated!` });
      
      // Reload classes
      const updatedClasses = await api.getClasses();
      const mapped = updatedClasses.map((cls: any) => {
        const count = students.filter((student: any) => student.classId === cls.id).length;
        return { ...cls, capacity: 45, studentsCount: count };
      });
      setClasses(mapped);
      
      // Auto select the new class
      setSelectedClassId(res.id);
      setIsCreatingClass(false);
      setNewClassName("");
    } catch (e: any) {
      setAlert({ type: "error", msg: e.message || "Failed to create class section." });
    }
    setCreatingClassLoading(false);
  };

  const filteredStudents = students.filter(s => {
    const q = search.toLowerCase();
    return (
      s.firstName.toLowerCase().includes(q) ||
      s.lastName.toLowerCase().includes(q) ||
      s.admissionNumber.toLowerCase().includes(q)
    );
  });

  return (
    <SidebarLayout activeId="students">
      <header className="header">
        <div>
          <div className="header-title">Registrar Enrollment Desk</div>
          <div className="header-sub">Enroll students, link siblings, and allocate sections</div>
        </div>
      </header>

      <div className="page animate-fade-in">
        <div className="page-header">
          <div>
            <h1 className="page-header-title">Student Enrollment Roster</h1>
            <p className="page-header-sub">{students.length} students currently registered in system</p>
          </div>
          <div className="page-header-actions">
            <div className="search-wrap">
              <span className="search-icon">🔍</span>
              <input
                className="search-input"
                placeholder="Search by name / ID..."
                value={search}
                onChange={e => setSearch(e.target.value)}
              />
            </div>
            <button className="btn btn-primary" onClick={() => setShowWizard(true)}>
              ➕ Guided Student Enrollment
            </button>
          </div>
        </div>

        {alert && !showWizard && (
          <div className={`alert alert-${alert.type} mb-4`}>
            {alert.type === "success" ? "✅" : alert.type === "error" ? "❌" : "⚠️"} {alert.msg}
            <button className="btn-ghost btn-xs ml-auto" onClick={() => setAlert(null)}>✕</button>
          </div>
        )}

        <div className="card">
          <div className="table-wrap">
            {loading && !showWizard ? (
              <div className="empty-state">
                <div className="spinner" style={{ margin: "0 auto 12px" }} />
                <div>Loading registry rosters...</div>
              </div>
            ) : filteredStudents.length === 0 ? (
              <div className="empty-state">
                <div className="empty-state-icon">👨‍🎓</div>
                <div className="empty-state-title">No students found</div>
                <div className="empty-state-desc">Start enrollment by launching the guided wizard.</div>
              </div>
            ) : (
              <table>
                <thead>
                  <tr>
                    <th>Admission No.</th>
                    <th>Full Name</th>
                    <th>Gender</th>
                    <th>Grade Level & Class</th>
                    <th>Parent / Sibling Group</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredStudents.map(s => (
                    <tr key={s.id}>
                      <td><span className="badge badge-blue">{s.admissionNumber}</span></td>
                      <td className="td-name">{s.firstName} {s.middleName} {s.lastName}</td>
                      <td>
                        <span className={`badge ${s.gender === "M" ? "badge-blue" : "badge-teal"}`}>
                          {s.gender === "M" ? "♂ Male" : "♀ Female"}
                        </span>
                      </td>
                      <td className="td-name">
                        {s.class ? `${s.class.name} (Grade ${s.class.gradeLevel})` : <span className="text-muted text-xs">Unassigned</span>}
                      </td>
                      <td>
                        {s.parent ? (
                          <div>
                            <div className="text-sm font-semibold">{s.parent.fullName}</div>
                            <div className="text-xs text-muted">{s.parent.phoneNumber}</div>
                          </div>
                        ) : "—"}
                      </td>
                      <td><span className="badge badge-green">{s.status}</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>

      {/* Guided Enrollment Wizard Modal */}
      {showWizard && (
        <div className="modal-overlay">
          <div className="modal modal-lg animate-slide-up">
            <div className="modal-header">
              <span className="modal-title">🎓 Student Guided Enrollment Wizard</span>
              <button className="modal-close" onClick={closeWizard}>✕</button>
            </div>

            {/* Wizard Header Progress Bar */}
            <div className="modal-body" style={{ paddingBottom: 0 }}>
              <div className="wizard-steps">
                {[
                  { s: 1, label: "Student Info" },
                  { s: 2, label: "Parent Linkage" },
                  { s: 3, label: "Class & Allocation" },
                  { s: 4, label: "Receipt & Creds" },
                ].map(w => (
                  <div key={w.s} className={`wizard-step ${step === w.s ? "active" : step > w.s ? "completed" : ""}`}>
                    <div className="wizard-step-circle">{w.s}</div>
                    <span className="wizard-step-label">{w.label}</span>
                  </div>
                ))}
              </div>

              {alert && (
                <div className={`alert alert-${alert.type} mb-4`}>
                  ⚠️ {alert.msg}
                  <button className="btn-ghost btn-xs ml-auto" onClick={() => setAlert(null)}>✕</button>
                </div>
              )}
            </div>

            <div className="modal-body" style={{ paddingTop: 10 }}>
              {/* STEP 1: Student Information */}
              {step === 1 && (
                <div className="form-grid two-col">
                  <div className="form-group">
                    <label className="form-label">First Name (Student) <span className="form-required">*</span></label>
                    <input className="form-input" placeholder="e.g. Yoseph" value={studentForm.firstName} onChange={e => setStudentForm(f => ({ ...f, firstName: e.target.value }))} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Middle Name (Father) <span className="form-required">*</span></label>
                    <input className="form-input" placeholder="e.g. Dagne" value={studentForm.middleName} onChange={e => setStudentForm(f => ({ ...f, middleName: e.target.value }))} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Last Name (Grandfather) <span className="form-required">*</span></label>
                    <input className="form-input" placeholder="e.g. Kebede" value={studentForm.lastName} onChange={e => setStudentForm(f => ({ ...f, lastName: e.target.value }))} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Admission Number <span className="form-required">*</span></label>
                    <input className="form-input" placeholder="e.g. ADM2026-001" value={studentForm.admissionNumber} onChange={e => setStudentForm(f => ({ ...f, admissionNumber: e.target.value }))} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Date of Birth <span className="form-required">*</span></label>
                    <input type="date" className="form-input" value={studentForm.dateOfBirth} onChange={e => setStudentForm(f => ({ ...f, dateOfBirth: e.target.value }))} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Gender <span className="form-required">*</span></label>
                    <select className="form-select" value={studentForm.gender} onChange={e => setStudentForm(f => ({ ...f, gender: e.target.value as "M" | "F" }))}>
                      <option value="M">Male</option>
                      <option value="F">Female</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Grade Level <span className="form-required">*</span></label>
                    <select className="form-select" value={studentForm.gradeLevel} onChange={e => setStudentForm(f => ({ ...f, gradeLevel: parseInt(e.target.value) || 9 }))}>
                      {[9, 10, 11, 12].map(g => <option key={g} value={g}>Grade {g}</option>)}
                    </select>
                  </div>
                  {studentForm.gradeLevel >= 11 && (
                    <div className="form-group">
                      <label className="form-label">Academic Stream <span className="form-required">*</span></label>
                      <select className="form-select" value={studentForm.stream} onChange={e => setStudentForm(f => ({ ...f, stream: e.target.value }))}>
                        <option value="NaturalScience">Natural Science</option>
                        <option value="SocialScience">Social Science</option>
                      </select>
                    </div>
                  )}
                  <div className="form-group">
                    <label className="form-label">Account Username <span className="form-required">*</span></label>
                    <input className="form-input" placeholder="e.g. student_yoseph" value={studentForm.username} onChange={e => setStudentForm(f => ({ ...f, username: e.target.value }))} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Email (optional)</label>
                    <input className="form-input" type="email" placeholder="student@email.com" value={studentForm.email} onChange={e => setStudentForm(f => ({ ...f, email: e.target.value }))} />
                  </div>
                </div>
              )}

              {/* STEP 2: Parent/Guardian linkage */}
              {step === 2 && (
                <div>
                  <div className="chip-tabs mb-4">
                    <button className={`chip ${parentSearchMode === "search" ? "active" : ""}`} onClick={() => { setParentSearchMode("search"); setAlert(null); }}>🔍 Sibling Lookup / Search Existing Parent</button>
                    <button className={`chip ${parentSearchMode === "new" ? "active" : ""}`} onClick={() => { setParentSearchMode("new"); setAlert(null); }}>➕ Add New Parent Profile</button>
                  </div>

                  {parentSearchMode === "search" ? (
                    <div className="flex-col gap-4">
                      <div className="form-group" style={{ maxWidth: 360 }}>
                        <label className="form-label">Parent Phone Number</label>
                        <div className="flex gap-2">
                          <input className="form-input" placeholder="e.g. +251911223344" value={parentSearchPhone} onChange={e => setParentSearchPhone(e.target.value)} />
                          <button className="btn btn-outline" onClick={handleSearchParent}>Find</button>
                        </div>
                      </div>

                      {foundParent && (
                        <div className="alert alert-info mt-2">
                          <div>
                            <strong>Parent Found:</strong> {foundParent.fullName}
                            <div className="text-xs mt-1">Address: {foundParent.address} | Phone: {foundParent.phoneNumber}</div>
                          </div>
                          <span className="badge badge-green ml-auto">Verified</span>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="form-grid two-col">
                      <div className="form-group">
                        <label className="form-label">Parent Full Name <span className="form-required">*</span></label>
                        <input className="form-input" placeholder="e.g. Yoseph Dagne Senior" value={parentForm.fullName} onChange={e => setParentForm(f => ({ ...f, fullName: e.target.value }))} />
                      </div>
                      <div className="form-group">
                        <label className="form-label">Parent Phone Number <span className="form-required">*</span></label>
                        <input className="form-input" placeholder="e.g. +251911223344" value={parentForm.phoneNumber} onChange={e => setParentForm(f => ({ ...f, phoneNumber: e.target.value }))} />
                      </div>
                      <div className="form-group">
                        <label className="form-label">Residential Address <span className="form-required">*</span></label>
                        <input className="form-input" placeholder="e.g. Addis Ababa, Bole" value={parentForm.address} onChange={e => setParentForm(f => ({ ...f, address: e.target.value }))} />
                      </div>
                      <div className="form-group">
                        <label className="form-label">Parent Username <span className="form-required">*</span></label>
                        <input className="form-input" placeholder="e.g. parent_yoseph" value={parentForm.username} onChange={e => setParentForm(f => ({ ...f, username: e.target.value }))} />
                      </div>
                      <div className="form-group">
                        <label className="form-label">Parent Email (optional)</label>
                        <input className="form-input" type="email" placeholder="parent@email.com" value={parentForm.email} onChange={e => setParentForm(f => ({ ...f, email: e.target.value }))} />
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* STEP 3: Class allocation */}
              {step === 3 && (
                <div className="flex-col gap-4">
                  <div className="form-group" style={{ maxWidth: 360 }}>
                    <label className="form-label">Allocate Class Section <span className="form-required">*</span></label>
                    <select className="form-select" value={selectedClassId} onChange={e => setSelectedClassId(e.target.value)}>
                      <option value="">— Select Section —</option>
                      {classes.filter(c => c.gradeLevel === studentForm.gradeLevel).map(c => {
                        const isFull = c.studentsCount !== undefined && c.capacity !== undefined && c.studentsCount >= c.capacity;
                        return (
                          <option key={c.id} value={c.id} disabled={isFull}>
                            {c.name} ({c.studentsCount}/{c.capacity} Enrolled) {isFull ? "[FULL]" : ""}
                          </option>
                        );
                      })}
                    </select>

                    <div style={{ marginTop: 12 }}>
                      {!isCreatingClass ? (
                        <button
                          type="button"
                          className="btn btn-outline btn-xs"
                          onClick={() => setIsCreatingClass(true)}
                        >
                          ➕ Section not listed? Create Section
                        </button>
                      ) : (
                        <div className="card" style={{ padding: 16, marginTop: 10, background: "var(--surface-sunken)" }}>
                          <div className="form-group">
                            <label className="form-label" style={{ fontSize: 11.5 }}>New Section Name <span className="form-required">*</span></label>
                            <div className="flex gap-2">
                              <input
                                className="form-input"
                                style={{ padding: "8px 12px", fontSize: 12.5 }}
                                placeholder="e.g. Grade 9C"
                                value={newClassName}
                                onChange={e => setNewClassName(e.target.value)}
                              />
                              <button
                                type="button"
                                className="btn btn-primary btn-sm"
                                onClick={handleCreateClassInline}
                                disabled={creatingClassLoading}
                              >
                                {creatingClassLoading ? "Saving..." : "Save Section"}
                              </button>
                              <button
                                type="button"
                                className="btn btn-ghost btn-sm"
                                onClick={() => setIsCreatingClass(false)}
                              >
                                Cancel
                              </button>
                            </div>
                            <span className="form-hint" style={{ fontSize: 10.5 }}>This section will be created under Grade {studentForm.gradeLevel} (Academic Year 2026-2027)</span>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="card">
                    <div className="card-header"><span className="card-title">Enrollment Invoice Draft</span></div>
                    <div className="card-body">
                      <div className="flex justify-between mb-2">
                        <span className="text-sm text-secondary">Semester 1 Registration Fee</span>
                        <span className="text-sm font-bold">500.00 Birr</span>
                      </div>
                      <div className="flex justify-between mb-2">
                        <span className="text-sm text-secondary">Semester 1 Tuition (Grade {studentForm.gradeLevel})</span>
                        <span className="text-sm font-bold">4,000.00 Birr</span>
                      </div>
                      <div className="divider" />
                      <div className="flex justify-between font-bold text-lg">
                        <span>Total Due</span>
                        <span className="text-primary-col">4,500.00 Birr</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* STEP 4: Success slip printing */}
              {step === 4 && enrollmentSlip && (
                <div className="flex-col gap-4">
                  <div className="alert alert-success">
                    🎉 Student successfully enrolled and linked to parent!
                  </div>

                  <div className="card" style={{ background: "var(--surface-sunken)", border: "2px dashed var(--surface-border)" }}>
                    <div className="card-header text-center" style={{ borderBottom: "1px dashed var(--surface-border)" }}>
                      <span className="card-title">🎓 EduCore Enrollment Receipt & Credentials Slip</span>
                    </div>
                    <div className="card-body flex-col gap-3">
                      <div className="flex justify-between">
                        <span className="text-xs text-muted">Admission Number</span>
                        <span className="text-sm font-bold badge badge-blue">{enrollmentSlip.student.admissionNumber}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-xs text-muted">Student Name</span>
                        <span className="text-sm font-bold">{enrollmentSlip.student.firstName} {enrollmentSlip.student.middleName} {enrollmentSlip.student.lastName}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-xs text-muted">Allocated Class</span>
                        <span className="text-sm font-bold">{enrollmentSlip.className}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-xs text-muted">Academic Stream</span>
                        <span className="text-sm font-bold">{enrollmentSlip.stream}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-xs text-muted">Parent / Guardian</span>
                        <span className="text-sm font-bold">{enrollmentSlip.parentName}</span>
                      </div>
                      <div className="divider" style={{ borderStyle: "dashed" }} />
                      <div className="flex justify-between">
                        <span className="text-xs text-muted">Student Username</span>
                        <span className="text-sm font-bold">{studentForm.username}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-xs text-muted">Student Default Password</span>
                        <span className="text-sm font-bold">student123</span>
                      </div>
                      <div className="divider" style={{ borderStyle: "dashed" }} />
                      <div className="flex justify-between">
                        <span className="text-xs text-muted">Tuition Fee Invoiced</span>
                        <span className="text-sm font-bold text-success">{enrollmentSlip.fees.toLocaleString()} Birr</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="modal-footer">
              {step < 4 ? (
                <>
                  <button className="btn btn-outline" onClick={closeWizard} disabled={loading}>Cancel</button>
                  {step > 1 && (
                    <button className="btn btn-outline" onClick={() => { setAlert(null); setStep(step - 1); }} disabled={loading}>Back</button>
                  )}
                  {step === 1 && (
                    <button className="btn btn-primary" onClick={handleNextStep1}>Next: Parent Linkage</button>
                  )}
                  {step === 2 && (
                    <button className="btn btn-primary" onClick={handleNextStep2}>Next: Class Allocation</button>
                  )}
                  {step === 3 && (
                    <button className="btn btn-primary" onClick={handleNextStep3} disabled={loading}>
                      {loading ? "Processing..." : "Complete Enrollment"}
                    </button>
                  )}
                </>
              ) : (
                <>
                  <button className="btn btn-outline" onClick={() => window.print()}>🖨️ Print Slip</button>
                  <button className="btn btn-primary" onClick={closeWizard}>Close Wizard</button>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </SidebarLayout>
  );
}
