import nodemailer from "nodemailer"
import dotenv from "dotenv"
dotenv.config()
export const sendmail = (email:string, subject:string, html: string)=>{
const transporter = nodemailer.createTransport({
  service: 'gmail', 
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD
  },
});


const mailOptions = {
  from: process.env.EMAIL_USER,
  to: email, // List of recipients
  subject: subject, // Subject line
  
  html: html
};


transporter.sendMail(mailOptions, (error, info) => {
  if (error) {
    console.log('Error occurred:', error);
  } else {
    console.log('Email sent successfully!');
    console.log('Message ID:', info.messageId);
    // Preview only available when sending through an Ethereal account (see below)
    console.log('Preview URL: %s', nodemailer.getTestMessageUrl(info));
  }
});
}
