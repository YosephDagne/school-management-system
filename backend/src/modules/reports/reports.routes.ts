import { Router } from "express";
import { ReportsController } from "./reports.controller";
import { authMiddleware, hasPermission } from "../../middleware/auth";

const router = Router();
router.use(authMiddleware as any);

router.get("/analytics", hasPermission("report.read") as any, ReportsController.getSchoolAnalytics as any);
router.get("/averages", hasPermission("report.read") as any, ReportsController.getAcademicAverages as any);
router.get("/ministry", hasPermission("report.read") as any, ReportsController.getMinistryReport as any);

export default router;
