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
    const authHeader = req.header("Authorization");
    let token: string | undefined;

    if (authHeader && authHeader.startsWith("Bearer ")) {
      token = authHeader.split(" ")[1];
    } else if (req.cookies?.accessToken) {
      token = req.cookies.accessToken;
    }

    if (!token) return res.status(401).json({ error: "Unauthorized: no token provided" });

    const payload = verifyAccessToken(token);
    const user = await User.findById(payload._id).select("-password");
    if (!user) return res.status(401).json({ error: "Unauthorized: user not found" });

    req.user = user;
    next();
  } catch (err: any) {
    console.error("auth error:", err?.message ?? err);
    return res.status(401).json({ error: "Unauthorized: invalid token" });
  }
};
