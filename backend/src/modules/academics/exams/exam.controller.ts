import { Response, NextFunction } from "express";
import { ExamService } from "./exam.service";
import { ApiResponse } from "../../../utils/ApiResponse";
import { AuditService } from "../../audit/audit.service";
import { AuthenticatedRequest } from "../../../middleware/auth";

export class ExamController {
  static async createExam(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<any> {
    try {
      const result = await ExamService.createExam(req.body);
      await AuditService.log(req.user!.id, "CREATE_EXAM", req.ip, { examId: result.id, name: result.name });
      return ApiResponse.success(res, result, "Exam/Assessment record created successfully");
    } catch (error: any) {
      return ApiResponse.error(res, error.message);
    }
  }

  static async getClassSubjectExams(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<any> {
    try {
      const classSubjectId = req.params.classSubjectId as string;
      const result = await ExamService.getClassSubjectExams(classSubjectId);
      return ApiResponse.success(res, result, "Exams list retrieved");
    } catch (error: any) {
      return ApiResponse.error(res, error.message);
    }
  }

  static async getTeacherExams(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<any> {
    try {
      const teacherId = req.params.teacherId as string;
      const result = await ExamService.getTeacherExams(teacherId);
      return ApiResponse.success(res, result, "Teacher's exams retrieved");
    } catch (error: any) {
      return ApiResponse.error(res, error.message);
    }
  }
}
