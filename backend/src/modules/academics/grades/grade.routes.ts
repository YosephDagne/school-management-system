import { Router } from "express";
import { GradeController } from "./grade.controller";
import { authMiddleware, requirePermission } from "../../../middleware/auth";

const router = Router();

router.use(authMiddleware as any);

router.post("/", requirePermission("manage_grades") as any, GradeController.recordGrade as any);
router.get("/student/:studentId", GradeController.getStudentGrades as any);
router.get("/class/:classId/rankings", requirePermission("manage_grades") as any, GradeController.getClassRankings as any);

export default router;
