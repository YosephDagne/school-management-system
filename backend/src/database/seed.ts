import sequelize from "../config/database";
import { Role } from "../modules/rbac/role.model";
import { Permission } from "../modules/rbac/permission.model";
import { User } from "../modules/users/user.model";
import { hashPassword } from "../utils/password";
import { setupAssociations } from "./associations";
import { Class } from "../modules/academics/classes/class.model";

export async function seedDatabase() {
  console.log("Starting database seeding...");
  
  // Make sure associations are set up before database operations
  setupAssociations();

  // 1. Sync database tables
  await sequelize.sync({ force: true });
  console.log("Database force-synced successfully");

  // 2. Create Permissions
  const permissionsList = [
    { name: "manage_users", description: "Create, update, delete users" },
    { name: "manage_rbac", description: "Manage roles and permissions" },
    { name: "manage_classes", description: "Create classes, assign sections" },
    { name: "manage_subjects", description: "Create and assign subjects" },
    { name: "manage_students", description: "Register and manage students" },
    { name: "manage_teachers", description: "Manage teacher records" },
    { name: "manage_attendance", description: "Record and review student attendance" },
    { name: "manage_exams", description: "Create exams, quizzes, weights" },
    { name: "manage_grades", description: "Input and edit grades, calculate rankings" },
    { name: "manage_finance", description: "Manage fees and verify bank transaction receipts" },
    { name: "manage_library", description: "Catalog books and issue checkouts" },
    { name: "view_dashboard", description: "Access generic user dashboard" },
    { name: "view_own_grades", description: "Access student's own grades" },
    { name: "view_child_grades", description: "Access parent's child grades" },
    { name: "send_notifications", description: "Send general messages/SMS alerts" },
  ];

  const createdPermissions: { [key: string]: Permission } = {};
  for (const perm of permissionsList) {
    const p = await Permission.create(perm);
    createdPermissions[perm.name] = p;
  }
  console.log("Permissions seeded successfully");

  // 3. Create Roles
  const rolesList = [
    { name: "SUPER_ADMIN", description: "Full system administration access" },
    { name: "REGISTRAR", description: "Manages student enrollment, parent mappings, and classes" },
    { name: "TEACHER", description: "Manages class rosters, attendance, exams, and grading" },
    { name: "STUDENT", description: "View dashboard, own grades, assignments, schedules" },
    { name: "PARENT", description: "Monitor child grades, ranking, attendance, and pay fees" },
    { name: "LIBRARIAN", description: "Manage library catalogue and borrowings" },
    { name: "ACCOUNTANT", description: "Manage school fees billing and transaction processing" },
  ];

  const createdRoles: { [key: string]: Role } = {};
  for (const r of rolesList) {
    const role = await Role.create(r);
    createdRoles[r.name] = role;
  }
  console.log("Roles seeded successfully");

  // 4. Map Permissions to Roles
  // Super Admin gets all permissions
  const allPermissions = Object.values(createdPermissions);
  await (createdRoles["SUPER_ADMIN"] as any).addPermissions(allPermissions);

  // Registrar permissions
  await (createdRoles["REGISTRAR"] as any).addPermissions([
    createdPermissions["view_dashboard"],
    createdPermissions["manage_students"],
    createdPermissions["manage_teachers"],
    createdPermissions["manage_classes"],
    createdPermissions["manage_subjects"],
  ]);

  // Teacher permissions
  await (createdRoles["TEACHER"] as any).addPermissions([
    createdPermissions["view_dashboard"],
    createdPermissions["manage_attendance"],
    createdPermissions["manage_exams"],
    createdPermissions["manage_grades"],
    createdPermissions["send_notifications"],
  ]);

  // Student permissions
  await (createdRoles["STUDENT"] as any).addPermissions([
    createdPermissions["view_dashboard"],
    createdPermissions["view_own_grades"],
  ]);

  // Parent permissions
  await (createdRoles["PARENT"] as any).addPermissions([
    createdPermissions["view_dashboard"],
    createdPermissions["view_child_grades"],
  ]);

  // Librarian permissions
  await (createdRoles["LIBRARIAN"] as any).addPermissions([
    createdPermissions["view_dashboard"],
    createdPermissions["manage_library"],
  ]);

  // Accountant permissions
  await (createdRoles["ACCOUNTANT"] as any).addPermissions([
    createdPermissions["view_dashboard"],
    createdPermissions["manage_finance"],
  ]);

  console.log("Role-Permissions mapped successfully");

  // 5. Create default Super Admin user
  const adminPasswordHash = await hashPassword("admin123");
  const adminUser = await User.create({
    username: "admin",
    email: "admin@school.com",
    password: adminPasswordHash,
    roleId: createdRoles["SUPER_ADMIN"].id,
    isActive: true,
  });

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

  for (const c of defaultClasses) {
    await Class.create(c);
  }
  console.log("Default classes (Grade 9-12 A/B) seeded successfully");

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
