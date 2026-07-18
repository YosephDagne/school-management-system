import sequelize from "../config/database";
import { Role } from "../modules/rbac/role.model";
import { Permission } from "../modules/rbac/permission.model";
import { User } from "../modules/users/user.model";
import { UserRole } from "../modules/rbac/user-role.model";
import { RolePermission } from "../modules/rbac/role-permission.model";
import { Teacher } from "../modules/teachers/teacher.model";
import { Student } from "../modules/students/student.model";
import { Parent } from "../modules/parents/parent.model";
import { Class } from "../modules/academics/classes/class.model";
import { Subject } from "../modules/academics/subjects/subject.model";
import { ClassSubject } from "../modules/academics/classes/class-subject.model";
import { hashPassword } from "../utils/password";
import { setupAssociations } from "./associations";

export async function seedDatabase() {
  console.log("Starting database seeding...");
  
  // Make sure associations are set up before database operations
  setupAssociations();

  // 1. Sync database tables
  await sequelize.sync({ force: true });
  console.log("Database force-synced successfully");

  // 2. Create Permissions
  const permissionsList = [
    // User Management
    { name: "user.create", description: "Create user accounts" },
    { name: "user.read", description: "Read user details and list users" },
    { name: "user.update", description: "Update user accounts" },
    { name: "user.delete", description: "Delete user accounts" },

    // Student Management
    { name: "student.create", description: "Admit new students" },
    { name: "student.read", description: "Read student details and lists" },
    { name: "student.update", description: "Update student details" },
    { name: "student.delete", description: "Remove student profiles" },
    { name: "student.promote", description: "Promote students to next grade" },
    { name: "student.transfer", description: "Transfer students out of school" },

    // Teacher Management
    { name: "teacher.create", description: "Create teacher profiles" },
    { name: "teacher.read", description: "Read teacher profiles and details" },
    { name: "teacher.update", description: "Update teacher profiles" },
    { name: "teacher.delete", description: "Remove teacher profiles" },

    // Attendance
    { name: "attendance.create", description: "Record daily attendance" },
    { name: "attendance.read", description: "Read attendance logs and rates" },
    { name: "attendance.update", description: "Modify recorded attendance" },

    // Examination
    { name: "exam.create", description: "Create exams and assignments tests" },
    { name: "exam.read", description: "Read exam details and weightages" },
    { name: "exam.update", description: "Modify exam details" },
    { name: "exam.delete", description: "Delete exam entries" },

    // Grades
    { name: "grade.create", description: "Record student marks" },
    { name: "grade.read", description: "Read student grade continuous assessments" },
    { name: "grade.update", description: "Modify input grades" },
    { name: "grade.publish", description: "Publish final report cards" },

    // Finance
    { name: "finance.create", description: "Create tuition fees structure" },
    { name: "finance.read", description: "Read payment ledger and transaction receipts" },
    { name: "finance.update", description: "Modify fee invoices" },
    { name: "finance.approve", description: "Approve bank deposits and reconcile receipts" },

    // Library
    { name: "library.create", description: "Add books to catalogue" },
    { name: "library.read", description: "Read catalogue and active borrowings" },
    { name: "library.update", description: "Update book quantity/details" },
    { name: "library.delete", description: "Remove books from database" },

    // Reports
    { name: "report.read", description: "Access school stats and student transcripts" },
    { name: "report.export", description: "Export report cards and spreadsheets to CSV" },

    // Administration
    { name: "settings.manage", description: "Manage system configuration settings" },
    { name: "role.manage", description: "Manage roles permission mappings" },
    { name: "permission.manage", description: "Create or delete custom permissions" },
    { name: "audit.read", description: "Read audit log files" },
  ];

  const createdPermissions: { [key: string]: Permission } = {};
  for (const perm of permissionsList) {
    const p = await Permission.create(perm);
    createdPermissions[perm.name] = p;
  }
  console.log("Permissions seeded successfully");

  // 3. Create Roles
  const rolesList = [
    { name: "Super Admin", description: "Full system administration access" },
    { name: "Principal", description: "School administration and analytics access" },
    { name: "Vice Principal", description: "Academic administration helper" },
    { name: "Registrar", description: "Manages student enrollment, parent mapping, and sections" },
    { name: "Teacher", description: "Manages continuous assessment, attendance, and grading" },
    { name: "Student", description: "View own grades, attendance, and timetable" },
    { name: "Parent", description: "Monitor children's report cards, attendance, and pay fees" },
    { name: "Accountant", description: "Manage student billing, invoices, and payment audits" },
    { name: "Librarian", description: "Catalog books and process issue checkouts" },
    { name: "Guidance Counselor", description: "Support student welfare and counseling" },
    { name: "School Nurse", description: "Manage student clinical health logs" },
    { name: "Department Head", description: "Oversee academic subjects and teachers under a department" },
    { name: "ICT Administrator", description: "Manage system configuration, roles, and audits" },
  ];

  const createdRoles: { [key: string]: Role } = {};
  for (const r of rolesList) {
    const role = await Role.create(r);
    createdRoles[r.name] = role;
  }
  console.log("Roles seeded successfully");

  // 4. Map Permissions to Roles
  const allPermissions = Object.values(createdPermissions);

  // Super Admin & ICT Administrator get all permissions
  await (createdRoles["Super Admin"] as any).addPermissions(allPermissions);
  await (createdRoles["ICT Administrator"] as any).addPermissions(allPermissions);

  // Principal permissions
  await (createdRoles["Principal"] as any).addPermissions([
    createdPermissions["teacher.create"],
    createdPermissions["teacher.read"],
    createdPermissions["teacher.update"],
    createdPermissions["teacher.delete"],
    createdPermissions["student.read"],
    createdPermissions["attendance.read"],
    createdPermissions["grade.read"],
    createdPermissions["exam.read"],
    createdPermissions["finance.read"],
    createdPermissions["library.read"],
    createdPermissions["report.read"],
    createdPermissions["report.export"],
    createdPermissions["settings.manage"],
    createdPermissions["audit.read"],
  ]);

  // Vice Principal permissions
  await (createdRoles["Vice Principal"] as any).addPermissions([
    createdPermissions["teacher.read"],
    createdPermissions["student.read"],
    createdPermissions["attendance.read"],
    createdPermissions["grade.read"],
    createdPermissions["exam.read"],
    createdPermissions["finance.read"],
    createdPermissions["library.read"],
    createdPermissions["report.read"],
    createdPermissions["report.export"],
  ]);

  // Registrar permissions
  await (createdRoles["Registrar"] as any).addPermissions([
    createdPermissions["student.create"],
    createdPermissions["student.read"],
    createdPermissions["student.update"],
    createdPermissions["student.delete"],
    createdPermissions["student.promote"],
    createdPermissions["student.transfer"],
    createdPermissions["teacher.read"],
  ]);

  // Teacher & Department Head permissions
  const teacherPerms = [
    createdPermissions["attendance.create"],
    createdPermissions["attendance.read"],
    createdPermissions["attendance.update"],
    createdPermissions["grade.create"],
    createdPermissions["grade.read"],
    createdPermissions["grade.update"],
    createdPermissions["exam.create"],
    createdPermissions["exam.read"],
    createdPermissions["exam.update"],
    createdPermissions["exam.delete"],
    createdPermissions["student.read"],
  ];
  await (createdRoles["Teacher"] as any).addPermissions(teacherPerms);
  await (createdRoles["Department Head"] as any).addPermissions(teacherPerms);

  // Student permissions
  await (createdRoles["Student"] as any).addPermissions([
    createdPermissions["student.read"],
    createdPermissions["grade.read"],
    createdPermissions["attendance.read"],
  ]);

  // Parent permissions
  await (createdRoles["Parent"] as any).addPermissions([
    createdPermissions["student.read"],
    createdPermissions["grade.read"],
    createdPermissions["attendance.read"],
    createdPermissions["finance.read"],
  ]);

  // Accountant permissions
  await (createdRoles["Accountant"] as any).addPermissions([
    createdPermissions["finance.create"],
    createdPermissions["finance.read"],
    createdPermissions["finance.update"],
    createdPermissions["finance.approve"],
    createdPermissions["student.read"],
  ]);

  // Librarian permissions
  await (createdRoles["Librarian"] as any).addPermissions([
    createdPermissions["library.create"],
    createdPermissions["library.read"],
    createdPermissions["library.update"],
    createdPermissions["library.delete"],
    createdPermissions["student.read"],
    createdPermissions["teacher.read"],
  ]);

  // Guidance Counselor / School Nurse permissions
  await (createdRoles["Guidance Counselor"] as any).addPermissions([createdPermissions["student.read"]]);
  await (createdRoles["School Nurse"] as any).addPermissions([createdPermissions["student.read"]]);

  console.log("Role-Permissions mapped successfully");

  // 5. Create default Super Admin user
  const defaultPasswordHash = await hashPassword("admin123");
  const adminUser = await User.create({
    username: "admin",
    email: "admin@school.com",
    password: defaultPasswordHash,
    isActive: true,
  });
  await (adminUser as any).addRole(createdRoles["Super Admin"]);
  console.log(`Default Super Admin created: username=admin, password=admin123`);

  // 6. Create default Class Sections (Grades 9-12, A and B)
  const defaultClasses = [
    { name: "Grade 9A", gradeLevel: 9, academicYear: "2026-2027" },
    { name: "Grade 9B", gradeLevel: 9, academicYear: "2026-2027" },
    { name: "Grade 10A", gradeLevel: 10, academicYear: "2026-2027" },
    { name: "Grade 10B", gradeLevel: 10, academicYear: "2026-2027" },
    { name: "Grade 11A", gradeLevel: 11, academicYear: "2026-2027" },
    { name: "Grade 11B", gradeLevel: 11, academicYear: "2026-2027" },
    { name: "Grade 12A", gradeLevel: 12, academicYear: "2026-2027" },
    { name: "Grade 12B", gradeLevel: 12, academicYear: "2026-2027" },
  ];

  const createdClasses: Class[] = [];
  for (const c of defaultClasses) {
    const cls = await Class.create(c);
    createdClasses.push(cls);
  }
  console.log("Default classes (Grade 9-12 A/B) seeded successfully");

  // 7. Seed sample staff accounts for testing role-specific layouts
  const staffTypes = [
    { username: "principal", roleName: "Principal", label: "Principal" },
    { username: "registrar", roleName: "Registrar", label: "Registrar" },
    { username: "accountant", roleName: "Accountant", label: "Accountant" },
    { username: "librarian", roleName: "Librarian", label: "Librarian" },
  ];

  for (const staff of staffTypes) {
    const pHash = await hashPassword(staff.username + "123");
    const u = await User.create({
      username: staff.username,
      email: `${staff.username}@school.com`,
      password: pHash,
      isActive: true,
    });
    await (u as any).addRole(createdRoles[staff.roleName]);
    console.log(`Created test user: username=${staff.username}, password=${staff.username}123, role=${staff.roleName}`);
  }

  // 8. Create a Teacher & a Department Head
  const teacherUserHash = await hashPassword("teacher123");
  const teacherUser = await User.create({
    username: "teacher",
    email: "teacher@school.com",
    password: teacherUserHash,
    isActive: true,
  });
  await (teacherUser as any).addRole(createdRoles["Teacher"]);

  const teacherProfile = await Teacher.create({
    userId: teacherUser.id,
    employeeId: "T-1001",
    firstName: "Abera",
    middleName: "Kassa",
    lastName: "Tessema",
    phoneNumber: "+251911223344",
    qualification: "B.Sc. in Physics",
    specialization: "Physics",
    department: "Natural Science",
    status: "Active",
  });

  // Department Head
  const deptHeadHash = await hashPassword("depthead123");
  const deptHeadUser = await User.create({
    username: "depthead",
    email: "depthead@school.com",
    password: deptHeadHash,
    isActive: true,
  });
  await (deptHeadUser as any).addRole(createdRoles["Department Head"]);

  const deptHeadProfile = await Teacher.create({
    userId: deptHeadUser.id,
    employeeId: "T-1002",
    firstName: "Solomon",
    middleName: "Bekele",
    lastName: "Girma",
    phoneNumber: "+251911556677",
    qualification: "M.Sc. in Chemistry",
    specialization: "Chemistry",
    department: "Natural Science",
    status: "Active",
  });

  console.log("Teacher and Department Head profiles created successfully");

  // 9. Seed Subjects
  const subjectsList = [
    { name: "Physics", code: "PHYS-G9", gradeLevel: 9, stream: "General", department: "Natural Science" },
    { name: "Chemistry", code: "CHEM-G9", gradeLevel: 9, stream: "General", department: "Natural Science" },
    { name: "Mathematics", code: "MATH-G9", gradeLevel: 9, stream: "General", department: "Mathematics" },
    { name: "History", code: "HIST-G11", gradeLevel: 11, stream: "SocialScience", department: "Social Science" },
    { name: "Geography", code: "GEOG-G11", gradeLevel: 11, stream: "SocialScience", department: "Social Science" },
  ];

  const createdSubjects: Subject[] = [];
  for (const s of subjectsList) {
    const sub = await Subject.create(s);
    createdSubjects.push(sub);
  }
  console.log("Subjects seeded successfully");

  // 10. Map Class Subjects (Physics & Chemistry to Grade 9A taught by Teacher Abera)
  const class9A = createdClasses.find((c) => c.name === "Grade 9A")!;
  const physSubject = createdSubjects.find((s) => s.code === "PHYS-G9")!;
  const chemSubject = createdSubjects.find((s) => s.code === "CHEM-G9")!;

  await ClassSubject.create({
    classId: class9A.id,
    subjectId: physSubject.id,
    teacherId: teacherProfile.id,
  });

  await ClassSubject.create({
    classId: class9A.id,
    subjectId: chemSubject.id,
    teacherId: teacherProfile.id,
  });

  console.log("ClassSubject mapping seeded (Abera teaches Grade 9A Physics/Chemistry)");

  // 11. Create a Parent
  const parentUserHash = await hashPassword("parent123");
  const parentUser = await User.create({
    username: "parent",
    email: "parent@school.com",
    password: parentUserHash,
    isActive: true,
  });
  await (parentUser as any).addRole(createdRoles["Parent"]);

  const parentProfile = await Parent.create({
    userId: parentUser.id,
    fullName: "Yoseph Dagne",
    phoneNumber: "+251912345678",
    address: "Addis Ababa, Bole Subcity, Woreda 03",
  });

  // 12. Create a Student linked to Parent and Class Grade 9A
  const studentUserHash = await hashPassword("student123");
  const studentUser = await User.create({
    username: "student",
    email: "student@school.com",
    password: studentUserHash,
    isActive: true,
  });
  await (studentUser as any).addRole(createdRoles["Student"]);

  const studentProfile = await Student.create({
    userId: studentUser.id,
    admissionNumber: "ADM-2026-0001",
    firstName: "Samuel",
    middleName: "Yoseph",
    lastName: "Dagne",
    gender: "M",
    dateOfBirth: new Date("2011-04-12"),
    parentId: parentProfile.id,
    classId: class9A.id,
    status: "Active",
  });

  console.log("Parent and Student accounts seeded successfully!");
  console.log("Database seeding completed!");
}

// Allow execution direct from command-line
if (require.main === module) {
  seedDatabase()
    .then(() => {
      console.log("Seed script execution finished successfully");
      process.exit(0);
    })
    .catch((err) => {
      console.error("Error during seed script execution:", err);
      process.exit(1);
    });
}
