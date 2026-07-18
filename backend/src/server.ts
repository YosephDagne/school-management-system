import dotenv from "dotenv";
import app from "./app";
import sequelize from "./config/database";
import { setupAssociations } from "./database/associations";
import { runMigrations } from "./database/migrate";

dotenv.config();

const PORT = process.env.PORT || 5000;

// Setup model relationships
setupAssociations();

sequelize
  .authenticate()
  .then(async () => {
    console.log("PostgreSQL connected");
    
    // Run database migrations
    await runMigrations();
    
    // Sync models to database tables
    await sequelize.sync();
    console.log("Database models synchronized");

    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  })
  .catch((error) => {
    console.log("Database connection failed", error);
  });

