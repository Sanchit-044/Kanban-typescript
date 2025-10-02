import { Request, Response } from "express";
import User, { IUser } from "../models/users";
import {
  signAccessToken,
  signRefreshToken,
  verifyRefreshToken,
} from "../utils/token";
import { asyncHandler } from "../utils/asyncHandler";
import { AppError } from "../utils/AppError";
import ms from "ms";

const ACCESS_COOKIE_NAME = "accessToken";
const REFRESH_COOKIE_NAME = "refreshToken";

const ACCESS_EXPIRES_MS = ms("15m");
const REFRESH_EXPIRES_MS = ms("7d");

const secureFlag = process.env.NODE_ENV === "production";

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

export const signup = asyncHandler(async (req: Request, res: Response) => {
  const { username, email, password } = req.body as {
    username?: string;
    email?: string;
    password?: string;
  };

  if (!username || !email || !password) {
    throw new AppError("username, email and password required", 400);
  }

  const existing = await User.findOne({ $or: [{ email }, { username }] });
  if (existing) {
    throw new AppError("User with email or username already exists", 409);
  }

  const user: IUser = new User({ username, email, password });
  await user.save();

  const accessToken = signAccessToken({ _id: user._id, email: user.email });
  const refreshToken = signRefreshToken({ _id: user._id });

  res.cookie(ACCESS_COOKIE_NAME, accessToken, accessCookieOptions);
  res.cookie(REFRESH_COOKIE_NAME, refreshToken, refreshCookieOptions);

  res.status(201).json({
    message: "Account created",
    user: { id: user._id, username: user.username, email: user.email },
  });
});

export const login = asyncHandler(async (req: Request, res: Response) => {
  const { emailOrUsername, password } = req.body as {
    emailOrUsername?: string;
    password?: string;
  };

  if (!emailOrUsername || !password) {
    throw new AppError("Credentials required", 400);
  }

  const user = await User.findOne({
    $or: [
      { email: emailOrUsername.toLowerCase() },
      { username: emailOrUsername },
    ],
  });

  if (!user) throw new AppError("Invalid username or email", 400);

  const passwordMatches = await user.checkPassword(password);
  if (!passwordMatches) throw new AppError("Invalid password", 400);

  const accessToken = signAccessToken({ _id: user._id, email: user.email });
  const refreshToken = signRefreshToken({ _id: user._id });

  res.cookie(ACCESS_COOKIE_NAME, accessToken, accessCookieOptions);
  res.cookie(REFRESH_COOKIE_NAME, refreshToken, refreshCookieOptions);

  res.json({
    message: "Login successful",
    user: { id: user._id, username: user.username, email: user.email },
  });
});

export const refreshToken = asyncHandler(
  async (req: Request, res: Response) => {
    const token = req.cookies?.[REFRESH_COOKIE_NAME] as string | undefined;
    if (!token) throw new AppError("No refresh token", 401);

    let payload: unknown;
    try {
      payload = verifyRefreshToken(token);
    } catch (e) {
      throw new AppError("Invalid or expired refresh token", 401);
    }

    if (!payload || typeof payload !== "object" || !("_id" in payload)) {
      throw new AppError("Invalid refresh token payload", 401);
    }

    const { _id } = payload as { _id: string };

    const user = await User.findById(_id).select("-password");
    if (!user) throw new AppError("User not found", 401);

    const newAccess = signAccessToken({ _id: user._id, email: user.email });
    const newRefresh = signRefreshToken({ _id: user._id });

    res.cookie(ACCESS_COOKIE_NAME, newAccess, accessCookieOptions);
    res.cookie(REFRESH_COOKIE_NAME, newRefresh, refreshCookieOptions);

    res.json({ message: "Token refreshed" });
  }
);

export const logout = asyncHandler(async (_req: Request, res: Response) => {
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

  res.json({ message: "Logged out successfully" });
});

export const me = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) throw new AppError("Unauthorized", 401);

  const { _id, username, email, createdAt } = req.user;
  res.json({ user: { id: _id, username, email, createdAt } });
});
