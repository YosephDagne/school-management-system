import { Model, DataTypes } from "sequelize";
import sequelize from "../../../config/database";

export class Exam extends Model {
  public id!: string;
  public name!: string;
  public type!: string; // 'Exam' | 'Quiz' | 'Assignment' | 'Project' | 'Practical'
  public classSubjectId!: string;
  public maxMarks!: number;
  public weightage!: number; // percentage, e.g. 30.0 for 30%
  public semester!: string; // 'Semester_1' | 'Semester_2'
  public academicYear!: string; // e.g. "2026-2027"

  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

Exam.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    type: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    classSubjectId: {
      type: DataTypes.UUID,
      allowNull: false,
    },
    maxMarks: {
      type: DataTypes.DECIMAL(5, 2),
      allowNull: false,
    },
    weightage: {
      type: DataTypes.DECIMAL(5, 2),
      allowNull: false,
    },
    semester: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    academicYear: {
      type: DataTypes.STRING,
      allowNull: false,
    },
  },
  {
    sequelize,
    tableName: "exams",
  }
);
