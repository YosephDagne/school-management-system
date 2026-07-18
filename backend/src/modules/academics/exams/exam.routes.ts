import { Router } from "express";
import { ExamController } from "./exam.controller";
import { authMiddleware, hasPermission } from "../../../middleware/auth";

const router = Router();
router.use(authMiddleware as any);

router.post("/", hasPermission("exam.create") as any, ExamController.createExam as any);
router.get("/class-subject/:classSubjectId", hasPermission("exam.read") as any, ExamController.getClassSubjectExams as any);
router.get("/teacher/:teacherId", hasPermission("exam.read") as any, ExamController.getTeacherExams as any);
router.put("/:id", hasPermission("exam.update") as any, ExamController.updateExam as any);
router.delete("/:id", hasPermission("exam.delete") as any, ExamController.deleteExam as any);

export default router;
