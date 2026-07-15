import dotenv from "dotenv";
import path from "path";

dotenv.config({ path: path.join(__dirname, "../../.env") });

export const ENV = {
  PORT: process.env.PORT || "5000",
  DB_HOST: process.env.DB_HOST || "localhost",
  DB_PORT: process.env.DB_PORT || "5432",
  DB_NAME: process.env.DB_NAME || "school_management",
  DB_USER: process.env.DB_USER || "postgres",
  DB_PASSWORD: process.env.DB_PASSWORD || "",
  JWT_SECRET: process.env.JWT_SECRET || "fallback_super_secret_key_12345",
  NODE_ENV: process.env.NODE_ENV || "development",
};
