import nodemailer from "nodemailer"
import dotenv from "dotenv"

dotenv.config()

export const sendmail = async (email:string, subject:string, html: string)=>{
  const user = process.env.EMAIL_USER;
  const pass = process.env.EMAIL_PASSWORD;

  if (!user || !pass) {
    throw new Error("Thiếu cấu hình email")
  }

  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user,
      pass
    },
  });

  await transporter.sendMail({
    from: user,
    to: email,
    subject: subject,
    html: html
  });
}
