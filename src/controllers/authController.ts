import { Request, Response } from "express";
import User, { IUser } from "../models/users";
import { signAccessToken, signRefreshToken, verifyRefreshToken } from "../utils/token";

const ACCESS_COOKIE_NAME = "accessToken";
const REFRESH_COOKIE_NAME = "refreshToken";

const ACCESS_EXPIRES_MS = 15 * 60 * 1000;
const REFRESH_EXPIRES_MS = 7 * 24 * 60 * 60 * 1000;

const secureFlag = process.env.NODE_ENV === "production";


const getErrorMessage = (err: unknown): string =>
  err instanceof Error ? err.message : "Unknown error";


const accessCookieOptions = {
  httpOnly: true,
  secure: secureFlag,
  sameSite: "strict" as const,
  maxAge: ACCESS_EXPIRES_MS,
};


const refreshCookieOptions = {
  httpOnly: true,
  secure: secureFlag,
  sameSite: "strict" as const,
  maxAge: REFRESH_EXPIRES_MS,
};


export const signup = async (req: Request, res: Response) => {
  try {
    const { username, email, password } = req.body as {
      username?: string;
      email?: string;
      password?: string;
    };

    if (!username || !email || !password) {
      return res.status(400).json({ error: "username, email and password required" });
    }

    const existing = await User.findOne({ $or: [{ email }, { username }] });
    if (existing) {
      return res.status(409).json({ error: "User with email or username already exists" });
    }

    const user: IUser = new User({ username, email, password });
    await user.save();

    const accessToken = signAccessToken({ _id: user._id, email: user.email });
    const refreshToken = signRefreshToken({ _id: user._id });

    res.cookie(ACCESS_COOKIE_NAME, accessToken, accessCookieOptions);
    res.cookie(REFRESH_COOKIE_NAME, refreshToken, refreshCookieOptions);

    return res.status(201).json({
      message: "Account created",
      user: { id: user._id, username: user.username, email: user.email },
    });
  } catch (err: unknown) {
    console.error("signup error:", getErrorMessage(err));
    return res.status(500).json({ error: "Server error" });
  }
};


export const login = async (req: Request, res: Response) => {
  try {
    const { emailOrUsername, password } = req.body as {
      emailOrUsername?: string;
      password?: string;
    };

    if (!emailOrUsername || !password) {
      return res.status(400).json({ error: "Credentials required" });
    }

    const user = await User.findOne({
      $or: [{ email: emailOrUsername.toLowerCase() }, { username: emailOrUsername }],
    });

    if (!user) return res.status(400).json({ error: "Invalid username or email" });

    const passwordMatches = await user.checkPassword(password);
    if (!passwordMatches) return res.status(400).json({ error: "Invalid password" });

    const accessToken = signAccessToken({ _id: user._id, email: user.email });
    const refreshToken = signRefreshToken({ _id: user._id });

    res.cookie(ACCESS_COOKIE_NAME, accessToken, accessCookieOptions);
    res.cookie(REFRESH_COOKIE_NAME, refreshToken, refreshCookieOptions);

    return res.json({
      message: "Login successful",
      user: { id: user._id, username: user.username, email: user.email },
    });
  } catch (err: unknown) {
    console.error("login error:", getErrorMessage(err));
    return res.status(500).json({ error: "Server error" });
  }
};


export const refreshToken = async (req: Request, res: Response) => {
  try {
    const token = req.cookies?.[REFRESH_COOKIE_NAME] as string | undefined;
    if (!token) return res.status(401).json({ error: "No refresh token" });

    let payload: unknown;
    try {
      payload = verifyRefreshToken(token);
    } catch (e) {
      return res.status(401).json({ error: "Invalid or expired refresh token" });
    }

    if (!payload || typeof payload !== "object" || !("_id" in payload)) {
      return res.status(401).json({ error: "Invalid refresh token payload" });
    }

    const p = payload as { _id: string };

    const user = await User.findById(p._id).select("-password");
    if (!user) return res.status(401).json({ error: "User not found" });

    const newAccess = signAccessToken({ _id: user._id, email: user.email });
    const newRefresh = signRefreshToken({ _id: user._id });

    res.cookie(ACCESS_COOKIE_NAME, newAccess, accessCookieOptions);
    res.cookie(REFRESH_COOKIE_NAME, newRefresh, refreshCookieOptions);

    return res.json({ message: "Token refreshed" });
  } catch (err: unknown) {
    console.error("refresh error:", getErrorMessage(err));
    return res.status(500).json({ error: "Server error" });
  }
};

export const logout = async (req: Request, res: Response) => {
  try {
    res.clearCookie(ACCESS_COOKIE_NAME, {
      httpOnly: true,
      secure: secureFlag,
      sameSite: "strict",
    });
    res.clearCookie(REFRESH_COOKIE_NAME, {
      httpOnly: true,
      secure: secureFlag,
      sameSite: "strict",
    });

    return res.json({ message: "Logged out successfully" });
  } catch (err: unknown) {
    console.error("logout error:", getErrorMessage(err));
    return res.status(500).json({ error: "Server error" });
  }
};

export const me = async (req: Request, res: Response) => {
  try {
    if (!req.user) return res.status(401).json({ error: "Unauthorized" });
    const { _id, username, email, createdAt } = req.user;
    return res.json({ user: { id: _id, username, email, createdAt } });
  } catch (err: unknown) {
    console.error("me error:", getErrorMessage(err));
    return res.status(500).json({ error: "Server error" });
  }
};
