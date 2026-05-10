import crypto from "crypto"
export const generateNumber = (num: number) =>{
  const min = 10**num -1
  const max = 10 ** num
  return crypto.randomInt(min, max).toString()
}