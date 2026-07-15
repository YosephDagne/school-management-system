"use client";

import React, { useEffect, useState } from "react";
import SidebarLayout from "../../components/SidebarLayout";
import { api } from "../../services/api";

interface Book {
  id: string;
  title: string;
  author: string;
  isbn: string;
  quantity: number;
  createdAt: string;
}

interface Student {
  id: string;
  admissionNumber: string;
  firstName: string;
  middleName: string;
  lastName: string;
}

interface Teacher {
  id: string;
  employeeId: string;
  firstName: string;
  lastName: string;
}

interface Borrowing {
  id: string;
  bookId: string;
  studentId?: string;
  teacherId?: string;
  borrowDate: string;
  dueDate: string;
  returnDate?: string;
  status: string;
  book?: Book;
  student?: Student;
  teacher?: Teacher;
}

export default function LibraryPage() {
  const [books, setBooks] = useState<Book[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [borrowings, setBorrowings] = useState<Borrowing[]>([]);
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState<"catalog" | "issue" | "borrowings">("catalog");
  const [alert, setAlert] = useState<{ type: "success" | "error"; msg: string } | null>(null);

  // Add Book Form state
  const [bookForm, setBookForm] = useState({
    title: "",
    author: "",
    isbn: "",
    quantity: "5",
  });

  // Issue Book Form state
  const [issueForm, setIssueForm] = useState({
    bookId: "",
    borrowerType: "Student",
    studentId: "",
    teacherId: "",
    dueDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
  });

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    setLoading(true);
    try {
      const [bList, sList, tList, brList] = await Promise.all([
        api.getBooks(),
        api.getStudents(),
        api.getTeachers(),
        api.getActiveBorrowings(),
      ]);
      setBooks(bList);
      setStudents(sList);
      setTeachers(tList);
      setBorrowings(brList);
    } catch (e: any) {
      setAlert({ type: "error", msg: e.message || "Failed to load library data." });
    } finally {
      setLoading(false);
    }
  }

  const handleCreateBook = async (e: React.FormEvent) => {
    e.preventDefault();
    setAlert(null);
    setSaving(true);
    try {
      await api.createBook({
        title: bookForm.title,
        author: bookForm.author,
        isbn: bookForm.isbn,
        quantity: Number(bookForm.quantity),
      });
      setAlert({ type: "success", msg: `Book "${bookForm.title}" successfully added to catalog!` });
      setBookForm({ title: "", author: "", isbn: "", quantity: "5" });
      await loadData();
    } catch (e: any) {
      setAlert({ type: "error", msg: e.message || "Failed to catalog book." });
    } finally {
      setSaving(false);
    }
  };

  const handleIssueBook = async (e: React.FormEvent) => {
    e.preventDefault();
    setAlert(null);
    if (!issueForm.bookId || !issueForm.dueDate) {
      setAlert({ type: "error", msg: "Please select a book and return due date." });
      return;
    }
    if (issueForm.borrowerType === "Student" && !issueForm.studentId) {
      setAlert({ type: "error", msg: "Please select a student borrower." });
      return;
    }
    if (issueForm.borrowerType === "Teacher" && !issueForm.teacherId) {
      setAlert({ type: "error", msg: "Please select a teacher borrower." });
      return;
    }

    setSaving(true);
    try {
      await api.borrowBook({
        bookId: issueForm.bookId,
        studentId: issueForm.borrowerType === "Student" ? issueForm.studentId : undefined,
        teacherId: issueForm.borrowerType === "Teacher" ? issueForm.teacherId : undefined,
        dueDate: new Date(issueForm.dueDate),
      });
      setAlert({ type: "success", msg: "Book successfully checked out and issued!" });
      setIssueForm({
        bookId: "",
        borrowerType: "Student",
        studentId: "",
        teacherId: "",
        dueDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
      });
      await loadData();
      setActiveTab("borrowings");
    } catch (e: any) {
      setAlert({ type: "error", msg: e.message || "Failed to check out book." });
    } finally {
      setSaving(false);
    }
  };

  const handleReturnBook = async (borrowingId: string) => {
    setAlert(null);
    setLoading(true);
    try {
      await api.returnBook(borrowingId);
      setAlert({ type: "success", msg: "Book returned and library catalog inventory incremented!" });
      await loadData();
    } catch (e: any) {
      setAlert({ type: "error", msg: e.message || "Failed to return book." });
    } finally {
      setLoading(false);
    }
  };

  const isOverdue = (dueDate: string) => {
    return new Date(dueDate) < new Date() && new Date(dueDate).toDateString() !== new Date().toDateString();
  };

  return (
    <SidebarLayout activeId="library">
      <div className="page animate-fade-in" style={{ padding: "28px" }}>
        {/* Breadcrumbs */}
        <div style={{ marginBottom: "24px" }}>
          <div style={{ fontSize: "18px", fontWeight: "bold", color: "#111111" }}>Library Administration Desk</div>
          <div style={{ fontSize: "12.5px", color: "#888888", marginTop: "4px" }}>
            Home - <span style={{ color: "var(--color-primary)" }}>{activeTab === "catalog" ? "Book Catalog" : activeTab === "issue" ? "Issue Desk" : "Active Borrowings"}</span>
          </div>
        </div>

        {/* Tab Selection */}
        <div className="chip-tabs mb-4" style={{ display: "flex", gap: "10px", borderBottom: "1px solid #e0e0e0", paddingBottom: "10px" }}>
          <button
            className={`chip ${activeTab === "catalog" ? "active" : ""}`}
            onClick={() => { setActiveTab("catalog"); setAlert(null); }}
            style={{
              padding: "8px 16px",
              borderRadius: "4px",
              background: activeTab === "catalog" ? "var(--color-secondary)" : "#e0e0e0",
              color: activeTab === "catalog" ? "#ffffff" : "#333333",
              fontWeight: "600",
              fontSize: "13px"
            }}
          >
            📚 Catalog Books
          </button>
          <button
            className={`chip ${activeTab === "issue" ? "active" : ""}`}
            onClick={() => { setActiveTab("issue"); setAlert(null); }}
            style={{
              padding: "8px 16px",
              borderRadius: "4px",
              background: activeTab === "issue" ? "var(--color-secondary)" : "#e0e0e0",
              color: activeTab === "issue" ? "#ffffff" : "#333333",
              fontWeight: "600",
              fontSize: "13px"
            }}
          >
            📥 Issue Book Checkout
          </button>
          <button
            className={`chip ${activeTab === "borrowings" ? "active" : ""}`}
            onClick={() => { setActiveTab("borrowings"); setAlert(null); }}
            style={{
              padding: "8px 16px",
              borderRadius: "4px",
              background: activeTab === "borrowings" ? "var(--color-secondary)" : "#e0e0e0",
              color: activeTab === "borrowings" ? "#ffffff" : "#333333",
              fontWeight: "600",
              fontSize: "13px"
            }}
          >
            📋 Active Borrowings
          </button>
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

        {/* BOOK CATALOG TAB */}
        {activeTab === "catalog" && (
          <div style={{ display: "grid", gridTemplateColumns: "1fr 340px", gap: "20px" }}>
            {/* Catalog list */}
            <div className="card">
              <div className="card-header"><span className="card-title">Indexed Books Catalog</span></div>
              <div className="card-body" style={{ padding: "0" }}>
                <div className="table-wrap">
                  {books.length === 0 ? (
                    <div style={{ padding: "40px", textAlign: "center", color: "#888" }}>No books cataloged yet.</div>
                  ) : (
                    <table>
                      <thead>
                        <tr>
                          <th>Book Title</th>
                          <th>Author</th>
                          <th>ISBN Code</th>
                          <th>Available Stock</th>
                          <th>Catalog Date</th>
                        </tr>
                      </thead>
                      <tbody>
                        {books.map((b) => (
                          <tr key={b.id}>
                            <td className="td-name">📚 {b.title}</td>
                            <td>{b.author}</td>
                            <td><span className="badge badge-gray">{b.isbn}</span></td>
                            <td style={{ fontWeight: "bold" }}>{b.quantity} copies</td>
                            <td>{new Date(b.createdAt).toLocaleDateString()}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </div>
              </div>
            </div>

            {/* Catalog form */}
            <div className="card" style={{ height: "fit-content" }}>
              <div className="card-header"><span className="card-title">Catalog New Book</span></div>
              <div className="card-body">
                <form onSubmit={handleCreateBook}>
                  <div className="flex-col gap-4">
                    <div className="form-group">
                      <label className="form-label">Book Title <span className="form-required">*</span></label>
                      <input
                        type="text"
                        className="form-input"
                        placeholder="e.g. Intro to Calculus"
                        value={bookForm.title}
                        onChange={(e) => setBookForm({ ...bookForm, title: e.target.value })}
                        required
                      />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Author Name <span className="form-required">*</span></label>
                      <input
                        type="text"
                        className="form-input"
                        placeholder="e.g. Isaac Newton"
                        value={bookForm.author}
                        onChange={(e) => setBookForm({ ...bookForm, author: e.target.value })}
                        required
                      />
                    </div>
                    <div className="form-group">
                      <label className="form-label">ISBN Reference Code <span className="form-required">*</span></label>
                      <input
                        type="text"
                        className="form-input"
                        placeholder="e.g. 978-3-16-148410-0"
                        value={bookForm.isbn}
                        onChange={(e) => setBookForm({ ...bookForm, isbn: e.target.value })}
                        required
                      />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Inventory Quantity</label>
                      <input
                        type="number"
                        className="form-input"
                        value={bookForm.quantity}
                        onChange={(e) => setBookForm({ ...bookForm, quantity: e.target.value })}
                        min={1}
                        required
                      />
                    </div>

                    <button
                      type="submit"
                      className="btn btn-primary w-full"
                      disabled={saving}
                      style={{ background: "#ffae01", color: "#111", fontWeight: "bold" }}
                    >
                      {saving ? "Saving..." : "Add to Library"}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}

        {/* ISSUE CHECKOUT TAB */}
        {activeTab === "issue" && (
          <div className="card">
            <div className="card-header">
              <span className="card-title" style={{ fontSize: "16px", fontWeight: "bold" }}>Issue Book Checkout Desk</span>
            </div>
            <div className="card-body" style={{ padding: "28px" }}>
              <form onSubmit={handleIssueBook}>
                <div style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
                  gap: "20px",
                  marginBottom: "24px"
                }}>
                  {/* Select Book */}
                  <div className="form-group">
                    <label className="form-label">Select Book <span className="form-required">*</span></label>
                    <select
                      className="form-select"
                      value={issueForm.bookId}
                      onChange={(e) => setIssueForm({ ...issueForm, bookId: e.target.value })}
                      required
                    >
                      <option value="">— Select Book —</option>
                      {books.filter((b) => b.quantity > 0).map((b) => (
                        <option key={b.id} value={b.id}>
                          {b.title} (by {b.author}) [Stock: {b.quantity}]
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Select Borrower Type */}
                  <div className="form-group">
                    <label className="form-label">Borrower Type <span className="form-required">*</span></label>
                    <select
                      className="form-select"
                      value={issueForm.borrowerType}
                      onChange={(e) => setIssueForm({ ...issueForm, borrowerType: e.target.value, studentId: "", teacherId: "" })}
                      required
                    >
                      <option value="Student">Student</option>
                      <option value="Teacher">Teacher</option>
                    </select>
                  </div>

                  {/* Select Student Borrower */}
                  {issueForm.borrowerType === "Student" && (
                    <div className="form-group">
                      <label className="form-label">Select Student <span className="form-required">*</span></label>
                      <select
                        className="form-select"
                        value={issueForm.studentId}
                        onChange={(e) => setIssueForm({ ...issueForm, studentId: e.target.value })}
                        required
                      >
                        <option value="">— Select Student —</option>
                        {students.map((s) => (
                          <option key={s.id} value={s.id}>
                            {s.firstName} {s.middleName} {s.lastName} ({s.admissionNumber})
                          </option>
                        ))}
                      </select>
                    </div>
                  )}

                  {/* Select Teacher Borrower */}
                  {issueForm.borrowerType === "Teacher" && (
                    <div className="form-group">
                      <label className="form-label">Select Teacher <span className="form-required">*</span></label>
                      <select
                        className="form-select"
                        value={issueForm.teacherId}
                        onChange={(e) => setIssueForm({ ...issueForm, teacherId: e.target.value })}
                        required
                      >
                        <option value="">— Select Teacher —</option>
                        {teachers.map((t) => (
                          <option key={t.id} value={t.id}>
                            {t.firstName} {t.lastName} ({t.employeeId})
                          </option>
                        ))}
                      </select>
                    </div>
                  )}

                  {/* Due Date */}
                  <div className="form-group">
                    <label className="form-label">Return Due Date <span className="form-required">*</span></label>
                    <input
                      type="date"
                      className="form-input"
                      value={issueForm.dueDate}
                      onChange={(e) => setIssueForm({ ...issueForm, dueDate: e.target.value })}
                      required
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={saving}
                  style={{ background: "#ffae01", color: "#111", fontWeight: "bold" }}
                >
                  {saving ? "Issuing..." : "Issue Book Checkout"}
                </button>
              </form>
            </div>
          </div>
        )}

        {/* ACTIVE BORROWINGS TAB */}
        {activeTab === "borrowings" && (
          <div className="card">
            <div className="card-header" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span className="card-title" style={{ fontSize: "16px", fontWeight: "bold" }}>Currently Checked Out Books</span>
              <button className="btn btn-xs" onClick={loadData} disabled={loading} style={{ background: "#f0f1f3", color: "#333" }}>
                🔄 Refresh
              </button>
            </div>
            <div className="card-body" style={{ padding: "0" }}>
              <div className="table-wrap">
                {borrowings.length === 0 ? (
                  <div style={{ padding: "40px", textAlign: "center", color: "#888" }}>No active checkouts recorded.</div>
                ) : (
                  <table>
                    <thead>
                      <tr>
                        <th>Book Title</th>
                        <th>Borrower</th>
                        <th>Checkout Date</th>
                        <th>Due Date</th>
                        <th>Status</th>
                        <th style={{ textAlign: "right" }}>Return Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {borrowings.map((br) => {
                        const overdue = isOverdue(br.dueDate);
                        const borrowerName = br.student
                          ? `👨‍🎓 Student: ${br.student.firstName} ${br.student.lastName}`
                          : br.teacher
                            ? `👨‍🏫 Teacher: ${br.teacher.firstName} ${br.teacher.lastName}`
                            : "—";
                        return (
                          <tr key={br.id}>
                            <td className="td-name">📖 {br.book?.title}</td>
                            <td>{borrowerName}</td>
                            <td>{new Date(br.borrowDate).toLocaleDateString()}</td>
                            <td>{new Date(br.dueDate).toLocaleDateString()}</td>
                            <td>
                              <span className={`badge ${overdue ? "badge-red" : "badge-green"}`}>
                                {overdue ? "Overdue" : "Active / checked Out"}
                              </span>
                            </td>
                            <td style={{ textAlign: "right" }}>
                              <button
                                className="btn btn-xs"
                                onClick={() => handleReturnBook(br.id)}
                                style={{ background: "var(--color-secondary)", color: "#fff" }}
                              >
                                Check In Book
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
          </div>
        )}
      </div>
    </SidebarLayout>
  );
}
