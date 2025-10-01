// src/app.ts
import express, { Request, Response, Application } from "express";
import cookieParser from "cookie-parser";
import authRoutes from "./routes/authRoutes";
import cardRoutes from "./routes/cardRoutes";

const app: Application = express();

app.use(express.json());
app.use(cookieParser());
app.use("/api/auth", authRoutes);
app.use("/api/cards", cardRoutes);

app.get("/", (_req: Request, res: Response) => {
  res.send("Kanban backend is good to go!");
});

export default app;
