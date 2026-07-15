import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import apiRouter from "./routes";
import { errorHandler } from "./middleware/errorHandler";

const app = express();

app.use(cors());
app.use(helmet());
app.use(morgan("dev"));
app.use(express.json());

// API Routes
app.use("/api", apiRouter);

app.get("/", (req, res) => {
  res.json({
    message: "School Management API Running",
  });
});

// Global Error Handler
app.use(errorHandler as any);

export default app;

