import prisma from "../../config/prisma"
import bcrypt from "bcrypt"
import { generateUserAccessToken, generateUserRefreshToken } from "../../helpers/jwt";
import { createUser, deleteOTP, findOTPByEmail, findUserByEmail, saveOTP } from "../../repositories/client/user.repo";
import { Register } from "../../types/client/user.types";
import { generateNumber } from "../../helpers/generate";
import { sendmail } from "../../helpers/sendmail";

//Login
export const loginService = async ({ email, password }: { email: string, password: string }) => {
  const user = await findUserByEmail(email)
  if (!user) {
    throw new Error("Không tìm thấy user")
  }
  const isValid = await bcrypt.compare(password, user.passwordHash)
  if (!isValid) {
    throw new Error("Sai mật khẩu")
  }
  const accessToken = generateUserAccessToken({ id: user.id })
  const refreshToken = generateUserRefreshToken({ id: user.id })
  return { accessToken, refreshToken }
}


export const registerService = async (data: Register) => {
  const isExistUser = await findUserByEmail(data.email);
  if (isExistUser) {
    throw new Error("Người dùng đã tồn tại!!!")
  }

  const otp = generateNumber(6);
  const expiresAt = new Date(Date.now() + 5 * 60 * 1000);
  await saveOTP({ email: data.email, otp, expiresAt });

  const subject = "OTP Xác Thực Đăng Kí";
  const html = `Mã OTP của bạn là <b>${otp}</b>. Mã sẽ hết hạn sau 5 phút`;
  await sendmail(data.email, subject,html)

  return {
    message: "Đã gửi OTP về mail"
  }
}
export const verifyOTPRegister = async (data: { email: string, otp: string, password: string, name: string }) => {

  const record = await findOTPByEmail(data.email);
  if (!record) throw new Error("OTP không tồn tại");
  if (record.otp !== data.otp) throw new Error("OTP không đúng");
  if (record.expiresAt < new Date()) throw new Error("OTP đã hết hạn");

  const passwordHash = await bcrypt.hash(data.password, 10);
  const user = await createUser({ email: data.email, passwordHash, name: data.name });

  await deleteOTP(data.email);

  //trả token
  const accessToken = generateUserAccessToken({ id: user.id });
  const refreshToken = generateUserRefreshToken({ id: user.id });

  return { accessToken, refreshToken };
}
