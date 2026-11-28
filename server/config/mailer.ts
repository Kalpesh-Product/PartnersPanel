import nodemailer from "nodemailer";
import dotenv from "dotenv";
// ESM hoists imports ahead of server.ts's own dotenv.config() call, so this
// module would otherwise read EMAIL_USER/EMAIL_PASS as undefined at load
// time (dotenv.config() is idempotent, matching HostPanel's mailer.ts).
dotenv.config();

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

interface SendMailOptions {
  to: string;
  subject: string;
  text?: string;
  html?: string;
  attachments?: { filename: string; content: Buffer; contentType?: string }[];
}

export const sendMail = async ({ to, subject, text, html, attachments }: SendMailOptions) => {
  await transporter.sendMail({
    from: `"WONO Partners" <${process.env.EMAIL_USER}>`,
    to,
    subject,
    text,
    html,
    attachments,
  });
};
