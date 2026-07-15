import { Model, DataTypes } from "sequelize";
import sequelize from "../../../config/database";

export class Subject extends Model {
  public id!: string;
  public name!: string;
  public code!: string;
  public gradeLevel!: number;
  public stream!: string; // 'General' | 'NaturalScience' | 'SocialScience'

  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

Subject.init(
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
    code: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
    },
    gradeLevel: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    stream: {
      type: DataTypes.STRING,
      defaultValue: "General",
      allowNull: false,
    },
  },
  {
    sequelize,
    tableName: "subjects",
  }
);
