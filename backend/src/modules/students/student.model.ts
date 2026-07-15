import { Model, DataTypes } from "sequelize";
import sequelize from "../../config/database";

export class Student extends Model {
  public id!: string;
  public userId?: string;
  public admissionNumber!: string;
  public firstName!: string;
  public middleName!: string;
  public lastName!: string;
  public gender!: string;
  public dateOfBirth!: Date;
  public parentId!: string;
  public classId!: string;
  public status!: string; // 'Active' | 'Graduated' | 'Suspended' | 'Dropped_Out'

  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

Student.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    userId: {
      type: DataTypes.UUID,
      allowNull: true,
      unique: true,
    },
    admissionNumber: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
    },
    firstName: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    middleName: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    lastName: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    gender: {
      type: DataTypes.ENUM("M", "F"),
      allowNull: false,
    },
    dateOfBirth: {
      type: DataTypes.DATEONLY,
      allowNull: false,
    },
    parentId: {
      type: DataTypes.UUID,
      allowNull: false,
    },
    classId: {
      type: DataTypes.UUID,
      allowNull: true, // Can be unassigned initially
    },
    status: {
      type: DataTypes.STRING,
      defaultValue: "Active",
      allowNull: false,
    },
  },
  {
    sequelize,
    tableName: "students",
  }
);
