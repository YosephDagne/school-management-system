import { Router } from "express";
import { AttendanceController } from "./attendance.controller";
import { authMiddleware, hasPermission } from "../../middleware/auth";
import { checkStudentOwnership, checkTeacherClassOwnership } from "../../middleware/ownership";

const router = Router();
router.use(authMiddleware as any);

router.post("/", hasPermission("attendance.create") as any, checkTeacherClassOwnership("classId") as any, AttendanceController.recordAttendance as any);
router.post("/bulk", hasPermission("attendance.create") as any, checkTeacherClassOwnership("classId") as any, AttendanceController.bulkRecordAttendance as any);
router.get("/class/:classId", hasPermission("attendance.read") as any, checkTeacherClassOwnership("classId") as any, AttendanceController.getClassAttendance as any);
router.get("/student/:studentId", hasPermission("attendance.read") as any, checkStudentOwnership("studentId") as any, AttendanceController.getStudentAttendance as any);

export default router;
