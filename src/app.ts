import express, { Request, Response, Application } from "express";
import cookieParser from "cookie-parser";
import authRoutes from "./routes/authRoutes";
import cardRoutes from "./routes/cardRoutes";
import cors from "cors";
import dotenv from "dotenv";
dotenv.config();


const app: Application = express();

app.use(cors({
  origin: process.env.FRONTEND_URL || "http://localhost:3000",
  credentials: true,
}));

app.use(express.json());
app.use(cookieParser());
app.use("/api/auth", authRoutes);
app.use("/api/cards", cardRoutes);


app.get("/", (_req: Request, res: Response) => {
  res.send("Kanban backend is good to go!");
});

export default app;
