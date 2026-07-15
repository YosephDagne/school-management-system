"use client";

import React, { useEffect, useState } from "react";
import SidebarLayout from "../../components/SidebarLayout";
import { api } from "../../services/api";

interface Student {
  id: string;
  admissionNumber: string;
  firstName: string;
  middleName: string;
  lastName: string;
  class?: { name: string; gradeLevel: number };
  classId: string;
}

interface Fee {
  id: string;
  title: string;
  amount: number;
  gradeLevel?: number;
  academicYear: string;
  dueDate: string;
}

interface LedgerRecord {
  feeId: string;
  title: string;
  totalAmount: number;
  dueDate: string;
  academicYear: string;
  amountPaid: number;
  balance: number;
  status: "Unpaid" | "Paid" | "Partially_Paid";
  payments: any[];
}

export default function FinancePage() {
  const [students, setStudents] = useState<Student[]>([]);
  const [fees, setFees] = useState<Fee[]>([]);
  const [ledger, setLedger] = useState<LedgerRecord[]>([]);
  const [selectedStudentId, setSelectedStudentId] = useState("");
  const [activeTab, setActiveTab] = useState<"ledger" | "collect" | "fees">("ledger");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [alert, setAlert] = useState<{ type: "success" | "error"; msg: string } | null>(null);

  const [feeForm, setFeeForm] = useState({
    title: "First Semester Tuition",
    amount: "4500",
    gradeLevel: "9",
    dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
    academicYear: "2026-2027",
  });

  const [payForm, setPayForm] = useState({
    studentId: "",
    feeId: "",
    amountPaid: "",
    paymentMethod: "Telebirr",
    transactionReference: "",
  });

  useEffect(() => {
    loadBaseData();
  }, []);

  useEffect(() => {
    if (selectedStudentId) {
      loadStudentLedger(selectedStudentId);
    } else {
      setLedger([]);
    }
  }, [selectedStudentId]);

  async function loadBaseData() {
    setLoading(true);
    try {
      const [sList, fList] = await Promise.all([
        api.getStudents(),
        api.getFees(),
      ]);
      setStudents(sList);
      setFees(fList);
      if (sList.length > 0) {
        setSelectedStudentId(sList[0].id);
      }
    } catch (e: any) {
      setAlert({ type: "error", msg: e.message || "Failed to load database records." });
    } finally {
      setLoading(false);
    }
  }

  async function loadStudentLedger(studentId: string) {
    setLoading(true);
    setAlert(null);
    try {
      const data = await api.getStudentLedger(studentId);
      setLedger(data);
    } catch (e: any) {
      setAlert({ type: "error", msg: e.message || "Failed to fetch student ledger." });
      setLedger([]);
    } finally {
      setLoading(false);
    }
  }

  const handleCreateFee = async (e: React.FormEvent) => {
    e.preventDefault();
    setAlert(null);
    setSaving(true);
    try {
      await api.createFee({
        title: feeForm.title,
        amount: Number(feeForm.amount),
        gradeLevel: feeForm.gradeLevel ? Number(feeForm.gradeLevel) : undefined,
        dueDate: new Date(feeForm.dueDate),
        academicYear: feeForm.academicYear,
      });
      setAlert({ type: "success", msg: `Fee template "${feeForm.title}" successfully saved!` });
      setFeeForm({
        title: "Semester Tuition",
        amount: "4500",
        gradeLevel: "9",
        dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
        academicYear: "2026-2027",
      });
      const fList = await api.getFees();
      setFees(fList);
      setActiveTab("fees");
    } catch (e: any) {
      setAlert({ type: "error", msg: e.message || "Failed to create fee template." });
    } finally {
      setSaving(false);
    }
  };

  const handleCollectPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    setAlert(null);
    if (!payForm.studentId || !payForm.feeId || !payForm.amountPaid) {
      setAlert({ type: "error", msg: "Please fill in all required payment details." });
      return;
    }
    setSaving(true);
    try {
      await api.recordPayment({
        studentId: payForm.studentId,
        feeId: payForm.feeId,
        amountPaid: Number(payForm.amountPaid),
        paymentMethod: payForm.paymentMethod,
        transactionReference: payForm.transactionReference || undefined,
      });
      setAlert({ type: "success", msg: "Payment processed successfully. Balance updated!" });
      const studentIdToReload = payForm.studentId;
      setPayForm({
        studentId: "",
        feeId: "",
        amountPaid: "",
        paymentMethod: "Telebirr",
        transactionReference: "",
      });
      setSelectedStudentId(studentIdToReload);
      await loadStudentLedger(studentIdToReload);
      setActiveTab("ledger");
    } catch (e: any) {
      setAlert({ type: "error", msg: e.message || "Failed to record payment transaction." });
    } finally {
      setSaving(false);
    }
  };

  const statusBadge = (status: string) => {
    if (status === "Paid") return "badge-green";
    if (status === "Partially_Paid") return "badge-amber";
    return "badge-red";
  };

  const activeStudent = students.find((s) => s.id === payForm.studentId);
  const studentGrade = activeStudent?.class?.gradeLevel;
  const filteredFees = fees.filter(
    (f) => f.gradeLevel === null || f.gradeLevel === undefined || f.gradeLevel === studentGrade
  );

  const totalBilled = ledger.reduce((sum, item) => sum + item.totalAmount, 0);
  const totalPaid = ledger.reduce((sum, item) => sum + item.amountPaid, 0);
  const totalOutstanding = ledger.reduce((sum, item) => sum + item.balance, 0);

  return (
    <SidebarLayout activeId="finance">
      <div className="page animate-fade-in" style={{ padding: "28px" }}>
        <div style={{ marginBottom: "24px" }}>
          <div style={{ fontSize: "18px", fontWeight: "bold", color: "#111111" }}>School Financial Accounts</div>
          <div style={{ fontSize: "12.5px", color: "#888888", marginTop: "4px" }}>
            Home - <span style={{ color: "var(--color-primary)" }}>{activeTab === "ledger" ? "Student Ledger" : activeTab === "collect" ? "Record Payment" : "Setup Fees"}</span>
          </div>
        </div>

        <div className="chip-tabs mb-4" style={{ display: "flex", gap: "10px", borderBottom: "1px solid #e0e0e0", paddingBottom: "10px" }}>
          <button className={`chip ${activeTab === "ledger" ? "active" : ""}`} onClick={() => setActiveTab("ledger")}>💰 Student Ledger</button>
          <button className={`chip ${activeTab === "collect" ? "active" : ""}`} onClick={() => setActiveTab("collect")}>📥 Record Payment</button>
          <button className={`chip ${activeTab === "fees" ? "active" : ""}`} onClick={() => setActiveTab("fees")}>⚙️ Fees Structure Setup</button>
        </div>

        {alert && (
          <div className={`alert alert-${alert.type} mb-4`} style={{
            padding: "12px 16px",
            borderRadius: "6px",
            background: alert.type === "success" ? "#d1fae5" : "#fee2e2",
            color: alert.type === "success" ? "#065f46" : "#991b1b",
            fontSize: "13px",
            display: "flex",
            justifyContent: "space-between"
          }}>
            <span>{alert.type === "success" ? "✅" : "⚠️"} {alert.msg}</span>
            <button style={{ fontWeight: "bold" }} onClick={() => setAlert(null)}>✕</button>
          </div>
        )}

        {activeTab === "ledger" && (
          <div className="flex-col gap-4">
            <div className="card" style={{ padding: "20px" }}>
              <div className="form-group" style={{ maxWidth: "360px" }}>
                <label className="form-label">Search Student Ledger</label>
                <select
                  className="form-select"
                  value={selectedStudentId}
                  onChange={(e) => setSelectedStudentId(e.target.value)}
                  style={{ background: "#f8f9fa", border: "1px solid #e0e0e0" }}
                >
                  <option value="">— Select Student —</option>
                  {students.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.firstName} {s.middleName} {s.lastName} ({s.admissionNumber})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {selectedStudentId && (
              <div style={{ display: "grid", gridTemplateColumns: "1fr 300px", gap: "20px" }}>
                <div className="card">
                  <div className="card-header"><span className="card-title">Invoices & Payments Breakdown</span></div>
                  <div className="card-body" style={{ padding: "0" }}>
                    {loading ? (
                      <div style={{ padding: "40px", textAlign: "center" }}>
                        <div className="spinner" style={{ margin: "0 auto 12px" }} />
                        <div>Loading ledger details...</div>
                      </div>
                    ) : ledger.length === 0 ? (
                      <div style={{ padding: "40px", textAlign: "center" }}>
                        <div style={{ fontSize: "48px" }}>💰</div>
                        <div style={{ fontWeight: "bold", fontSize: "16px", marginTop: "12px" }}>No Invoiced Fees Found</div>
                        <div style={{ color: "#777", fontSize: "13px" }}>There are no billed items applicable to this student's grade level.</div>
                      </div>
                    ) : (
                      <div className="table-wrap">
                        <table>
                          <thead>
                            <tr>
                              <th>Fee Billed</th>
                              <th>Billed Year</th>
                              <th>Billed (Birr)</th>
                              <th>Paid (Birr)</th>
                              <th>Balance (Birr)</th>
                              <th>Due Date</th>
                              <th>Status</th>
                            </tr>
                          </thead>
                          <tbody>
                            {ledger.map((item) => (
                              <tr key={item.feeId}>
                                <td className="td-name">💰 {item.title}</td>
                                <td>{item.academicYear}</td>
                                <td style={{ fontWeight: "bold" }}>{item.totalAmount.toLocaleString()}</td>
                                <td className="text-success">{item.amountPaid.toLocaleString()}</td>
                                <td className={item.balance > 0 ? "text-danger" : "text-success"}>{item.balance.toLocaleString()}</td>
                                <td>{new Date(item.dueDate).toLocaleDateString()}</td>
                                <td>
                                  <span className={`badge ${statusBadge(item.status)}`}>
                                    {item.status.replace("_", " ")}
                                  </span>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                </div>

                <div className="card" style={{ height: "fit-content" }}>
                  <div className="card-header"><span className="card-title">Summary Standings</span></div>
                  <div className="card-body flex-col gap-4">
                    <div className="flex justify-between">
                      <span style={{ color: "#666", fontSize: "13px" }}>Total Invoiced</span>
                      <span style={{ fontWeight: "bold" }}>{totalBilled.toLocaleString()} Birr</span>
                    </div>
                    <div className="flex justify-between">
                      <span style={{ color: "#666", fontSize: "13px" }}>Total Payments</span>
                      <span style={{ fontWeight: "bold", color: "var(--color-success)" }}>{totalPaid.toLocaleString()} Birr</span>
                    </div>
                    <div style={{ borderBottom: "1px solid #e0e0e0", margin: "8px 0" }} />
                    <div className="flex justify-between" style={{ fontSize: "16px", fontWeight: "bold" }}>
                      <span>Net Balance Due</span>
                      <span style={{ color: totalOutstanding > 0 ? "var(--color-danger)" : "var(--color-success)" }}>
                        {totalOutstanding.toLocaleString()} Birr
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === "collect" && (
          <div className="card">
            <div className="card-header">
              <span className="card-title" style={{ fontSize: "16px", fontWeight: "bold" }}>Payment Collection Desk</span>
            </div>
            <div className="card-body" style={{ padding: "28px" }}>
              <form onSubmit={handleCollectPayment}>
                <div style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
                  gap: "20px",
                  marginBottom: "24px"
                }}>
                  <div className="form-group">
                    <label className="form-label">Student Profile <span className="form-required">*</span></label>
                    <select
                      className="form-select"
                      value={payForm.studentId}
                      onChange={(e) => setPayForm({ ...payForm, studentId: e.target.value, feeId: "" })}
                      required
                    >
                      <option value="">— Select Student —</option>
                      {students.map((s) => (
                        <option key={s.id} value={s.id}>
                          {s.firstName} {s.middleName} {s.lastName} (Grade {s.class?.gradeLevel || "9"})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="form-group">
                    <label className="form-label">Select Bill Template <span className="form-required">*</span></label>
                    <select
                      className="form-select"
                      value={payForm.feeId}
                      onChange={(e) => {
                        const feeObj = filteredFees.find((f) => f.id === e.target.value);
                        setPayForm({ ...payForm, feeId: e.target.value, amountPaid: feeObj ? String(feeObj.amount) : "" });
                      }}
                      disabled={!payForm.studentId}
                      required
                    >
                      <option value="">— Select Fee Template —</option>
                      {filteredFees.map((f) => (
                        <option key={f.id} value={f.id}>
                          {f.title} ({f.amount.toLocaleString()} Birr)
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="form-group">
                    <label className="form-label">Amount Paid (Birr) <span className="form-required">*</span></label>
                    <input
                      type="number"
                      className="form-input"
                      value={payForm.amountPaid}
                      onChange={(e) => setPayForm({ ...payForm, amountPaid: e.target.value })}
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Payment Gateway <span className="form-required">*</span></label>
                    <select
                      className="form-select"
                      value={payForm.paymentMethod}
                      onChange={(e) => setPayForm({ ...payForm, paymentMethod: e.target.value })}
                      required
                    >
                      <option value="Telebirr">Telebirr</option>
                      <option value="CBE Birr">CBE Mobile Banking</option>
                      <option value="CBE Transfer">CBE Direct Transfer</option>
                      <option value="Cash">Cash Receipt</option>
                    </select>
                  </div>

                  <div className="form-group">
                    <label className="form-label">Txn reference No. / Bank Slip Code</label>
                    <input
                      type="text"
                      className="form-input"
                      placeholder="e.g. FT2623348892"
                      value={payForm.transactionReference}
                      onChange={(e) => setPayForm({ ...payForm, transactionReference: e.target.value })}
                    />
                  </div>
                </div>

                <div style={{ display: "flex", gap: "10px" }}>
                  <button
                    type="submit"
                    className="btn btn-primary"
                    disabled={saving}
                    style={{ background: "#ffae01", color: "#111", fontWeight: "bold" }}
                  >
                    {saving ? "Recording..." : "Record Payment Transaction"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {activeTab === "fees" && (
          <div style={{ display: "grid", gridTemplateColumns: "1fr 340px", gap: "20px" }}>
            <div className="card">
              <div className="card-header"><span className="card-title">Fee Catalogues list</span></div>
              <div className="card-body" style={{ padding: "0" }}>
                <div className="table-wrap">
                  <table>
                    <thead>
                      <tr>
                        <th>Fee Title</th>
                        <th>Grade Target</th>
                        <th>Standard Cost</th>
                        <th>Billed Year</th>
                        <th>Due Date</th>
                      </tr>
                    </thead>
                    <tbody>
                      {fees.map((f) => (
                        <tr key={f.id}>
                          <td className="td-name">💰 {f.title}</td>
                          <td>
                            <span className="badge badge-teal">
                              {f.gradeLevel ? `Grade ${f.gradeLevel}` : "All Grades"}
                            </span>
                          </td>
                          <td style={{ fontWeight: "bold" }}>{f.amount.toLocaleString()} Birr</td>
                          <td>{f.academicYear}</td>
                          <td>{new Date(f.dueDate).toLocaleDateString()}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            <div className="card" style={{ height: "fit-content" }}>
              <div className="card-header"><span className="card-title">Create Fee Template</span></div>
              <div className="card-body">
                <form onSubmit={handleCreateFee}>
                  <div className="flex-col gap-4">
                    <div className="form-group">
                      <label className="form-label">Fee Title</label>
                      <input
                        type="text"
                        className="form-input"
                        value={feeForm.title}
                        onChange={(e) => setFeeForm({ ...feeForm, title: e.target.value })}
                        required
                      />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Cost Amount (Birr)</label>
                      <input
                        type="number"
                        className="form-input"
                        value={feeForm.amount}
                        onChange={(e) => setFeeForm({ ...feeForm, amount: e.target.value })}
                        required
                      />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Target Grade Level</label>
                      <select
                        className="form-select"
                        value={feeForm.gradeLevel}
                        onChange={(e) => setFeeForm({ ...feeForm, gradeLevel: e.target.value })}
                      >
                        <option value="">All Grades</option>
                        <option value="9">Grade 9</option>
                        <option value="10">Grade 10</option>
                        <option value="11">Grade 11</option>
                        <option value="12">Grade 12</option>
                      </select>
                    </div>
                    <div className="form-group">
                      <label className="form-label">Due Date</label>
                      <input
                        type="date"
                        className="form-input"
                        value={feeForm.dueDate}
                        onChange={(e) => setFeeForm({ ...feeForm, dueDate: e.target.value })}
                        required
                      />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Academic Year</label>
                      <input
                        type="text"
                        className="form-input"
                        value={feeForm.academicYear}
                        onChange={(e) => setFeeForm({ ...feeForm, academicYear: e.target.value })}
                        required
                      />
                    </div>

                    <button
                      type="submit"
                      className="btn btn-primary w-full"
                      disabled={saving}
                      style={{ background: "#ffae01", color: "#111", fontWeight: "bold" }}
                    >
                      {saving ? "Saving..." : "Save Fee Schedule"}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}
      </div>
    </SidebarLayout>
  );
}
