import { Router } from "express";
import { GradeController } from "./grade.controller";
import { authMiddleware, hasPermission } from "../../../middleware/auth";
import { checkStudentOwnership } from "../../../middleware/ownership";

const router = Router();
router.use(authMiddleware as any);

router.post("/", hasPermission("grade.create") as any, GradeController.recordGrade as any);
router.get("/student/:studentId", hasPermission("grade.read") as any, checkStudentOwnership("studentId") as any, GradeController.getStudentGrades as any);
router.get("/class/:classId/rankings", hasPermission("grade.read") as any, GradeController.getClassRankings as any);
router.post("/publish/:examId", hasPermission("grade.publish") as any, GradeController.publishGrades as any);

export default router;
