import { Router } from "express";
import { RegistrarController } from "./registrar.controller";
import { authMiddleware, requirePermission } from "../../middleware/auth";

const router = Router();

// Protect all registrar routes
router.use(authMiddleware as any);

// Student endpoints
router.post("/students", requirePermission("manage_students") as any, RegistrarController.createStudent as any);
router.get("/students", requirePermission("manage_students") as any, RegistrarController.getStudents as any);
router.post("/students/assign-class", requirePermission("manage_students") as any, RegistrarController.assignStudentToClass as any);

// Parent endpoints
router.post("/parents", requirePermission("manage_students") as any, RegistrarController.createParent as any);
router.get("/parents", requirePermission("manage_students") as any, RegistrarController.getParents as any);

// Teacher endpoints
router.post("/teachers", requirePermission("manage_teachers") as any, RegistrarController.createTeacher as any);
router.get("/teachers", requirePermission("manage_teachers") as any, RegistrarController.getTeachers as any);

// Class & Subject configuration endpoints
router.post("/classes", requirePermission("manage_classes") as any, RegistrarController.createClass as any);
router.get("/classes", requirePermission("manage_classes") as any, RegistrarController.getClasses as any);

router.post("/subjects", requirePermission("manage_subjects") as any, RegistrarController.createSubject as any);
router.get("/subjects", requirePermission("manage_subjects") as any, RegistrarController.getSubjects as any);

router.post("/class-subjects", requirePermission("manage_classes") as any, RegistrarController.assignClassSubject as any);

export default router;
