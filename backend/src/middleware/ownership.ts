import { Response, NextFunction } from "express";
import { AuthenticatedRequest } from "./auth";
import { Student } from "../modules/students/student.model";
import { Parent } from "../modules/parents/parent.model";
import { Teacher } from "../modules/teachers/teacher.model";
import { ClassSubject } from "../modules/academics/classes/class-subject.model";

/**
 * Student Ownership: A Student can only access their own studentId-based resources.
 * Param name defaults to "studentId".
 */
export function checkStudentOwnership(paramName = "studentId") {
  return async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<any> => {
    if (!req.user) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    // Super Admin, Principal, Vice Principal, Registrar, Teacher, Accountant bypass
    const bypassRoles = ["Super Admin", "SUPER_ADMIN", "Principal", "Vice Principal", "Registrar", "Teacher", "Accountant", "Librarian", "Department Head", "ICT Administrator"];
    if (req.user.roles.some((r) => bypassRoles.includes(r))) {
      return next();
    }

    // Student must own the resource
    if (req.user.roles.includes("Student")) {
      const requestedStudentId = req.params[paramName] || req.body[paramName];
      const studentProfile = await Student.findOne({ where: { userId: req.user.id } });
      if (!studentProfile || studentProfile.id !== requestedStudentId) {
        return res.status(403).json({ success: false, message: "Access denied: you can only view your own data" });
      }
      return next();
    }

    // Parent must have this student as a child
    if (req.user.roles.includes("Parent")) {
      const requestedStudentId = req.params[paramName] || req.body[paramName];
      const parentProfile = await Parent.findOne({ where: { userId: req.user.id } });
      if (!parentProfile) {
        return res.status(403).json({ success: false, message: "Access denied: parent profile not found" });
      }
      const child = await Student.findOne({ where: { id: requestedStudentId, parentId: parentProfile.id } });
      if (!child) {
        return res.status(403).json({ success: false, message: "Access denied: this student is not linked to your account" });
      }
      return next();
    }

    next();
  };
}

/**
 * Teacher Ownership: A Teacher can only manage students in classes they are assigned to.
 * Validates via ClassSubject that the teacher teaches the class.
 */
export function checkTeacherClassOwnership(classIdParam = "classId") {
  return async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<any> => {
    if (!req.user) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    const bypassRoles = ["Super Admin", "SUPER_ADMIN", "Principal", "Vice Principal", "Registrar", "ICT Administrator"];
    if (req.user.roles.some((r) => bypassRoles.includes(r))) {
      return next();
    }

    if (req.user.roles.includes("Teacher") || req.user.roles.includes("Department Head")) {
      const classId = req.params[classIdParam] || req.body[classIdParam];
      if (!classId) return next(); // No class filter, allow pass-through

      const teacherProfile = await Teacher.findOne({ where: { userId: req.user.id } });
      if (!teacherProfile) {
        return res.status(403).json({ success: false, message: "Access denied: teacher profile not found" });
      }

      const assignment = await ClassSubject.findOne({ where: { classId, teacherId: teacherProfile.id } });
      if (!assignment) {
        return res.status(403).json({ success: false, message: "Access denied: you are not assigned to this class" });
      }
      return next();
    }

    next();
  };
}

/**
 * Department Head Ownership: restrict actions to teachers/subjects in their department.
 */
export function checkDepartmentHeadOwnership() {
  return async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<any> => {
    if (!req.user) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    const bypassRoles = ["Super Admin", "SUPER_ADMIN", "Principal", "Vice Principal", "Registrar", "ICT Administrator", "Teacher"];
    if (req.user.roles.some((r) => bypassRoles.includes(r))) {
      return next();
    }

    if (req.user.roles.includes("Department Head")) {
      const headProfile = await Teacher.findOne({ where: { userId: req.user.id } });
      if (!headProfile || !headProfile.department) {
        return res.status(403).json({ success: false, message: "Access denied: department head profile not found" });
      }
      // Attach the department to the request for use in downstream service filters
      (req as any).departmentFilter = headProfile.department;
    }

    next();
  };
}
