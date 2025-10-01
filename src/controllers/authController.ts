import { Request, Response } from "express";
import User, { IUser } from "../models/users";

const COOKIE_NAME = "jwt";
const cookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "strict" as const,
  maxAge: 7 * 24 * 60 * 60 * 1000,
};

export const signup = async (req: Request, res: Response) => {
  try {
    const { username, email, password } = req.body;
    if (!username || !email || !password) {
      return res
        .status(400)
        .json({ error: "username, email and password required" });
    }

    const existing = await User.findOne({ $or: [{ email }, { username }] });
    if (existing)
      return res
        .status(409)
        .json({ error: "User with email or username already exists" });

    const user: IUser = new User({ username, email, password });
    await user.save();

    const token = user.generateAuthToken();
    res.cookie(COOKIE_NAME, token, cookieOptions);
    return res.status(201).json({
      message: "Account created",
      user: { id: user._id, username: user.username, email: user.email },
    });
  } catch (err: any) {
    console.error("signup error:", err);
    return res.status(500).json({ error: "Server error" });
  }
};

export const login = async (req: Request, res: Response) => {
  try {
    const { emailOrUsername, password } = req.body;
    if (!emailOrUsername || !password)
      return res.status(400).json({ error: "Credentials required" });

    const user = await User.findOne({
      $or: [
        { email: emailOrUsername.toLowerCase() },
        { username: emailOrUsername },
      ],
    });

    if (!user) return res.status(400).json({ error: "Invalid credentials" });

    const isMatch = await user.checkPassword(password);
    if (!isMatch) return res.status(400).json({ error: "Invalid credentials" });

    const token = user.generateAuthToken();
    res.cookie(COOKIE_NAME, token, cookieOptions);

    return res.json({
      message: "Login successful",
      user: { id: user._id, username: user.username, email: user.email },
    });
  } catch (err: any) {
    console.error("login error:", err);
    return res.status(500).json({ error: "Server error" });
  }
};

export const logout = async (req: Request, res: Response) => {
  try {
    res.clearCookie(COOKIE_NAME, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
    });
    return res.json({ message: "Logged out" });
  } catch (err: any) {
    console.error("logout error:", err);
    return res.status(500).json({ error: "Server error" });
  }
};

export const me = async (req: Request, res: Response) => {
  if (!req.user) return res.status(401).json({ error: "Unauthorized" });
  const { _id, username, email, createdAt } = req.user;
  return res.json({ user: { id: _id, username, email, createdAt } });
};
