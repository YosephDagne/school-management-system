import { Router } from "express";
import { ExamController } from "./exam.controller";
import { authMiddleware, requirePermission } from "../../../middleware/auth";

const router = Router();

router.use(authMiddleware as any);

router.post("/", requirePermission("manage_exams") as any, ExamController.createExam as any);
router.get("/class-subject/:classSubjectId", ExamController.getClassSubjectExams as any);
router.get("/teacher/:teacherId", requirePermission("manage_exams") as any, ExamController.getTeacherExams as any);

export default router;
