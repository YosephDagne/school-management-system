import { Exam } from "./exam.model";
import { ClassSubject } from "../classes/class-subject.model";
import { Class } from "../classes/class.model";
import { Subject } from "../subjects/subject.model";

export class ExamService {
  static async createExam(data: {
    name: string;
    type: string;
    classSubjectId: string;
    maxMarks: number;
    weightage: number;
    semester: string;
    academicYear: string;
  }) {
    const classSubject = await ClassSubject.findByPk(data.classSubjectId);
    if (!classSubject) {
      throw new Error("ClassSubject mapping not found");
    }

    // Verify current total weightage for this classSubject, semester, academicYear doesn't exceed 100%
    const existingExams = await Exam.findAll({
      where: {
        classSubjectId: data.classSubjectId,
        semester: data.semester,
        academicYear: data.academicYear,
      },
    });

    const currentWeightSum = existingExams.reduce((sum, exam) => sum + Number(exam.weightage), 0);
    if (currentWeightSum + Number(data.weightage) > 100) {
      throw new Error(
        `Total exam weightage for this semester would exceed 100%. Current sum: ${currentWeightSum}%. Added: ${data.weightage}%.`
      );
    }

    const exam = await Exam.create({
      name: data.name,
      type: data.type,
      classSubjectId: data.classSubjectId,
      maxMarks: data.maxMarks,
      weightage: data.weightage,
      semester: data.semester,
      academicYear: data.academicYear,
    });

    return exam;
  }

  static async getClassSubjectExams(classSubjectId: string) {
    return await Exam.findAll({ where: { classSubjectId } });
  }

  static async getTeacherExams(teacherId: string) {
    return await Exam.findAll({
      include: [
        {
          model: ClassSubject,
          as: "classSubject",
          where: { teacherId },
          include: [
            { model: Class, as: "class" },
            { model: Subject, as: "subject" },
          ],
        },
      ],
    });
  }
}
