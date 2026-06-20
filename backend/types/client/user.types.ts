//Register
export interface Register{
  email: string,
  password: string,
  name: string
}


export interface VerifyOTPRegister extends Register{
  otp: string
}

export interface VerifyOTP{
  email: string,
  otp: string
}

export interface ResetPassword extends VerifyOTP{
  password: string
}
export interface UserTypes {
  name?: string,
  avatarUrl?: string,
  coverUrl?: string,
  bio?: string
}
