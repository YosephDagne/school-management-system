import { Model, DataTypes } from "sequelize";
import sequelize from "../../../config/database";

export class ClassSubject extends Model {
  public id!: string;
  public classId!: string;
  public subjectId!: string;
  public teacherId!: string;
  public subject!: any;

  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

ClassSubject.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    classId: {
      type: DataTypes.UUID,
      allowNull: false,
    },
    subjectId: {
      type: DataTypes.UUID,
      allowNull: false,
    },
    teacherId: {
      type: DataTypes.UUID,
      allowNull: false,
    },
  },
  {
    sequelize,
    tableName: "class_subjects",
    indexes: [
      {
        unique: true,
        fields: ["classId", "subjectId"],
      },
    ],
  }
);
