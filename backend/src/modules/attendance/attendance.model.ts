import { Model, DataTypes } from "sequelize";
import sequelize from "../../config/database";

export class Attendance extends Model {
  public id!: string;
  public studentId!: string;
  public classId!: string;
  public subjectId?: string; // Nullable for general homeroom attendance
  public date!: string; // DateOnly YYYY-MM-DD
  public status!: string; // 'Present' | 'Absent' | 'Late' | 'Excused'
  public recordedById!: string;

  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

Attendance.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    studentId: {
      type: DataTypes.UUID,
      allowNull: false,
    },
    classId: {
      type: DataTypes.UUID,
      allowNull: false,
    },
    subjectId: {
      type: DataTypes.UUID,
      allowNull: true,
    },
    date: {
      type: DataTypes.DATEONLY,
      allowNull: false,
    },
    status: {
      type: DataTypes.ENUM("Present", "Absent", "Late", "Excused"),
      allowNull: false,
    },
    recordedById: {
      type: DataTypes.UUID,
      allowNull: false,
    },
  },
  {
    sequelize,
    tableName: "attendances",
    indexes: [
      {
        unique: true,
        fields: ["studentId", "classId", "subjectId", "date"],
        name: "attendance_student_subject_date_unique",
      },
    ],
  }
);
