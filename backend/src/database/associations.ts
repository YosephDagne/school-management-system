import { User } from "../modules/users/user.model";
import { Role } from "../modules/rbac/role.model";
import { Permission } from "../modules/rbac/permission.model";
import { Student } from "../modules/students/student.model";
import { Parent } from "../modules/parents/parent.model";
import { Teacher } from "../modules/teachers/teacher.model";
import { Class } from "../modules/academics/classes/class.model";
import { Subject } from "../modules/academics/subjects/subject.model";
import { ClassSubject } from "../modules/academics/classes/class-subject.model";
import { Exam } from "../modules/academics/exams/exam.model";
import { Grade } from "../modules/academics/grades/grade.model";
import { Assignment } from "../modules/academics/assignments/assignment.model";
import { Attendance } from "../modules/attendance/attendance.model";
import { Fee } from "../modules/finance/fee.model";
import { Payment } from "../modules/finance/payment.model";
import { Book } from "../modules/library/book.model";
import { BookBorrowing } from "../modules/library/book-borrowing.model";
import { Notification } from "../modules/notification/notification.model";
import { Document } from "../modules/documents/document.model";
import { AuditLog } from "../modules/audit/audit.model";

export function setupAssociations() {
  // 1. User & Role
  User.belongsTo(Role, { foreignKey: "roleId", as: "role" });
  Role.hasMany(User, { foreignKey: "roleId", as: "users" });

  // 2. Role & Permission (Many-to-Many via Join Table)
  Role.belongsToMany(Permission, {
    through: "role_permissions",
    foreignKey: "roleId",
    otherKey: "permissionId",
    as: "permissions",
  });
  Permission.belongsToMany(Role, {
    through: "role_permissions",
    foreignKey: "permissionId",
    otherKey: "roleId",
    as: "roles",
  });

  // 3. User & Profiles (One-to-One)
  Student.belongsTo(User, { foreignKey: "userId", as: "user" });
  User.hasOne(Student, { foreignKey: "userId", as: "student" });

  Parent.belongsTo(User, { foreignKey: "userId", as: "user" });
  User.hasOne(Parent, { foreignKey: "userId", as: "parent" });

  Teacher.belongsTo(User, { foreignKey: "userId", as: "user" });
  User.hasOne(Teacher, { foreignKey: "userId", as: "teacher" });

  // 4. Student & Parent (Many-to-One)
  Student.belongsTo(Parent, { foreignKey: "parentId", as: "parent" });
  Parent.hasMany(Student, { foreignKey: "parentId", as: "students" });

  // 5. Student & Class (Many-to-One)
  Student.belongsTo(Class, { foreignKey: "classId", as: "class" });
  Class.hasMany(Student, { foreignKey: "classId", as: "students" });

  // 6. Class & Homeroom Teacher (One-to-One)
  Class.belongsTo(Teacher, { foreignKey: "homeroomTeacherId", as: "homeroomTeacher" });
  Teacher.hasOne(Class, { foreignKey: "homeroomTeacherId", as: "homeroomClass" });

  // 7. ClassSubject (Class, Subject, Teacher mapping)
  ClassSubject.belongsTo(Class, { foreignKey: "classId", as: "class" });
  ClassSubject.belongsTo(Subject, { foreignKey: "subjectId", as: "subject" });
  ClassSubject.belongsTo(Teacher, { foreignKey: "teacherId", as: "teacher" });

  Class.hasMany(ClassSubject, { foreignKey: "classId", as: "classSubjects" });
  Subject.hasMany(ClassSubject, { foreignKey: "subjectId", as: "subjectClasses" });
  Teacher.hasMany(ClassSubject, { foreignKey: "teacherId", as: "teacherSubjects" });

  // 8. Attendance (Student, Class, Subject)
  Attendance.belongsTo(Student, { foreignKey: "studentId", as: "student" });
  Attendance.belongsTo(Class, { foreignKey: "classId", as: "class" });
  Attendance.belongsTo(Subject, { foreignKey: "subjectId", as: "subject" });
  Attendance.belongsTo(User, { foreignKey: "recordedById", as: "recordedBy" });

  // 9. Exam (ClassSubject relation)
  Exam.belongsTo(ClassSubject, { foreignKey: "classSubjectId", as: "classSubject" });
  ClassSubject.hasMany(Exam, { foreignKey: "classSubjectId", as: "exams" });

  // 10. Grade (Exam, Student)
  Grade.belongsTo(Exam, { foreignKey: "examId", as: "exam" });
  Grade.belongsTo(Student, { foreignKey: "studentId", as: "student" });
  Grade.belongsTo(User, { foreignKey: "recordedById", as: "recordedBy" });

  Exam.hasMany(Grade, { foreignKey: "examId", as: "grades" });
  Student.hasMany(Grade, { foreignKey: "studentId", as: "grades" });

  // 11. Assignment (ClassSubject relation)
  Assignment.belongsTo(ClassSubject, { foreignKey: "classSubjectId", as: "classSubject" });
  ClassSubject.hasMany(Assignment, { foreignKey: "classSubjectId", as: "assignments" });

  // 12. Payments (Student, Fee)
  Payment.belongsTo(Student, { foreignKey: "studentId", as: "student" });
  Payment.belongsTo(Fee, { foreignKey: "feeId", as: "fee" });

  Student.hasMany(Payment, { foreignKey: "studentId", as: "payments" });
  Fee.hasMany(Payment, { foreignKey: "feeId", as: "payments" });

  // 13. Book Borrowing (Book, Student, Teacher)
  BookBorrowing.belongsTo(Book, { foreignKey: "bookId", as: "book" });
  BookBorrowing.belongsTo(Student, { foreignKey: "studentId", as: "student" });
  BookBorrowing.belongsTo(Teacher, { foreignKey: "teacherId", as: "teacher" });

  Book.hasMany(BookBorrowing, { foreignKey: "bookId", as: "borrowings" });
  Student.hasMany(BookBorrowing, { foreignKey: "studentId", as: "borrowings" });
  Teacher.hasMany(BookBorrowing, { foreignKey: "teacherId", as: "borrowings" });

  // 14. Notification (User recipient)
  Notification.belongsTo(User, { foreignKey: "recipientId", as: "recipient" });

  // 15. Document
  Document.belongsTo(User, { foreignKey: "uploadedById", as: "uploadedBy" });
  Document.belongsTo(Class, { foreignKey: "classId", as: "class" });

  // 16. Audit Log
  AuditLog.belongsTo(User, { foreignKey: "userId", as: "user" });
}
