import { CookieOptions } from "express";

export const cookieConfig:CookieOptions={
  httpOnly: true,
  secure: false,
  sameSite: 'strict',
}