import { Model, DataTypes } from "sequelize";
import sequelize from "../../config/database";

export class Fee extends Model {
  public id!: string;
  public title!: string;
  public amount!: number;
  public gradeLevel?: number; // Optional grade-specific fee
  public dueDate!: Date;
  public academicYear!: string;

  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

Fee.init(
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
    amount: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
    },
    gradeLevel: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    dueDate: {
      type: DataTypes.DATE,
      allowNull: false,
    },
    academicYear: {
      type: DataTypes.STRING,
      allowNull: false,
    },
  },
  {
    sequelize,
    tableName: "fees",
  }
);
