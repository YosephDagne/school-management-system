import { User } from "../users/user.model";
import { Role } from "../rbac/role.model";
import { Student } from "../students/student.model";
import { Parent } from "../parents/parent.model";
import { Teacher } from "../teachers/teacher.model";
import { Class } from "../academics/classes/class.model";
import { Subject } from "../academics/subjects/subject.model";
import { ClassSubject } from "../academics/classes/class-subject.model";
import { hashPassword } from "../../utils/password";

export class RegistrarService {
  // 1. Create a Parent
  static async createParent(data: {
    username: string;
    email?: string;
    fullName: string;
    phoneNumber: string;
    address: string;
  }) {
    // Check if user exists
    const existing = await User.findOne({ where: { username: data.username } });
    if (existing) throw new Error("Username already taken");

    const parentRole = await Role.findOne({ where: { name: "PARENT" } });
    if (!parentRole) throw new Error("PARENT role not found");

    // Create base user credentials
    const defaultPasswordHash = await hashPassword("parent123");
    const user = await User.create({
      username: data.username,
      email: data.email || null,
      password: defaultPasswordHash,
      roleId: parentRole.id,
      isActive: true,
    });

    // Create Parent record
    const parent = await Parent.create({
      userId: user.id,
      fullName: data.fullName,
      phoneNumber: data.phoneNumber,
      address: data.address,
    });

    return { user, parent };
  }

  // 2. Create a Student linked to Parent
  static async createStudent(data: {
    username: string;
    email?: string;
    admissionNumber: string;
    firstName: string;
    middleName: string;
    lastName: string;
    gender: "M" | "F";
    dateOfBirth: Date;
    parentId: string;
    classId?: string;
  }) {
    // Check parent exists
    const parentExists = await Parent.findByPk(data.parentId);
    if (!parentExists) throw new Error("Parent record not found");

    // Check admission number
    const existAdm = await Student.findOne({ where: { admissionNumber: data.admissionNumber } });
    if (existAdm) throw new Error("Admission number already registered");

    const studentRole = await Role.findOne({ where: { name: "STUDENT" } });
    if (!studentRole) throw new Error("STUDENT role not found");

    // Create student user account
    const defaultPasswordHash = await hashPassword("student123");
    const user = await User.create({
      username: data.username,
      email: data.email || null,
      password: defaultPasswordHash,
      roleId: studentRole.id,
      isActive: true,
    });

    // Create Student record
    const student = await Student.create({
      userId: user.id,
      admissionNumber: data.admissionNumber,
      firstName: data.firstName,
      middleName: data.middleName,
      lastName: data.lastName,
      gender: data.gender,
      dateOfBirth: data.dateOfBirth,
      parentId: data.parentId,
      classId: data.classId || null,
      status: "Active",
    });

    return { user, student };
  }

  // 3. Create a Teacher
  static async createTeacher(data: {
    username: string;
    email?: string;
    employeeId: string;
    firstName: string;
    middleName: string;
    lastName: string;
    phoneNumber: string;
    qualification: string;
    specialization: string;
  }) {
    const existing = await User.findOne({ where: { username: data.username } });
    if (existing) throw new Error("Username already taken");

    // Check employee ID
    const existEmp = await Teacher.findOne({ where: { employeeId: data.employeeId } });
    if (existEmp) throw new Error("Employee ID already exists");

    const teacherRole = await Role.findOne({ where: { name: "TEACHER" } });
    if (!teacherRole) throw new Error("TEACHER role not found");

    const defaultPasswordHash = await hashPassword("teacher123");
    const user = await User.create({
      username: data.username,
      email: data.email || null,
      password: defaultPasswordHash,
      roleId: teacherRole.id,
      isActive: true,
    });

    const teacher = await Teacher.create({
      userId: user.id,
      employeeId: data.employeeId,
      firstName: data.firstName,
      middleName: data.middleName,
      lastName: data.lastName,
      phoneNumber: data.phoneNumber,
      email: data.email || null,
      qualification: data.qualification,
      specialization: data.specialization,
      status: "Active",
    });

    return { user, teacher };
  }

  // 4. Create Class Section
  static async createClass(data: {
    name: string;
    gradeLevel: number;
    academicYear: string;
    homeroomTeacherId?: string;
  }) {
    if (data.homeroomTeacherId) {
      const teacher = await Teacher.findByPk(data.homeroomTeacherId);
      if (!teacher) throw new Error("Homeroom Teacher not found");
    }

    const newClass = await Class.create({
      name: data.name,
      gradeLevel: data.gradeLevel,
      academicYear: data.academicYear,
      homeroomTeacherId: data.homeroomTeacherId || null,
    });

    return newClass;
  }

  // 5. Create Subject
  static async createSubject(data: {
    name: string;
    code: string;
    gradeLevel: number;
    stream: string;
  }) {
    const subject = await Subject.create({
      name: data.name,
      code: data.code,
      gradeLevel: data.gradeLevel,
      stream: data.stream,
    });
    return subject;
  }

  // 6. Assign Subject to Class & Teacher (ClassSubject mapping)
  static async assignClassSubject(data: {
    classId: string;
    subjectId: string;
    teacherId: string;
  }) {
    // Validate existence
    const classRecord = await Class.findByPk(data.classId);
    if (!classRecord) throw new Error("Class section not found");

    const subjectRecord = await Subject.findByPk(data.subjectId);
    if (!subjectRecord) throw new Error("Subject not found");

    const teacherRecord = await Teacher.findByPk(data.teacherId);
    if (!teacherRecord) throw new Error("Teacher not found");

    // Check duplicate
    const duplicate = await ClassSubject.findOne({
      where: { classId: data.classId, subjectId: data.subjectId },
    });
    if (duplicate) throw new Error("Subject is already mapped to this class");

    const classSubject = await ClassSubject.create({
      classId: data.classId,
      subjectId: data.subjectId,
      teacherId: data.teacherId,
    });

    return classSubject;
  }

  // Get lists for select dropdowns, etc.
  static async getStudents() {
    return await Student.findAll({
      include: [
        { model: Parent, as: "parent" },
        { model: Class, as: "class" },
      ],
    });
  }

  static async getParents() {
    return await Parent.findAll();
  }

  static async getTeachers() {
    return await Teacher.findAll();
  }

  static async getClasses() {
    return await Class.findAll({
      include: [
        { model: Teacher, as: "homeroomTeacher" },
        {
          model: ClassSubject,
          as: "classSubjects",
          include: [
            { model: Subject, as: "subject" },
            { model: Teacher, as: "teacher" }
          ]
        }
      ],
    });
  }

  static async getSubjects() {
    return await Subject.findAll();
  }

  static async assignStudentToClass(studentId: string, classId: string) {
    const student = await Student.findByPk(studentId);
    if (!student) throw new Error("Student not found");

    const targetClass = await Class.findByPk(classId);
    if (!targetClass) throw new Error("Class section not found");

    student.classId = classId;
    await student.save();
    return student;
  }
}
