import { Response, NextFunction } from "express";
import { RegistrarService } from "./registrar.service";
import { ApiResponse } from "../../utils/ApiResponse";
import { AuditService } from "../audit/audit.service";
import { AuthenticatedRequest } from "../../middleware/auth";
import { Student } from "../students/student.model";
import { Parent } from "../parents/parent.model";
import { Teacher } from "../teachers/teacher.model";
import { Class } from "../academics/classes/class.model";

export class RegistrarController {
  static async createParent(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<any> {
    try {
      const result = await RegistrarService.createParent(req.body);
      await AuditService.log(req.user!.id, "CREATE_PARENT", "Registrar", req.ip, { parentUsername: req.body.username });
      return ApiResponse.success(res, result, "Parent profile and account created successfully");
    } catch (error: any) {
      return ApiResponse.error(res, error.message);
    }
  }

  static async createStudent(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<any> {
    try {
      const result = await RegistrarService.createStudent(req.body);
      await AuditService.log(req.user!.id, "CREATE_STUDENT", "Registrar", req.ip, { studentAdmission: req.body.admissionNumber });
      return ApiResponse.success(res, result, "Student enrolled successfully");
    } catch (error: any) {
      return ApiResponse.error(res, error.message);
    }
  }

  static async createTeacher(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<any> {
    try {
      const result = await RegistrarService.createTeacher(req.body);
      await AuditService.log(req.user!.id, "CREATE_TEACHER", "Registrar", req.ip, { teacherEmployeeId: req.body.employeeId });
      return ApiResponse.success(res, result, "Teacher record registered successfully");
    } catch (error: any) {
      return ApiResponse.error(res, error.message);
    }
  }

  static async createClass(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<any> {
    try {
      const result = await RegistrarService.createClass(req.body);
      await AuditService.log(req.user!.id, "CREATE_CLASS", "Registrar", req.ip, { className: req.body.name });
      return ApiResponse.success(res, result, "Class section created successfully");
    } catch (error: any) {
      return ApiResponse.error(res, error.message);
    }
  }

  static async createSubject(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<any> {
    try {
      const result = await RegistrarService.createSubject(req.body);
      await AuditService.log(req.user!.id, "CREATE_SUBJECT", "Registrar", req.ip, { subjectCode: req.body.code });
      return ApiResponse.success(res, result, "Subject created successfully");
    } catch (error: any) {
      return ApiResponse.error(res, error.message);
    }
  }

  static async assignClassSubject(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<any> {
    try {
      const result = await RegistrarService.assignClassSubject(req.body);
      await AuditService.log(req.user!.id, "ASSIGN_CLASS_SUBJECT", "Registrar", req.ip, req.body);
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
      await AuditService.log(req.user!.id, "ASSIGN_STUDENT_CLASS", "Registrar", req.ip, { studentId, classId });
      return ApiResponse.success(res, result, "Student assigned to class section successfully");
    } catch (error: any) {
      return ApiResponse.error(res, error.message);
    }
  }

  static async getStudents(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<any> {
    try {
      let result: any[];
      const roles = req.user!.roles;
      
      if (roles.includes("Super Admin") || roles.includes("SUPER_ADMIN") || roles.includes("Principal") || roles.includes("Vice Principal") || roles.includes("Registrar") || roles.includes("Librarian") || roles.includes("Accountant") || roles.includes("Guidance Counselor") || roles.includes("School Nurse")) {
        result = await RegistrarService.getStudents();
      } else if (roles.includes("Teacher") || roles.includes("Department Head")) {
        // Teachers only see students they teach (via assigned class subjects or homeroom class)
        const { ClassSubject } = require("../academics/classes/class-subject.model");

        const teacher = await Teacher.findOne({ where: { userId: req.user!.id } });
        if (!teacher) return ApiResponse.error(res, "Teacher profile not found", 404);
        
        // Find all classes taught by teacher or where they are homeroom teacher
        const classSubjects = await ClassSubject.findAll({ where: { teacherId: teacher.id } });
        const homeroomClasses = await Class.findAll({ where: { homeroomTeacherId: teacher.id } });
        const classIds = Array.from(new Set([
          ...classSubjects.map((cs: any) => cs.classId),
          ...homeroomClasses.map((hc: any) => hc.id)
        ]));
        
        result = await Student.findAll({
          where: { classId: classIds },
          include: [{ model: Parent, as: "parent" }, { model: Class, as: "class" }]
        });
      } else if (roles.includes("Parent")) {
        const parent = await Parent.findOne({ where: { userId: req.user!.id } });
        if (!parent) return ApiResponse.error(res, "Parent profile not found", 404);
        result = await Student.findAll({
          where: { parentId: parent.id },
          include: [{ model: Class, as: "class" }]
        });
      } else if (roles.includes("Student")) {
        result = await Student.findAll({
          where: { userId: req.user!.id },
          include: [{ model: Class, as: "class" }]
        });
      } else {
        result = [];
      }
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
