import { Router } from "express";
import authRoutes from "../modules/auth/auth.routes";
import registrarRoutes from "../modules/registrar/registrar.routes";
import examRoutes from "../modules/academics/exams/exam.routes";
import gradeRoutes from "../modules/academics/grades/grade.routes";
import attendanceRoutes from "../modules/attendance/attendance.routes";
import financeRoutes from "../modules/finance/finance.routes";
import libraryRoutes from "../modules/library/library.routes";

const router = Router();

router.use("/auth", authRoutes);
router.use("/registrar", registrarRoutes);
router.use("/exams", examRoutes);
router.use("/grades", gradeRoutes);
router.use("/attendance", attendanceRoutes);
router.use("/finance", financeRoutes);
router.use("/library", libraryRoutes);

export default router;
