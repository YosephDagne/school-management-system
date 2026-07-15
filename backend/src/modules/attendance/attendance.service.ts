import { Attendance } from "./attendance.model";
import { Student } from "../students/student.model";

export class AttendanceService {
  static async recordAttendance(data: {
    studentId: string;
    classId: string;
    subjectId?: string;
    date: string;
    status: string;
    recordedById: string;
  }) {
    const student = await Student.findByPk(data.studentId);
    if (!student) throw new Error("Student not found");

    // Upsert attendance
    const [attendance, created] = await Attendance.findOrCreate({
      where: {
        studentId: data.studentId,
        classId: data.classId,
        subjectId: data.subjectId || null,
        date: data.date,
      },
      defaults: {
        status: data.status,
        recordedById: data.recordedById,
      },
    });

    if (!created) {
      attendance.status = data.status;
      attendance.recordedById = data.recordedById;
      await attendance.save();
    }

    return attendance;
  }

  static async bulkRecordAttendance(
    records: Array<{
      studentId: string;
      classId: string;
      subjectId?: string;
      date: string;
      status: string;
    }>,
    recordedById: string
  ) {
    const results = [];
    for (const rec of records) {
      const res = await this.recordAttendance({
        studentId: rec.studentId,
        classId: rec.classId,
        subjectId: rec.subjectId,
        date: rec.date,
        status: rec.status,
        recordedById,
      });
      results.push(res);
    }
    return results;
  }

  static async getClassAttendance(classId: string, date: string, subjectId?: string) {
    const whereClause: any = { classId, date };
    if (subjectId) {
      whereClause.subjectId = subjectId;
    } else {
      whereClause.subjectId = null;
    }

    return await Attendance.findAll({
      where: whereClause,
      include: [
        {
          model: Student,
          as: "student",
          attributes: ["id", "firstName", "middleName", "lastName", "admissionNumber"],
        },
      ],
    });
  }

  static async getStudentAttendance(studentId: string) {
    const records = await Attendance.findAll({ where: { studentId } });
    
    // Calculate totals
    const summary = {
      Present: 0,
      Absent: 0,
      Late: 0,
      Excused: 0,
      totalDays: records.length,
    };

    records.forEach((r) => {
      if (r.status === "Present") summary.Present++;
      else if (r.status === "Absent") summary.Absent++;
      else if (r.status === "Late") summary.Late++;
      else if (r.status === "Excused") summary.Excused++;
    });

    return { summary, records };
  }
}
