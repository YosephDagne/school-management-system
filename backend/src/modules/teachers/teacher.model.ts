import { Model, DataTypes } from "sequelize";
import sequelize from "../../config/database";

export class Teacher extends Model {
  public id!: string;
  public userId!: string;
  public employeeId!: string;
  public firstName!: string;
  public middleName!: string;
  public lastName!: string;
  public phoneNumber!: string;
  public email?: string;
  public qualification!: string;
  public specialization!: string;
  public status!: string; // 'Active' | 'Inactive' | 'On_Leave'
  public department?: string;

  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

Teacher.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    userId: {
      type: DataTypes.UUID,
      allowNull: false,
      unique: true,
    },
    employeeId: {
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
    phoneNumber: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    email: {
      type: DataTypes.STRING,
      allowNull: true,
      validate: {
        isEmail: true,
      },
    },
    qualification: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    specialization: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    status: {
      type: DataTypes.STRING,
      defaultValue: "Active",
      allowNull: false,
    },
    department: {
      type: DataTypes.STRING,
      allowNull: true,
    },
  },
  {
    sequelize,
    tableName: "teachers",
  }
);
