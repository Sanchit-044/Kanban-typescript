import { Request, Response, NextFunction } from "express";
import { AppError } from "../utils/AppError";

export const errorHandler = (
  err: any,
  _req: Request,
  res: Response,
  _next: NextFunction
) => {
  console.error("Error:", err);

  const status = err.status || 500;

  const response: any = {
    error: status === 500 ? "Internal server error" : err.message,
  };

  if (process.env.NODE_ENV !== "production") {
    response.details = err.message;
  }

  res.status(status).json(response);
};
