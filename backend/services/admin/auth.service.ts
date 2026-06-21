import { generateAccountAccessToken, generateAccountRefreshToken } from "../../helpers/jwt";
import {findAccountByUsername } from "../../repositories/admin/admin.repo"
import bcrypt from "bcrypt"
export const authService = async (username: string, password: string)=>{
  const user = await findAccountByUsername(username);
  if(!user){
    throw new Error("Không tồn tại account")
  }
  const isMatch = await bcrypt.compare(password,user.passwordHash)
  if(!isMatch){
    throw new Error("Sai mật khẩu vui lòng thử lại")
  } 
  const accessToken = generateAccountAccessToken({
  id: user.id,
  role: user.role
});

const refreshToken = generateAccountRefreshToken({
  id: user.id,
  role: user.role
});

return {
  accessToken,
  refreshToken,
  role: user.role,
  url: "/admin/profile"
};
}