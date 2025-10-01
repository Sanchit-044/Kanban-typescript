import dotenv from "dotenv";
dotenv.config();

import app from "./app";
import connectDB from "./config/db";
import { Server } from "http";

const PORT: number = Number(process.env.PORT) || 3000;

const start = async (): Promise<void> => {
  try {
    await connectDB();

    const server: Server = app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });

    const shutdown = (signal: string): void => {
      console.log(`Received ${signal}, shutting down...`);
      server.close(() => {
        console.log("Server closed");
        process.exit(0);
      });
    };

    process.on("SIGINT", () => shutdown("SIGINT"));
    process.on("SIGTERM", () => shutdown("SIGTERM"));
  } catch (err) {
    console.error("Failed to start app:", err);
    process.exit(1);
  }
};

start();
