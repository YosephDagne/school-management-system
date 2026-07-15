import { Model, DataTypes } from "sequelize";
import sequelize from "../../config/database";

export class Document extends Model {
  public id!: string;
  public title!: string;
  public filePath!: string;
  public fileType!: string;
  public uploadedById!: string;
  public classId?: string; // Optional context, e.g. class resource folder

  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

Document.init(
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
    filePath: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    fileType: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    uploadedById: {
      type: DataTypes.UUID,
      allowNull: false,
    },
    classId: {
      type: DataTypes.UUID,
      allowNull: true,
    },
  },
  {
    sequelize,
    tableName: "documents",
  }
);
