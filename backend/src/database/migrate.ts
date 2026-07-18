import sequelize from "../config/database";
import { QueryInterface, DataTypes } from "sequelize";

interface Migration {
  name: string;
  up: (qi: QueryInterface) => Promise<void>;
  down: (qi: QueryInterface) => Promise<void>;
}

const migrations: Migration[] = [
  {
    name: "20260718000000-setup-rbac-many-to-many",
    up: async (qi: QueryInterface) => {
      // 1. Create user_roles table if not exists
      await qi.createTable("user_roles", {
        id: {
          type: DataTypes.UUID,
          defaultValue: DataTypes.UUIDV4,
          primaryKey: true,
        },
        userId: {
          type: DataTypes.UUID,
          allowNull: false,
          references: { model: "users", key: "id" },
          onDelete: "CASCADE",
        },
        roleId: {
          type: DataTypes.UUID,
          allowNull: false,
          references: { model: "roles", key: "id" },
          onDelete: "CASCADE",
        },
        createdAt: {
          type: DataTypes.DATE,
          allowNull: false,
        },
        updatedAt: {
          type: DataTypes.DATE,
          allowNull: false,
        },
      });

      // Add unique constraint for userId + roleId
      await qi.addIndex("user_roles", ["userId", "roleId"], {
        unique: true,
        name: "user_roles_user_id_role_id_unique",
      });

      // 2. Create role_permissions table if not exists
      await qi.createTable("role_permissions", {
        id: {
          type: DataTypes.UUID,
          defaultValue: DataTypes.UUIDV4,
          primaryKey: true,
        },
        roleId: {
          type: DataTypes.UUID,
          allowNull: false,
          references: { model: "roles", key: "id" },
          onDelete: "CASCADE",
        },
        permissionId: {
          type: DataTypes.UUID,
          allowNull: false,
          references: { model: "permissions", key: "id" },
          onDelete: "CASCADE",
        },
        createdAt: {
          type: DataTypes.DATE,
          allowNull: false,
        },
        updatedAt: {
          type: DataTypes.DATE,
          allowNull: false,
        },
      });

      // Add unique constraint for roleId + permissionId
      await qi.addIndex("role_permissions", ["roleId", "permissionId"], {
        unique: true,
        name: "role_permissions_role_id_permission_id_unique",
      });

      // 3. Add module to audit_logs
      const auditTableDesc = await qi.describeTable("audit_logs").catch(() => ({}));
      if (!(auditTableDesc as any).module) {
        await qi.addColumn("audit_logs", "module", {
          type: DataTypes.STRING,
          allowNull: false,
          defaultValue: "General",
        });
      }

      // 4. Add department to teachers
      const teachersTableDesc = await qi.describeTable("teachers").catch(() => ({}));
      if (!(teachersTableDesc as any).department) {
        await qi.addColumn("teachers", "department", {
          type: DataTypes.STRING,
          allowNull: true,
        });
      }

      // 5. Add department to subjects
      const subjectsTableDesc = await qi.describeTable("subjects").catch(() => ({}));
      if (!(subjectsTableDesc as any).department) {
        await qi.addColumn("subjects", "department", {
          type: DataTypes.STRING,
          allowNull: true,
        });
      }

      // 6. Add isNationalExam to exams
      const examsTableDesc = await qi.describeTable("exams").catch(() => ({}));
      if (!(examsTableDesc as any).isNationalExam) {
        await qi.addColumn("exams", "isNationalExam", {
          type: DataTypes.BOOLEAN,
          defaultValue: false,
          allowNull: false,
        });
      }

      // 7. Migrate existing users from users.roleId to user_roles
      const usersTableDesc = await qi.describeTable("users").catch(() => ({}));
      if ((usersTableDesc as any).roleId) {
        console.log("Migrating users roles to user_roles join table...");
        const users: any[] = await sequelize.query(
          `SELECT id, "roleId" FROM users WHERE "roleId" IS NOT NULL`,
          { type: "SELECT" as any }
        );

        for (const user of users) {
          await sequelize.query(
            `INSERT INTO user_roles (id, "userId", "roleId", "createdAt", "updatedAt") 
             VALUES (gen_random_uuid(), :userId, :roleId, NOW(), NOW())
             ON CONFLICT ("userId", "roleId") DO NOTHING`,
            {
              replacements: { userId: user.id, roleId: user.roleId },
            }
          );
        }

        // Drop foreign key and column roleId from users table
        try {
          await qi.removeColumn("users", "roleId");
          console.log("Dropped roleId column from users table successfully.");
        } catch (colErr) {
          console.warn("Could not drop roleId column directly (might have constraints). Attempting cascade drop.");
          await sequelize.query(`ALTER TABLE users DROP COLUMN IF EXISTS "roleId" CASCADE;`);
        }
      }
    },
    down: async (qi: QueryInterface) => {
      // Re-add roleId to users
      await qi.addColumn("users", "roleId", {
        type: DataTypes.UUID,
        allowNull: true,
      });

      // Drop new tables and columns
      await qi.dropTable("user_roles");
      await qi.dropTable("role_permissions");
      await qi.removeColumn("audit_logs", "module");
      await qi.removeColumn("teachers", "department");
      await qi.removeColumn("subjects", "department");
      await qi.removeColumn("exams", "isNationalExam");
    },
  },
];

export async function runMigrations() {
  console.log("Initializing database migrations...");
  const qi = sequelize.getQueryInterface();

  // Create migration log table if not exists
  await sequelize.query(`
    CREATE TABLE IF NOT EXISTS "sequelize_meta" (
      "name" VARCHAR(255) PRIMARY KEY
    );
  `);

  // Fetch already-run migrations
  const runLogs: any[] = await sequelize.query(`SELECT name FROM "sequelize_meta"`, {
    type: "SELECT" as any,
  });
  const runMigrationNames = new Set(runLogs.map((log) => log.name));

  for (const m of migrations) {
    if (!runMigrationNames.has(m.name)) {
      console.log(`Applying migration: ${m.name}`);
      const transaction = await sequelize.transaction();
      try {
        await m.up(qi);
        await sequelize.query(`INSERT INTO "sequelize_meta" (name) VALUES (:name)`, {
          replacements: { name: m.name },
          transaction,
        });
        await transaction.commit();
        console.log(`Migration ${m.name} applied successfully.`);
      } catch (err) {
        await transaction.rollback();
        console.error(`Migration ${m.name} failed. Transaction rolled back.`, err);
        throw err;
      }
    } else {
      console.log(`Migration ${m.name} is already applied.`);
    }
  }

  console.log("All migrations checked and up to date.");
}
