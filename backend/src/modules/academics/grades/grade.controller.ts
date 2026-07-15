import { Response, NextFunction } from "express";
import { GradeService } from "./grade.service";
import { ApiResponse } from "../../../utils/ApiResponse";
import { AuditService } from "../../audit/audit.service";
import { AuthenticatedRequest } from "../../../middleware/auth";

export class GradeController {
  static async recordGrade(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<any> {
    try {
      const recordedById = req.user!.id;
      const { examId, studentId, marksObtained, remarks } = req.body;
      
      if (!examId || !studentId || marksObtained === undefined) {
        return ApiResponse.error(res, "examId, studentId, and marksObtained are required");
      }

      const result = await GradeService.recordGrade({
        examId,
        studentId,
        marksObtained: Number(marksObtained),
        remarks,
        recordedById,
      });

      await AuditService.log(recordedById, "RECORD_GRADE", req.ip, { examId, studentId, marksObtained });
      return ApiResponse.success(res, result, "Grade recorded successfully");
    } catch (error: any) {
      return ApiResponse.error(res, error.message);
    }
  }

  static async getStudentGrades(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<any> {
    try {
      const studentId = req.params.studentId as string;
      const { semester } = req.query;
      const result = await GradeService.getStudentGrades(studentId, semester as string);
      return ApiResponse.success(res, result, "Student grades retrieved");
    } catch (error: any) {
      return ApiResponse.error(res, error.message);
    }
  }

  static async getClassRankings(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<any> {
    try {
      const classId = req.params.classId as string;
      const { semester, academicYear } = req.query;

      if (!semester || !academicYear) {
        return ApiResponse.error(res, "semester and academicYear query parameters are required");
      }

      const result = await GradeService.calculateClassRankings(classId, semester as string, academicYear as string);
      return ApiResponse.success(res, result, "Class rankings and roster calculated successfully");
    } catch (error: any) {
      return ApiResponse.error(res, error.message);
    }
  }
}
