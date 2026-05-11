import bcrypt from "bcrypt"
import { generateUserAccessToken, generateUserRefreshToken } from "../../helpers/jwt";
import { createUser, deleteOTP, findAnyUserByEmail, findOTPByEmail, findUserByEmail, resetPasswordUser, saveOTP } from "../../repositories/client/user.repo";
import { Register, ResetPassword, VerifyOTPRegister } from "../../types/client/user.types";
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
  const isExistUser = await findAnyUserByEmail(data.email);
  if (isExistUser) {
    throw new Error("Người dùng đã tồn tại!!!")
  }

  const otp = generateNumber(6);
  const expiresAt = new Date(Date.now() + 5 * 60 * 1000);
  await saveOTP({ email: data.email, otp, expiresAt });

  const subject = "OTP Xác Thực Đăng Kí";
  const html = `Mã OTP của bạn là <b>${otp}</b>. Mã sẽ hết hạn sau 5 phút`;
  await sendmail(data.email, subject, html)

  return {
    message: "Đã gửi OTP về mail"
  }
}

export const verifyOTPRegister = async (data: VerifyOTPRegister) => {
  const isExistUser = await findAnyUserByEmail(data.email);
  if (isExistUser) {
    throw new Error("Người dùng đã tồn tại!!!")
  }

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

//ForgotPassService
export const forgotPasswordServiceSendMail = async (email: string) =>{
  const user = await findUserByEmail(email)
  if(!user){
    throw new Error("Không tìm thấy tài khoản")
  }
  const otp = generateNumber(6);
  const expiresAt = new Date(Date.now() + 5 * 60 * 1000);
  await saveOTP({email, otp, expiresAt})

  const subject = "CollabBrain Mã OTP reset mật khẩu"
  const html = `Mã OTP của bạn là <b>${otp}</b>. Mã có hiệu lực trong 5 phút`
  await sendmail(email, subject, html);

  return {
    message: "Đã gửi OTP về mail"
  }
}

const checkOTPForgotPassword = async(email: string, otp: string)=>{
  const record = await findOTPByEmail(email);
  if (!record) throw new Error("OTP không tồn tại");
  if (record.otp !== otp) throw new Error("OTP không đúng");
  if (record.expiresAt < new Date()) throw new Error("OTP đã hết hạn");
  return record;
}

//VerifyOTPPassword
export const verifyOTPForgotPassword = async(email: string, otp: string)=>{
  const user = await findUserByEmail(email)
  if(!user){
    throw new Error("Không tìm thấy tài khoản")
  }
  await checkOTPForgotPassword(email, otp)
  return {
    message: "Xác thực OTP thành công"
  }
}

//ResetPassword
const salt = 10
export const resetPasswordService = async({email, otp, password}: ResetPassword)=>{
  const user = await findUserByEmail(email)
  if(!user){
    throw new Error("Không tìm thấy tài khoản")
  }

  await checkOTPForgotPassword(email, otp)
  const passwordHash = await bcrypt.hash(password, salt)
  await resetPasswordUser({email, passwordHash})
  await deleteOTP(email)

  return {
    message: "Đổi mật khẩu thành công"
  }
}
