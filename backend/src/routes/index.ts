import { Router } from "express";
import authRoutes from "../modules/auth/auth.routes";
import userRoutes from "../modules/users/user.routes";
import rbacRoutes from "../modules/rbac/rbac.routes";
import registrarRoutes from "../modules/registrar/registrar.routes";
import examRoutes from "../modules/academics/exams/exam.routes";
import gradeRoutes from "../modules/academics/grades/grade.routes";
import attendanceRoutes from "../modules/attendance/attendance.routes";
import financeRoutes from "../modules/finance/finance.routes";
import libraryRoutes from "../modules/library/library.routes";
import auditRoutes from "../modules/audit/audit.routes";
import reportsRoutes from "../modules/reports/reports.routes";

const router = Router();

router.use("/auth", authRoutes);
router.use("/users", userRoutes);
router.use("/rbac", rbacRoutes);
router.use("/registrar", registrarRoutes);
router.use("/exams", examRoutes);
router.use("/grades", gradeRoutes);
router.use("/attendance", attendanceRoutes);
router.use("/finance", financeRoutes);
router.use("/library", libraryRoutes);
router.use("/audit", auditRoutes);
router.use("/reports", reportsRoutes);

export default router;
