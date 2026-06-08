import 'dotenv/config';
import nodemailer from 'nodemailer';
import { config } from '@repo/config';

export const nodemailerSender = async (
  email: string,
  token: string,
): Promise<void> => {
  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: config.USER_EMAIL,
      pass: config.USER_PASSWORD,
    },
  });

  const verificationUrl = `${config.BACKEND_URL}/api/v1/auth/verify?token=${token}`;

  await transporter.sendMail({
    from: `"Exness Contest" <${config.USER_EMAIL}>`,
    to: email,
    subject: 'Exness Contest Verification Link',
    text: `Your verification link is: ${verificationUrl}`,
    html: `<p>The verification link is:</p>
           <a href="${verificationUrl}">${verificationUrl}</a>`,
  });
};
