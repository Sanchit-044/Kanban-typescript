import { Request, Response } from "express";
import User, { IUser } from "../models/users";
import { signAccessToken, signRefreshToken, verifyRefreshToken } from "../utils/token";
import bcrypt from "bcryptjs";

const COOKIE_NAME = "jid";
const refreshCookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "strict" as const,
  maxAge: 7 * 24 * 60 * 60 * 1000,
};

// SIGNUP
export const signup = async (req: Request, res: Response) => {
  try {
    const { username, email, password } = req.body;
    if (!username || !email || !password)
      return res.status(400).json({ error: "username, email and password required" });

    const existing = await User.findOne({ $or: [{ email }, { username }] });
    if (existing) return res.status(409).json({ error: "User already exists" });

    const user: IUser = new User({ username, email, password });
    await user.save();

    const accessToken = signAccessToken({ _id: user._id, email: user.email });
    const refreshToken = signRefreshToken({ _id: user._id });

    user.refreshTokens.push(refreshToken);
    await user.save();

    res.cookie(COOKIE_NAME, refreshToken, refreshCookieOptions);

    return res.status(201).json({
      message: "Account created",
      accessToken,
      user: { id: user._id, username: user.username, email: user.email },
    });
  } catch (err: any) {
    console.error("signup error:", err);
    return res.status(500).json({ error: "Server error" });
  }
};

// LOGIN
export const login = async (req: Request, res: Response) => {
  try {
    const { emailOrUsername, password } = req.body;
    if (!emailOrUsername || !password)
      return res.status(400).json({ error: "Credentials required" });

    const user = await User.findOne({
      $or: [{ email: emailOrUsername.toLowerCase() }, { username: emailOrUsername }],
    });
    if (!user) return res.status(400).json({ error: "Invalid credentials" });

    const isMatch = await user.checkPassword(password);
    if (!isMatch) return res.status(400).json({ error: "Invalid credentials" });

    const accessToken = signAccessToken({ _id: user._id, email: user.email });
    const refreshToken = signRefreshToken({ _id: user._id });

    user.refreshTokens.push(refreshToken);
    await user.save();

    res.cookie(COOKIE_NAME, refreshToken, refreshCookieOptions);

    return res.json({
      message: "Login successful",
      accessToken,
      user: { id: user._id, username: user.username, email: user.email },
    });
  } catch (err: any) {
    console.error("login error:", err);
    return res.status(500).json({ error: "Server error" });
  }
};

// REFRESH TOKEN
export const refreshToken = async (req: Request, res: Response) => {
  try {
    const token = req.cookies?.[COOKIE_NAME];
    if (!token) return res.status(401).json({ error: "No refresh token" });

    let payload: any;
    try {
      payload = verifyRefreshToken(token);
    } catch (e) {
      return res.status(401).json({ error: "Invalid refresh token" });
    }

    const user = await User.findById(payload._id);
    if (!user) return res.status(401).json({ error: "User not found" });

    if (!user.refreshTokens.includes(token))
      return res.status(401).json({ error: "Refresh token is revoked" });

    // Replace old refresh token with new
    user.refreshTokens = user.refreshTokens.filter(t => t !== token);
    const newRefresh = signRefreshToken({ _id: user._id });
    user.refreshTokens.push(newRefresh);
    await user.save();

    const newAccess = signAccessToken({ _id: user._id, email: user.email });
    res.cookie(COOKIE_NAME, newRefresh, refreshCookieOptions);

    return res.json({ accessToken: newAccess });
  } catch (err: any) {
    console.error("refresh error:", err);
    return res.status(500).json({ error: "Server error" });
  }
};

// LOGOUT
export const logout = async (req: Request, res: Response) => {
  try {
    const token = req.cookies?.[COOKIE_NAME];
    if (token) {
      await User.updateOne({ refreshTokens: token }, { $pull: { refreshTokens: token } });
    }

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

// GET CURRENT USER
export const me = async (req: Request, res: Response) => {
  if (!req.user) return res.status(401).json({ error: "Unauthorized" });
  const { _id, username, email, createdAt } = req.user;
  return res.json({ user: { id: _id, username, email, createdAt } });
};
