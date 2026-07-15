"use client";

import React, { useEffect, useState } from "react";
import { api } from "../../services/api";
import SidebarLayout from "../../components/SidebarLayout";

export default function LibraryPage() {
  const [books,       setBooks]       = useState<any[]>([]);
  const [borrowings,  setBorrowings]  = useState<any[]>([]);
  const [activeTab,   setActiveTab]   = useState<'books' | 'borrow' | 'returns'>('books');
  const [alert,       setAlert]       = useState<{ type: string; msg: string } | null>(null);
  const [loading,     setLoading]     = useState(false);

  // Forms
  const [bookForm, setBookForm] = useState({ title: '', author: '', isbn: '', publisher: '', quantity: 1 });
  const [borrowForm, setBorrowForm] = useState({ bookId: '', studentId: '', dueDate: '' });
  const [students, setStudents] = useState<any[]>([]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadBooks();
    loadBorrowings();
    api.getStudents().then(setStudents).catch(() => {});
  }, []);

  const loadBooks = async () => {
    setLoading(true);
    try { setBooks(await api.getBooks()); } catch { }
    setLoading(false);
  };

  const loadBorrowings = async () => {
    try { setBorrowings(await api.getActiveBorrowings()); } catch { }
  };

  const handleCreateBook = async () => {
    setSaving(true);
    try {
      await api.createBook({ ...bookForm, quantity: Number(bookForm.quantity) });
      setAlert({ type: 'success', msg: 'Book added to catalogue!' });
      setBookForm({ title: '', author: '', isbn: '', publisher: '', quantity: 1 });
      await loadBooks();
    } catch (e: any) { setAlert({ type: 'error', msg: e.message }); }
    setSaving(false);
  };

  const handleBorrow = async () => {
    setSaving(true);
    try {
      await api.borrowBook(borrowForm);
      setAlert({ type: 'success', msg: 'Book checkout registered!' });
      setBorrowForm({ bookId: '', studentId: '', dueDate: '' });
      await loadBooks();
      await loadBorrowings();
    } catch (e: any) { setAlert({ type: 'error', msg: e.message }); }
    setSaving(false);
  };

  const handleReturn = async (borrowingId: string) => {
    try {
      const res = await api.returnBook(borrowingId);
      setAlert({ type: 'success', msg: `Book returned! Fine: ${res.fineAmount} Birr` });
      await loadBorrowings();
      await loadBooks();
    } catch (e: any) { setAlert({ type: 'error', msg: e.message }); }
  };

  return (
    <SidebarLayout activeId="library">
      <header className="header">
        <div>
          <div className="header-title">Library Management</div>
          <div className="header-sub">Book catalogue, checkouts, returns, and overdue fines</div>
        </div>
      </header>

      <div className="page animate-fade-in">
        <div className="page-header">
          <div className="page-header-left">
            <h1 className="page-header-title">📚 Library</h1>
            <p className="page-header-sub">{books.length} books in catalogue · {borrowings.length} active borrowings</p>
          </div>
        </div>

        {alert && (
          <div className={`alert alert-${alert.type} mb-4`}>
            {alert.type === 'success' ? '✅' : '⚠️'} {alert.msg}
            <button className="btn-ghost btn-xs ml-auto" onClick={() => setAlert(null)}>✕</button>
          </div>
        )}

        <div className="chip-tabs mb-4">
          {(['books', 'borrow', 'returns'] as const).map(t => (
            <button key={t} className={`chip ${activeTab === t ? 'active' : ''}`} onClick={() => setActiveTab(t)}>
              {{ books: '📖 Catalogue', borrow: '📤 Issue Book', returns: '📥 Returns & Fines' }[t]}
            </button>
          ))}
        </div>

        {/* Books Catalogue */}
        {activeTab === 'books' && (
          <div className="content-grid sidebar-layout animate-fade-in">
            <div className="card">
              <div className="card-header">
                <span className="card-title">📖 Book Inventory</span>
                <span className="badge badge-blue">{books.length} titles</span>
              </div>
              <div className="table-wrap">
                {books.length === 0 ? (
                  <div className="empty-state">
                    <div className="empty-state-icon">📚</div>
                    <div className="empty-state-title">No books catalogued</div>
                    <div className="empty-state-desc">Add books to start the library catalogue.</div>
                  </div>
                ) : (
                  <table>
                    <thead>
                      <tr>
                        <th>Title</th>
                        <th>Author</th>
                        <th>ISBN</th>
                        <th style={{ textAlign: 'center' }}>Total</th>
                        <th style={{ textAlign: 'center' }}>Available</th>
                      </tr>
                    </thead>
                    <tbody>
                      {books.map(b => (
                        <tr key={b.id}>
                          <td className="td-name">{b.title}</td>
                          <td className="text-secondary">{b.author}</td>
                          <td><span className="badge badge-gray">{b.isbn || '—'}</span></td>
                          <td style={{ textAlign: 'center' }}>{b.quantity}</td>
                          <td style={{ textAlign: 'center' }}>
                            <span className={`badge ${b.availableQuantity > 0 ? 'badge-green' : 'badge-red'}`}>
                              {b.availableQuantity}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            </div>
            <div className="card">
              <div className="card-header"><span className="card-title">➕ Add New Book</span></div>
              <div className="card-body flex-col gap-3">
                <div className="form-group">
                  <label className="form-label">Title <span className="form-required">*</span></label>
                  <input className="form-input" placeholder="e.g. Introduction to Calculus" value={bookForm.title} onChange={e => setBookForm(f => ({ ...f, title: e.target.value }))} />
                </div>
                <div className="form-group">
                  <label className="form-label">Author <span className="form-required">*</span></label>
                  <input className="form-input" placeholder="e.g. James Stewart" value={bookForm.author} onChange={e => setBookForm(f => ({ ...f, author: e.target.value }))} />
                </div>
                <div className="form-group">
                  <label className="form-label">ISBN</label>
                  <input className="form-input" placeholder="978-..." value={bookForm.isbn} onChange={e => setBookForm(f => ({ ...f, isbn: e.target.value }))} />
                </div>
                <div className="form-group">
                  <label className="form-label">Publisher</label>
                  <input className="form-input" placeholder="Publisher name" value={bookForm.publisher} onChange={e => setBookForm(f => ({ ...f, publisher: e.target.value }))} />
                </div>
                <div className="form-group">
                  <label className="form-label">Quantity <span className="form-required">*</span></label>
                  <input type="number" className="form-input" min={1} value={bookForm.quantity} onChange={e => setBookForm(f => ({ ...f, quantity: parseInt(e.target.value) || 1 }))} />
                </div>
                <button className="btn btn-primary" onClick={handleCreateBook} disabled={saving}>
                  {saving ? 'Adding...' : '📚 Add to Catalogue'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Issue Book */}
        {activeTab === 'borrow' && (
          <div className="card animate-fade-in" style={{ maxWidth: 560 }}>
            <div className="card-header"><span className="card-title">📤 Issue Book to Student</span></div>
            <div className="card-body flex-col gap-3">
              <div className="form-group">
                <label className="form-label">Book <span className="form-required">*</span></label>
                <select className="form-select" value={borrowForm.bookId} onChange={e => setBorrowForm(f => ({ ...f, bookId: e.target.value }))}>
                  <option value="">— Select Book —</option>
                  {books.filter(b => b.availableQuantity > 0).map(b => (
                    <option key={b.id} value={b.id}>{b.title} by {b.author} ({b.availableQuantity} available)</option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Student <span className="form-required">*</span></label>
                <select className="form-select" value={borrowForm.studentId} onChange={e => setBorrowForm(f => ({ ...f, studentId: e.target.value }))}>
                  <option value="">— Select Student —</option>
                  {students.map(s => <option key={s.id} value={s.id}>{s.firstName} {s.middleName} ({s.admissionNumber})</option>)}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Due Date <span className="form-required">*</span></label>
                <input type="date" className="form-input" value={borrowForm.dueDate} onChange={e => setBorrowForm(f => ({ ...f, dueDate: e.target.value }))} />
              </div>
              <button className="btn btn-primary mt-2" onClick={handleBorrow} disabled={saving}>
                {saving ? 'Issuing...' : '📤 Issue Book'}
              </button>
            </div>
          </div>
        )}

        {/* Returns */}
        {activeTab === 'returns' && (
          <div className="card animate-fade-in">
            <div className="card-header">
              <span className="card-title">📥 Active Borrowings</span>
              <span className="badge badge-amber">{borrowings.length} outstanding</span>
            </div>
            <div className="table-wrap">
              {borrowings.length === 0 ? (
                <div className="empty-state">
                  <div className="empty-state-icon">📥</div>
                  <div className="empty-state-title">No active borrowings</div>
                </div>
              ) : (
                <table>
                  <thead>
                    <tr>
                      <th>Book</th>
                      <th>Borrower</th>
                      <th>Borrow Date</th>
                      <th>Due Date</th>
                      <th>Status</th>
                      <th>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {borrowings.map(b => {
                      const overdue = new Date(b.dueDate) < new Date();
                      return (
                        <tr key={b.id}>
                          <td className="td-name">{b.book?.title}</td>
                          <td>{b.student ? `${b.student.firstName} ${b.student.lastName}` : b.teacher ? `${b.teacher.firstName} ${b.teacher.lastName}` : '—'}</td>
                          <td>{new Date(b.borrowDate).toLocaleDateString()}</td>
                          <td>{new Date(b.dueDate).toLocaleDateString()}</td>
                          <td>
                            <span className={`badge ${overdue ? 'badge-red' : 'badge-amber'}`}>
                              {overdue ? '⚠️ Overdue' : '📤 Borrowed'}
                            </span>
                          </td>
                          <td>
                            <button className="btn btn-outline btn-xs" onClick={() => handleReturn(b.id)}>
                              📥 Return
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        )}
      </div>
    </SidebarLayout>
  );
}
