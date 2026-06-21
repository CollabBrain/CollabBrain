import nodemailer from "nodemailer"
import dotenv from "dotenv"

dotenv.config()

export const sendmail = async (email: string, subject: string, html: string) => {
  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASSWORD
    },
  });


  const mailOptions = {
    from: process.env.EMAIL_USER,
    to: email, 
    subject: subject, 
    html: html
  };


  await transporter.sendMail(mailOptions)
}
