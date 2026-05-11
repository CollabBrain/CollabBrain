import crypto from "crypto"

export const generateNumber = (num: number) =>{
  if (num <= 0) {
    throw new Error("Số chữ số phải lớn hơn 0")
  }
  const min = 10 ** (num - 1)
  const max = 10 ** num
  return crypto.randomInt(min, max).toString()
}
