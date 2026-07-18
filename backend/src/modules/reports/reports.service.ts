import { Student } from "../students/student.model";
import { Teacher } from "../teachers/teacher.model";
import { Class } from "../academics/classes/class.model";
import { Book } from "../library/book.model";
import { Grade } from "../academics/grades/grade.model";
import { fn, col, literal } from "sequelize";

export class ReportsService {
  static async getSchoolAnalytics() {
    const [studentCount, teacherCount, classCount, bookCount, maleCount, femaleCount] = await Promise.all([
      Student.count(),
      Teacher.count(),
      Class.count(),
      Book.count(),
      Student.count({ where: { gender: "M" } }),
      Student.count({ where: { gender: "F" } }),
    ]);

    // Grade-level distribution
    const classes = await Class.findAll({
      attributes: ["name", "gradeLevel"],
      include: [{ model: Student, as: "students", attributes: [] }],
      order: [["gradeLevel", "ASC"]],
    });

    return {
      counters: {
        students: studentCount,
        teachers: teacherCount,
        classes: classCount,
        books: bookCount,
      },
      gender: {
        male: maleCount,
        female: femaleCount,
      },
      classSizes: classes.map((c: any) => ({ name: c.name, gradeLevel: c.gradeLevel })),
    };
  }

  static async getAcademicAverageReport() {
    // Get all grades with student and class info
    const grades = await Grade.findAll({
      include: [
        {
          model: Student,
          as: "student",
          attributes: ["classId"],
          include: [{ model: Class, as: "class", attributes: ["name"] }],
        },
      ],
    });

    // Group by class name and compute averages
    const classMap: Record<string, { total: number; count: number }> = {};
    grades.forEach((g: any) => {
      const className = g.student?.class?.name || "Unassigned";
      if (!classMap[className]) classMap[className] = { total: 0, count: 0 };
      classMap[className].total += Number(g.marksObtained);
      classMap[className].count += 1;
    });

    return {
      classPerformance: Object.entries(classMap).map(([className, data]) => ({
        className,
        avgMarks: data.count > 0 ? (data.total / data.count).toFixed(2) : "0.00",
        examCount: data.count,
      })),
    };
  }

  static async getMinistryReport() {
    // Count Grade 10 and Grade 12 students (national exam candidates)
    const [grade10Count, grade12Count] = await Promise.all([
      Student.count({ include: [{ model: Class, as: "class", where: { gradeLevel: 10 } }] }),
      Student.count({ include: [{ model: Class, as: "class", where: { gradeLevel: 12 } }] }),
    ]);

    const totalStudents = await Student.count();
    const totalTeachers = await Teacher.count();

    return {
      candidates: {
        grade10: grade10Count,
        grade12: grade12Count,
        total: totalStudents,
      },
      staffing: {
        teachers: totalTeachers,
        studentTeacherRatio: totalTeachers > 0 ? (totalStudents / totalTeachers).toFixed(1) : "N/A",
      },
    };
  }
}
