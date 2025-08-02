import express from "express";
import cors from "cors";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import dotenv from "dotenv";
dotenv.config();

import connectDB from "./config/db.js";
import authRoutes from "./routes/auth.js";
import courseRoutes from "./routes/courses.js";
import userRoutes from "./routes/users.js";
import progressRoutes from "./routes/progress.js";
import gamificationRoutes from "./routes/gamification.js";

import { errorHandler } from "./middleware/errorHandler.js";
import { authMiddleware } from "./middleware/auth.js";
const PORT = process.env.PORT || 5000;

const app = express();
app.use(helmet());

app.use(
  cors({
    origin: process.env.FRONTEND_URL || "http://localhost:3000",
    credentials: true,
  })
);

const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000, // 15 minutes
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100, // limit each IP to 100 requests per windowMs
  message: "Too many requests from this IP, please try again later.",
});
app.use("/api/", limiter);

app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

app.use("/api/auth", authRoutes);
app.use("/api/courses", courseRoutes);
app.use("/api/users", authMiddleware, userRoutes);
app.use("/api/progress", authMiddleware, progressRoutes);
app.use("/api/gamification", authMiddleware, gamificationRoutes);

app.get("/api/health", (req, res) => {
  res.json({
    status: "OK",
    message: "PlayLMS API is running",
    timestamp: new Date().toISOString(),
  });
});
app.use(errorHandler);
app.use("*", (req, res) => {
  res.status(404).json({ message: "Route not found" });
});

app.listen(PORT, () => {
  connectDB();
  console.log(`Server running on port ${PORT}`);
  console.log(`Environment: ${process.env.NODE_ENV || "development"}`);
});

export default app;
