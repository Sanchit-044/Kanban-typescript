// src/middleware/auth.ts
import { Request, Response, NextFunction } from "express";
import User, { IUser } from "../models/users";
import { verifyAccessToken } from "../utils/token";

declare global {
  namespace Express {
    interface Request { user?: IUser; }
  }
}


export const auth = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const token = req.cookies?.accessToken as string | undefined;
    if (!token) {
      return res.status(401).json({ error: "Unauthorized: access token missing" });
    }

    let payload: unknown;
    try {
      payload = verifyAccessToken(token);
    } catch (err) {
      return res.status(401).json({ error: "Unauthorized: invalid or expired access token" });
    }

    if (!payload || typeof payload !== "object" || !("_id" in payload)) {
      return res.status(401).json({ error: "Unauthorized: invalid token payload" });
    }

    const p = payload as { _id: string };

    const user = await User.findById(p._id).select("-password");
    if (!user) {
      return res.status(401).json({ error: "Unauthorized: user not found" });
    }

    req.user = user;
    next();
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown error in auth middleware";
    console.error("auth middleware error:", message);
    return res.status(500).json({ error: "Internal server error" });
  }
};
