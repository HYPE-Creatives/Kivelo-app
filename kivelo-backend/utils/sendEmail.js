// utils/sendEmail.js
import nodemailer from 'nodemailer';

const sendEmail = async (to, subject, html) => {
  try {
    const transporter = nodemailer.createTransport({
      host: 'smtp.gmail.com',
      port: 587,
      secure: false,
      auth: {
        user: process.env.GMAIL_USER,
        pass: process.env.GMAIL_APP_PASSWORD,
      },
      connectionTimeout: 120000, // 120 seconds
      greetingTimeout: 120000,
      socketTimeout: 120000,
    });

    const mailOptions = {
      from: '"Kivelo" <dawoduolalekanfatai@gmail.com>',
      to: to,
      subject: subject,
      html: html,
    };

    // Test connection first
    await transporter.verify();
    console.log('✅ SMTP connection verified');

    const response = await transporter.sendMail(mailOptions);
    console.log(`✅ Email sent successfully to ${to}`);
    return { success: true, response };
    
  } catch (error) {
    console.error('❌ Gmail error:', error.message);
    return { success: false, error: error.message };
  }
};

export default sendEmail;