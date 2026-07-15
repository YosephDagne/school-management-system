import { Router } from "express";
import { AttendanceController } from "./attendance.controller";
import { authMiddleware, requirePermission } from "../../middleware/auth";

const router = Router();

router.use(authMiddleware as any);

router.post("/", requirePermission("manage_attendance") as any, AttendanceController.recordAttendance as any);
router.post("/bulk", requirePermission("manage_attendance") as any, AttendanceController.bulkRecordAttendance as any);
router.get("/class/:classId", requirePermission("manage_attendance") as any, AttendanceController.getClassAttendance as any);
router.get("/student/:studentId", AttendanceController.getStudentAttendance as any);

export default router;
