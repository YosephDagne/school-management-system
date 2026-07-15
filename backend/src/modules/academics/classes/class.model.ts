import { Model, DataTypes } from "sequelize";
import sequelize from "../../../config/database";

export class Class extends Model {
  public id!: string;
  public name!: string;
  public gradeLevel!: number; // 9, 10, 11, 12
  public academicYear!: string; // e.g. "2026-2027"
  public homeroomTeacherId!: string;

  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

Class.init(
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
    gradeLevel: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    academicYear: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    homeroomTeacherId: {
      type: DataTypes.UUID,
      allowNull: true, // Can be assigned later
    },
  },
  {
    sequelize,
    tableName: "classes",
  }
);
