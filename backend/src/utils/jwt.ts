import jwt from "jsonwebtoken";
import { ENV } from "../config/env";

const ACCESS_TOKEN_EXPIRY = "15m";
const REFRESH_TOKEN_EXPIRY = "7d";

export function generateAccessToken(payload: object) {
  return jwt.sign(payload, ENV.JWT_SECRET, {
    expiresIn: ACCESS_TOKEN_EXPIRY,
  });
}

export function generateRefreshToken(payload: object) {
  const refreshSecret = ENV.JWT_REFRESH_SECRET || ENV.JWT_SECRET + "_refresh";
  return jwt.sign(payload, refreshSecret, {
    expiresIn: REFRESH_TOKEN_EXPIRY,
  });
}

/** @deprecated Use generateAccessToken */
export function generateToken(payload: object) {
  return generateAccessToken(payload);
}

export function verifyToken(token: string) {
  return jwt.verify(token, ENV.JWT_SECRET);
}

export function verifyRefreshToken(token: string) {
  const refreshSecret = ENV.JWT_REFRESH_SECRET || ENV.JWT_SECRET + "_refresh";
  return jwt.verify(token, refreshSecret);
}
