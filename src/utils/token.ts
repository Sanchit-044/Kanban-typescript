import jwt, { Secret } from "jsonwebtoken";

const ACCESS_SECRET = process.env.ACCESS_TOKEN_SECRET;
const REFRESH_SECRET = process.env.REFRESH_TOKEN_SECRET;

if (!ACCESS_SECRET) throw new Error("ACCESS_TOKEN_SECRET is not set");
if (!REFRESH_SECRET) throw new Error("REFRESH_TOKEN_SECRET is not set");

const ACCESS_SECRET_KEY: Secret = ACCESS_SECRET;
const REFRESH_SECRET_KEY: Secret = REFRESH_SECRET;

export const signAccessToken = (payload: object): string => {
  return jwt.sign(payload, ACCESS_SECRET_KEY, { expiresIn: "15m" });
};

export const signRefreshToken = (payload: object): string => {
  return jwt.sign(payload, REFRESH_SECRET_KEY, { expiresIn: "7d" });
};

export const verifyAccessToken = (token: string): unknown => {
  return jwt.verify(token, ACCESS_SECRET_KEY);
};

export const verifyRefreshToken = (token: string): unknown => {
  return jwt.verify(token, REFRESH_SECRET_KEY);
};
