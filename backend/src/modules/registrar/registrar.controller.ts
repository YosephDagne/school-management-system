import { Response, NextFunction } from "express";
import { RegistrarService } from "./registrar.service";
import { ApiResponse } from "../../utils/ApiResponse";
import { AuditService } from "../audit/audit.service";
import { AuthenticatedRequest } from "../../middleware/auth";

export class RegistrarController {
  static async createParent(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<any> {
    try {
      const result = await RegistrarService.createParent(req.body);
      await AuditService.log(req.user!.id, "CREATE_PARENT", req.ip, { parentUsername: req.body.username });
      return ApiResponse.success(res, result, "Parent profile and account created successfully");
    } catch (error: any) {
      return ApiResponse.error(res, error.message);
    }
  }

  static async createStudent(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<any> {
    try {
      const result = await RegistrarService.createStudent(req.body);
      await AuditService.log(req.user!.id, "CREATE_STUDENT", req.ip, { studentAdmission: req.body.admissionNumber });
      return ApiResponse.success(res, result, "Student enrolled successfully");
    } catch (error: any) {
      return ApiResponse.error(res, error.message);
    }
  }

  static async createTeacher(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<any> {
    try {
      const result = await RegistrarService.createTeacher(req.body);
      await AuditService.log(req.user!.id, "CREATE_TEACHER", req.ip, { teacherEmployeeId: req.body.employeeId });
      return ApiResponse.success(res, result, "Teacher record registered successfully");
    } catch (error: any) {
      return ApiResponse.error(res, error.message);
    }
  }

  static async createClass(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<any> {
    try {
      const result = await RegistrarService.createClass(req.body);
      await AuditService.log(req.user!.id, "CREATE_CLASS", req.ip, { className: req.body.name });
      return ApiResponse.success(res, result, "Class section created successfully");
    } catch (error: any) {
      return ApiResponse.error(res, error.message);
    }
  }

  static async createSubject(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<any> {
    try {
      const result = await RegistrarService.createSubject(req.body);
      await AuditService.log(req.user!.id, "CREATE_SUBJECT", req.ip, { subjectCode: req.body.code });
      return ApiResponse.success(res, result, "Subject created successfully");
    } catch (error: any) {
      return ApiResponse.error(res, error.message);
    }
  }

  static async assignClassSubject(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<any> {
    try {
      const result = await RegistrarService.assignClassSubject(req.body);
      await AuditService.log(req.user!.id, "ASSIGN_CLASS_SUBJECT", req.ip, req.body);
      return ApiResponse.success(res, result, "Teacher & Subject successfully mapped to Class");
    } catch (error: any) {
      return ApiResponse.error(res, error.message);
    }
  }

  static async assignStudentToClass(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<any> {
    try {
      const { studentId, classId } = req.body;
      if (!studentId || !classId) {
        return ApiResponse.error(res, "studentId and classId are required");
      }
      const result = await RegistrarService.assignStudentToClass(studentId, classId);
      await AuditService.log(req.user!.id, "ASSIGN_STUDENT_CLASS", req.ip, { studentId, classId });
      return ApiResponse.success(res, result, "Student assigned to class section successfully");
    } catch (error: any) {
      return ApiResponse.error(res, error.message);
    }
  }

  static async getStudents(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<any> {
    try {
      const result = await RegistrarService.getStudents();
      return ApiResponse.success(res, result, "Students list retrieved");
    } catch (error: any) {
      return ApiResponse.error(res, error.message);
    }
  }

  static async getParents(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<any> {
    try {
      const result = await RegistrarService.getParents();
      return ApiResponse.success(res, result, "Parents list retrieved");
    } catch (error: any) {
      return ApiResponse.error(res, error.message);
    }
  }

  static async getTeachers(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<any> {
    try {
      const result = await RegistrarService.getTeachers();
      return ApiResponse.success(res, result, "Teachers list retrieved");
    } catch (error: any) {
      return ApiResponse.error(res, error.message);
    }
  }

  static async getClasses(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<any> {
    try {
      const result = await RegistrarService.getClasses();
      return ApiResponse.success(res, result, "Classes list retrieved");
    } catch (error: any) {
      return ApiResponse.error(res, error.message);
    }
  }

  static async getSubjects(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<any> {
    try {
      const result = await RegistrarService.getSubjects();
      return ApiResponse.success(res, result, "Subjects list retrieved");
    } catch (error: any) {
      return ApiResponse.error(res, error.message);
    }
  }
}
