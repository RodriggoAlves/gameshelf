require('dotenv').config({ path: '.env' });
const nodemailer = require('nodemailer');

async function testEmail() {
  console.log("Testing email with user:", process.env.EMAIL_USER);
  
  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS
    }
  });

  try {
    const info = await transporter.verify();
    console.log("Server is ready to take our messages:", info);
    
    const sendResult = await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: process.env.EMAIL_USER,
      subject: "Test Email from Zerey",
      text: "This is a test email to verify credentials."
    });
    console.log("Email sent successfully:", sendResult.messageId);
  } catch (error) {
    console.error("Error during email test:");
    console.error(error);
  }
}

testEmail();
