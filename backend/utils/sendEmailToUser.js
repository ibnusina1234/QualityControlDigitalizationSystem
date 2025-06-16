// utils/emailService.js
const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
  service: "gmail", // atau gunakan SMTP lain sesuai kebutuhan
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

exports.sendStatusEmail = async (to, subject, text) => {
      try {
            await transporter.sendMail({
              from: `"Quality Control Digitalization System" <${process.env.EMAIL_USER}>`,
              to,
              subject,
              text,
            });
          } catch (error) {
            console.error("❌ Failed to send email:", error);
            throw error; // ini penting agar error terlempar dan ditangani di router
          }
        };
