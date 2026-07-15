"use client";

import React, { useEffect, useState } from "react";
import { api } from "../../services/api";
import SidebarLayout from "../../components/SidebarLayout";

export default function FinancePage() {
  const [students, setStudents] = useState<any[]>([]);
  const [ledger,   setLedger]   = useState<any[]>([]);
  const [selectedStudent, setSelectedStudent] = useState("");
  const [activeTab, setActiveTab] = useState<'ledger' | 'record' | 'create-fee'>('ledger');
  const [alert, setAlert] = useState<{ type: string; msg: string } | null>(null);

  // Forms
  const [feeForm, setFeeForm] = useState({ title: '', amount: '', gradeLevel: '', dueDate: '', academicYear: '2026-2027' });
  const [payForm, setPayForm] = useState({ studentId: '', feeId: '', amountPaid: '', paymentMethod: 'Cash', transactionReference: '' });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    api.getStudents().then(setStudents).catch(() => {});
  }, []);

  const loadLedger = async (sid: string) => {
    if (!sid) return;
    try {
      const data = await api.getStudentLedger(sid);
      setLedger(data);
    } catch (e: any) {
      setAlert({ type: 'error', msg: e.message });
    }
  };

  const handleStudentChange = (sid: string) => {
    setSelectedStudent(sid);
    setLedger([]);
    if (sid) loadLedger(sid);
  };

  const handleCreateFee = async () => {
    setSaving(true);
    try {
      await api.createFee({ ...feeForm, amount: Number(feeForm.amount), gradeLevel: feeForm.gradeLevel ? Number(feeForm.gradeLevel) : undefined });
      setAlert({ type: 'success', msg: 'Fee structure created!' });
      setFeeForm({ title: '', amount: '', gradeLevel: '', dueDate: '', academicYear: '2026-2027' });
    } catch (e: any) { setAlert({ type: 'error', msg: e.message }); }
    setSaving(false);
  };

  const handleRecordPayment = async () => {
    setSaving(true);
    try {
      const res = await api.recordPayment({ ...payForm, amountPaid: Number(payForm.amountPaid) });
      setAlert({ type: 'success', msg: `Payment recorded! Receipt: ${res.receiptNumber}` });
      if (selectedStudent) loadLedger(selectedStudent);
    } catch (e: any) { setAlert({ type: 'error', msg: e.message }); }
    setSaving(false);
  };

  const statusBadge = (s: string) => {
    const m: Record<string, string> = { Paid: 'badge-green', Partially_Paid: 'badge-amber', Unpaid: 'badge-red' };
    return m[s] || 'badge-gray';
  };

  return (
    <SidebarLayout activeId="finance">
      <header className="header">
        <div>
          <div className="header-title">Finance Management</div>
          <div className="header-sub">Fee structures, tuition payments, and student billing ledgers</div>
        </div>
      </header>

      <div className="page animate-fade-in">
        <div className="page-header">
          <div className="page-header-left">
            <h1 className="page-header-title">💰 Finance & Billing</h1>
            <p className="page-header-sub">Manage fee schedules, record bank transactions, generate receipts</p>
          </div>
        </div>

        {alert && (
          <div className={`alert alert-${alert.type} mb-4`}>
            {alert.type === 'success' ? '✅' : '⚠️'} {alert.msg}
            <button className="btn-ghost btn-xs ml-auto" onClick={() => setAlert(null)}>✕</button>
          </div>
        )}

        {/* Tabs */}
        <div className="chip-tabs mb-4">
          {(['ledger', 'record', 'create-fee'] as const).map(t => (
            <button key={t} className={`chip ${activeTab === t ? 'active' : ''}`} onClick={() => setActiveTab(t)}>
              {{ ledger: '📋 Student Ledger', record: '💳 Record Payment', 'create-fee': '➕ Create Fee' }[t]}
            </button>
          ))}
        </div>

        {/* Student Ledger Tab */}
        {activeTab === 'ledger' && (
          <div className="card animate-fade-in">
            <div className="card-header">
              <span className="card-title">📋 Student Billing Ledger</span>
            </div>
            <div className="card-body">
              <div className="form-group mb-4" style={{ maxWidth: 360 }}>
                <label className="form-label">Select Student</label>
                <select className="form-select" value={selectedStudent} onChange={e => handleStudentChange(e.target.value)}>
                  <option value="">— Select a student —</option>
                  {students.map(s => (
                    <option key={s.id} value={s.id}>{s.firstName} {s.middleName} {s.lastName} ({s.admissionNumber})</option>
                  ))}
                </select>
              </div>

              {ledger.length > 0 ? (
                <div className="table-wrap">
                  <table>
                    <thead>
                      <tr>
                        <th>Fee Title</th>
                        <th>Academic Year</th>
                        <th>Due Date</th>
                        <th style={{ textAlign: 'right' }}>Total (Birr)</th>
                        <th style={{ textAlign: 'right' }}>Paid (Birr)</th>
                        <th style={{ textAlign: 'right' }}>Balance (Birr)</th>
                        <th>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {ledger.map((l: any) => (
                        <tr key={l.feeId}>
                          <td className="td-name">{l.title}</td>
                          <td>{l.academicYear}</td>
                          <td>{new Date(l.dueDate).toLocaleDateString()}</td>
                          <td style={{ textAlign: 'right' }} className="font-bold">{Number(l.totalAmount).toLocaleString()}</td>
                          <td style={{ textAlign: 'right' }} className="text-success">{Number(l.amountPaid).toLocaleString()}</td>
                          <td style={{ textAlign: 'right' }} className={l.balance > 0 ? 'text-danger' : 'text-success'}>
                            {Number(l.balance).toLocaleString()}
                          </td>
                          <td><span className={`badge ${statusBadge(l.status)}`}>{l.status.replace('_', ' ')}</span></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : selectedStudent ? (
                <div className="empty-state">
                  <div className="empty-state-icon">📋</div>
                  <div className="empty-state-title">No fees found</div>
                  <div className="empty-state-desc">No fee records for this student yet.</div>
                </div>
              ) : null}
            </div>
          </div>
        )}

        {/* Record Payment Tab */}
        {activeTab === 'record' && (
          <div className="card animate-fade-in">
            <div className="card-header"><span className="card-title">💳 Record Tuition Payment</span></div>
            <div className="card-body">
              <div className="form-grid two-col">
                <div className="form-group">
                  <label className="form-label">Student <span className="form-required">*</span></label>
                  <select className="form-select" value={payForm.studentId} onChange={e => setPayForm(f => ({ ...f, studentId: e.target.value }))}>
                    <option value="">— Select Student —</option>
                    {students.map(s => <option key={s.id} value={s.id}>{s.firstName} {s.middleName} ({s.admissionNumber})</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Fee ID <span className="form-required">*</span></label>
                  <input className="form-input" placeholder="Paste Fee ID from fee list" value={payForm.feeId} onChange={e => setPayForm(f => ({ ...f, feeId: e.target.value }))} />
                </div>
                <div className="form-group">
                  <label className="form-label">Amount Paid (Birr) <span className="form-required">*</span></label>
                  <input type="number" className="form-input" placeholder="e.g. 4500" value={payForm.amountPaid} onChange={e => setPayForm(f => ({ ...f, amountPaid: e.target.value }))} />
                </div>
                <div className="form-group">
                  <label className="form-label">Payment Method <span className="form-required">*</span></label>
                  <select className="form-select" value={payForm.paymentMethod} onChange={e => setPayForm(f => ({ ...f, paymentMethod: e.target.value }))}>
                    <option value="Cash">Cash</option>
                    <option value="BankTransfer">Bank Transfer (CBE/Dashen/etc.)</option>
                    <option value="MobileMoney">Mobile Money (Telebirr/CBE Birr)</option>
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Transaction Reference</label>
                  <input className="form-input" placeholder="Bank/Telebirr transaction ID" value={payForm.transactionReference} onChange={e => setPayForm(f => ({ ...f, transactionReference: e.target.value }))} />
                  <span className="form-hint">Required for bank transfers for auditing</span>
                </div>
              </div>
              <div className="form-actions mt-4">
                <button className="btn btn-primary" onClick={handleRecordPayment} disabled={saving}>
                  {saving ? 'Saving...' : '💳 Process Payment & Generate Receipt'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Create Fee Tab */}
        {activeTab === 'create-fee' && (
          <div className="card animate-fade-in">
            <div className="card-header"><span className="card-title">➕ Create Fee Template</span></div>
            <div className="card-body">
              <div className="form-grid two-col">
                <div className="form-group">
                  <label className="form-label">Fee Title <span className="form-required">*</span></label>
                  <input className="form-input" placeholder="e.g. Grade 9 Tuition Semester 1" value={feeForm.title} onChange={e => setFeeForm(f => ({ ...f, title: e.target.value }))} />
                </div>
                <div className="form-group">
                  <label className="form-label">Amount (Birr) <span className="form-required">*</span></label>
                  <input type="number" className="form-input" placeholder="e.g. 4500" value={feeForm.amount} onChange={e => setFeeForm(f => ({ ...f, amount: e.target.value }))} />
                </div>
                <div className="form-group">
                  <label className="form-label">Grade Level (optional)</label>
                  <input type="number" className="form-input" placeholder="Leave blank for all grades" value={feeForm.gradeLevel} onChange={e => setFeeForm(f => ({ ...f, gradeLevel: e.target.value }))} />
                </div>
                <div className="form-group">
                  <label className="form-label">Due Date <span className="form-required">*</span></label>
                  <input type="date" className="form-input" value={feeForm.dueDate} onChange={e => setFeeForm(f => ({ ...f, dueDate: e.target.value }))} />
                </div>
                <div className="form-group">
                  <label className="form-label">Academic Year</label>
                  <input className="form-input" placeholder="e.g. 2026-2027" value={feeForm.academicYear} onChange={e => setFeeForm(f => ({ ...f, academicYear: e.target.value }))} />
                </div>
              </div>
              <div className="form-actions mt-4">
                <button className="btn btn-primary" onClick={handleCreateFee} disabled={saving}>
                  {saving ? 'Saving...' : '✅ Create Fee Template'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </SidebarLayout>
  );
}
