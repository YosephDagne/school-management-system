import { Grade } from "./grade.model";
import { Exam } from "../exams/exam.model";
import { Student } from "../../students/student.model";
import { Class } from "../classes/class.model";
import { ClassSubject } from "../classes/class-subject.model";
import { Subject } from "../subjects/subject.model";

export class GradeService {
  // 1. Record/Update a Grade
  static async recordGrade(data: {
    examId: string;
    studentId: string;
    marksObtained: number;
    remarks?: string;
    recordedById: string;
  }) {
    // Check exam exists and marksObtained <= exam.maxMarks
    const exam = await Exam.findByPk(data.examId);
    if (!exam) throw new Error("Exam record not found");

    if (data.marksObtained > exam.maxMarks) {
      throw new Error(`Marks obtained (${data.marksObtained}) cannot exceed exam maximum marks (${exam.maxMarks})`);
    }

    // Check student exists
    const student = await Student.findByPk(data.studentId);
    if (!student) throw new Error("Student not found");

    // Upsert grade
    const [grade, created] = await Grade.findOrCreate({
      where: { examId: data.examId, studentId: data.studentId },
      defaults: {
        marksObtained: data.marksObtained,
        remarks: data.remarks || "",
        recordedById: data.recordedById,
      },
    });

    if (!created) {
      grade.marksObtained = data.marksObtained;
      grade.remarks = data.remarks || "";
      grade.recordedById = data.recordedById;
      await grade.save();
    }

    return grade;
  }

  // 2. Fetch grades for a specific student (for transcript/student portal)
  static async getStudentGrades(studentId: string, semester?: string) {
    const whereClause: any = { studentId };
    const examInclude: any = {
      model: Exam,
      as: "exam",
      include: [
        {
          model: ClassSubject,
          as: "classSubject",
          include: [
            { model: Subject, as: "subject" },
            { model: Class, as: "class" },
          ],
        },
      ],
    };

    if (semester) {
      examInclude.where = { semester };
    }

    return await Grade.findAll({
      where: whereClause,
      include: [examInclude],
    });
  }

  // 3. Automated Ranking & Roster Engine
  static async calculateClassRankings(classId: string, semester: string, academicYear: string) {
    // A. Fetch class details and all students
    const classRecord = await Class.findByPk(classId);
    if (!classRecord) throw new Error("Class section not found");

    const students = await Student.findAll({
      where: { classId, status: "Active" },
    });

    if (students.length === 0) {
      return [];
    }

    // B. Fetch all ClassSubjects mapped to this class
    const classSubjects = await ClassSubject.findAll({
      where: { classId },
      include: [{ model: Subject, as: "subject" }],
    });

    // C. For each ClassSubject, fetch the Exams for this academic year & semester
    const subjectExamsMap: { [classSubjectId: string]: Exam[] } = {};
    for (const cs of classSubjects) {
      const exams = await Exam.findAll({
        where: {
          classSubjectId: cs.id,
          semester,
          academicYear,
        },
      });
      subjectExamsMap[cs.id] = exams;
    }

    // D. Build the roster details for each student
    const studentRosters = [];

    for (const student of students) {
      let grandTotalScore = 0;
      let totalSubjectsGraded = 0;
      const subjectGrades: any[] = [];

      for (const cs of classSubjects) {
        const exams = subjectExamsMap[cs.id] || [];
        if (exams.length === 0) continue;

        let subjectScoreSum = 0; // Cumulative score out of 100% weightage
        let subjectWeightSum = 0;

        for (const exam of exams) {
          // Fetch student's grade for this exam
          const grade = await Grade.findOne({
            where: { examId: exam.id, studentId: student.id },
          });

          const marks = grade ? Number(grade.marksObtained) : 0;
          const weight = Number(exam.weightage);
          const maxMarks = Number(exam.maxMarks);

          // Calculate weight proportion: e.g. (marks / maxMarks) * weightage
          const examContribution = maxMarks > 0 ? (marks / maxMarks) * weight : 0;
          subjectScoreSum += examContribution;
          subjectWeightSum += weight;
        }

        // If the exams don't add up to 100% yet, we normalize to a 100% scale
        const normalizedSubjectScore = subjectWeightSum > 0 ? (subjectScoreSum / subjectWeightSum) * 100 : 0;

        subjectGrades.push({
          subjectId: cs.subject.id,
          subjectName: cs.subject.name,
          subjectCode: cs.subject.code,
          score: Math.round(normalizedSubjectScore * 100) / 100, // Round to 2 decimals
        });

        grandTotalScore += normalizedSubjectScore;
        totalSubjectsGraded++;
      }

      const averageScore = totalSubjectsGraded > 0 ? grandTotalScore / totalSubjectsGraded : 0;

      studentRosters.push({
        studentId: student.id,
        firstName: student.firstName,
        middleName: student.middleName,
        lastName: student.lastName,
        admissionNumber: student.admissionNumber,
        subjectGrades,
        grandTotal: Math.round(grandTotalScore * 100) / 100,
        average: Math.round(averageScore * 100) / 100,
        rank: 0, // Placeholder
      });
    }

    // E. Calculate rankings based on Average score (descending)
    studentRosters.sort((a, b) => b.average - a.average);

    let currentRank = 1;
    for (let i = 0; i < studentRosters.length; i++) {
      if (i > 0 && studentRosters[i].average < studentRosters[i - 1].average) {
        currentRank = i + 1;
      }
      studentRosters[i].rank = currentRank;
    }

    return studentRosters;
  }
}
