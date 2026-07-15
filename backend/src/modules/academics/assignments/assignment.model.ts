import { Model, DataTypes } from "sequelize";
import sequelize from "../../../config/database";

export class Assignment extends Model {
  public id!: string;
  public title!: string;
  public description!: string;
  public classSubjectId!: string;
  public dueDate!: Date;
  public filePath?: string;
  public maxPoints!: number;

  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

Assignment.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    title: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    classSubjectId: {
      type: DataTypes.UUID,
      allowNull: false,
    },
    dueDate: {
      type: DataTypes.DATE,
      allowNull: false,
    },
    filePath: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    maxPoints: {
      type: DataTypes.INTEGER,
      defaultValue: 100,
      allowNull: false,
    },
  },
  {
    sequelize,
    tableName: "assignments",
  }
);
