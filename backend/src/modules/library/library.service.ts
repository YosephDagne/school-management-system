import { Book } from "./book.model";
import { BookBorrowing } from "./book-borrowing.model";
import { Student } from "../students/student.model";
import { Teacher } from "../teachers/teacher.model";

export class LibraryService {
  static async createBook(data: {
    title: string;
    author: string;
    isbn?: string;
    publisher?: string;
    quantity: number;
  }) {
    const book = await Book.create({
      title: data.title,
      author: data.author,
      isbn: data.isbn,
      publisher: data.publisher,
      quantity: data.quantity,
      availableQuantity: data.quantity,
    });
    return book;
  }

  static async borrowBook(data: {
    bookId: string;
    studentId?: string;
    teacherId?: string;
    dueDate: Date;
  }) {
    if (!data.studentId && !data.teacherId) {
      throw new Error("Either studentId or teacherId must be provided to borrow a book");
    }

    const book = await Book.findByPk(data.bookId);
    if (!book) throw new Error("Book not found in library inventory");

    if (book.availableQuantity <= 0) {
      throw new Error("No copies of this book are currently available");
    }

    // Verify student or teacher exists
    if (data.studentId) {
      const student = await Student.findByPk(data.studentId);
      if (!student) throw new Error("Student not found");
    }
    if (data.teacherId) {
      const teacher = await Teacher.findByPk(data.teacherId);
      if (!teacher) throw new Error("Teacher not found");
    }

    // Deduct available count
    book.availableQuantity -= 1;
    await book.save();

    const borrowing = await BookBorrowing.create({
      bookId: data.bookId,
      studentId: data.studentId || null,
      teacherId: data.teacherId || null,
      borrowDate: new Date(),
      dueDate: data.dueDate,
      status: "Borrowed",
      fineAmount: 0.00,
    });

    return borrowing;
  }

  static async returnBook(borrowingId: string) {
    const borrowing = await BookBorrowing.findByPk(borrowingId);
    if (!borrowing) throw new Error("Borrowing log not found");

    if (borrowing.status === "Returned") {
      throw new Error("Book has already been returned");
    }

    const book = await Book.findByPk(borrowing.bookId);
    if (book) {
      book.availableQuantity += 1;
      await book.save();
    }

    borrowing.returnDate = new Date();
    borrowing.status = "Returned";

    // Calculate fine: 5 Birr per day late
    const today = new Date();
    const due = new Date(borrowing.dueDate);
    if (today > due) {
      const diffTime = Math.abs(today.getTime() - due.getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      borrowing.fineAmount = diffDays * 5.00; // 5 Ethiopian Birr per day
    }

    await borrowing.save();
    return borrowing;
  }

  static async getActiveBorrowings() {
    return await BookBorrowing.findAll({
      where: { status: "Borrowed" },
      include: [
        { model: Book, as: "book", attributes: ["title", "author", "isbn"] },
        { model: Student, as: "student", attributes: ["firstName", "lastName", "admissionNumber"] },
        { model: Teacher, as: "teacher", attributes: ["firstName", "lastName", "employeeId"] },
      ],
    });
  }

  static async getBooks() {
    return await Book.findAll();
  }
}
