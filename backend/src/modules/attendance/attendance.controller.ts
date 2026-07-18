import { Response, NextFunction } from "express";
import { AttendanceService } from "./attendance.service";
import { ApiResponse } from "../../utils/ApiResponse";
import { AuditService } from "../audit/audit.service";
import { AuthenticatedRequest } from "../../middleware/auth";

export class AttendanceController {
  static async recordAttendance(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<any> {
    try {
      const recordedById = req.user!.id;
      const { studentId, classId, subjectId, date, status } = req.body;

      if (!studentId || !classId || !date || !status) {
        return ApiResponse.error(res, "studentId, classId, date, and status are required");
      }

      const result = await AttendanceService.recordAttendance({ studentId, classId, subjectId, date, status, recordedById });
      await AuditService.log(recordedById, "RECORD_ATTENDANCE", "Attendance", req.ip, { studentId, date, status });
      return ApiResponse.success(res, result, "Attendance recorded successfully");
    } catch (error: any) {
      return ApiResponse.error(res, error.message);
    }
  }

  static async bulkRecordAttendance(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<any> {
    try {
      const recordedById = req.user!.id;
      const { records } = req.body;

      if (!records || !Array.isArray(records)) {
        return ApiResponse.error(res, "records array is required");
      }

      const result = await AttendanceService.bulkRecordAttendance(records, recordedById);
      await AuditService.log(recordedById, "BULK_RECORD_ATTENDANCE", "Attendance", req.ip, { count: records.length });
      return ApiResponse.success(res, result, "Bulk attendance sheet saved");
    } catch (error: any) {
      return ApiResponse.error(res, error.message);
    }
  }

  static async getClassAttendance(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<any> {
    try {
      const classId = req.params.classId as string;
      const { date, subjectId } = req.query;

      if (!date) return ApiResponse.error(res, "date query parameter is required (YYYY-MM-DD)");

      const result = await AttendanceService.getClassAttendance(classId, date as string, subjectId as string);
      return ApiResponse.success(res, result, "Class attendance sheet retrieved");
    } catch (error: any) {
      return ApiResponse.error(res, error.message);
    }
  }

  static async getStudentAttendance(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<any> {
    try {
      const studentId = req.params.studentId as string;
      const result = await AttendanceService.getStudentAttendance(studentId);
      return ApiResponse.success(res, result, "Student attendance logs retrieved");
    } catch (error: any) {
      return ApiResponse.error(res, error.message);
    }
  }
}
