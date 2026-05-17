import jwt from "jsonwebtoken"
const ACCESS_SECRET = process.env.JWT_ACCESS_SECRET!;
const REFRESH_SECRET = process.env.JWT_REFRESH_SECRET!;
// User 
export const generateUserAccessToken = (payload: {id: string})=>{
  return jwt.sign(payload, ACCESS_SECRET, {expiresIn: '15m'});
}
export const generateUserRefreshToken = (payload: {id: string})=>{
  return jwt.sign(payload,REFRESH_SECRET, {expiresIn:'7d'})
}

// Account 
export const generateAccountAccessToken = (payload:{id: string, role: string})=>{
  return jwt.sign(payload, ACCESS_SECRET, {expiresIn:'15m'})
}
export const generateAccountRefreshToken = (payload: {id: string, role: string})=>{
  return jwt.sign(payload, REFRESH_SECRET, {expiresIn:'7d'})
}

//Verify 
export const verifyAccessToken = (token: string)=>{
  return jwt.verify(token, ACCESS_SECRET)
}
export const verifyRefreshToken = (token: string)=>{
  return jwt.verify(token, REFRESH_SECRET)
}