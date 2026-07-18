import { Response, NextFunction } from "express";
import { ExamService } from "./exam.service";
import { Exam } from "./exam.model";
import { ApiResponse } from "../../../utils/ApiResponse";
import { AuditService } from "../../audit/audit.service";
import { AuthenticatedRequest } from "../../../middleware/auth";

export class ExamController {
  static async createExam(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<any> {
    try {
      const result = await ExamService.createExam(req.body);
      await AuditService.log(req.user!.id, "CREATE_EXAM", "Exams", req.ip, { examId: result.id, name: result.name });
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

  static async updateExam(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<any> {
    try {
      const id = req.params.id as string;
      const exam = await Exam.findByPk(id);
      if (!exam) return ApiResponse.error(res, "Exam not found", 404);
      await exam.update(req.body);
      await AuditService.log(req.user!.id, "UPDATE_EXAM", "Exams", req.ip, { examId: id });
      return ApiResponse.success(res, exam, "Exam updated");
    } catch (error: any) {
      return ApiResponse.error(res, error.message);
    }
  }

  static async deleteExam(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<any> {
    try {
      const id = req.params.id as string;
      const exam = await Exam.findByPk(id);
      if (!exam) return ApiResponse.error(res, "Exam not found", 404);
      await exam.destroy();
      await AuditService.log(req.user!.id, "DELETE_EXAM", "Exams", req.ip, { examId: id });
      return ApiResponse.success(res, null, "Exam deleted");
    } catch (error: any) {
      return ApiResponse.error(res, error.message);
    }
  }
}
