import { Router } from "express";
import { RegistrarController } from "./registrar.controller";
import { authMiddleware, hasPermission } from "../../middleware/auth";

const router = Router();

// Protect all registrar routes
router.use(authMiddleware as any);

// Student endpoints
router.post("/students", hasPermission("student.create") as any, RegistrarController.createStudent as any);
router.get("/students", hasPermission("student.read") as any, RegistrarController.getStudents as any);
router.post("/students/assign-class", hasPermission(["student.update", "student.promote"]) as any, RegistrarController.assignStudentToClass as any);

// Parent endpoints
router.post("/parents", hasPermission("student.create") as any, RegistrarController.createParent as any);
router.get("/parents", hasPermission("student.read") as any, RegistrarController.getParents as any);

// Teacher endpoints
router.post("/teachers", hasPermission("teacher.create") as any, RegistrarController.createTeacher as any);
router.get("/teachers", hasPermission("teacher.read") as any, RegistrarController.getTeachers as any);

// Class & Subject configuration endpoints
router.post("/classes", hasPermission("student.create") as any, RegistrarController.createClass as any);
router.get("/classes", hasPermission("student.read") as any, RegistrarController.getClasses as any);

router.post("/subjects", hasPermission("student.create") as any, RegistrarController.createSubject as any);
router.get("/subjects", hasPermission("student.read") as any, RegistrarController.getSubjects as any);

router.post("/class-subjects", hasPermission("student.create") as any, RegistrarController.assignClassSubject as any);

export default router;
