import nodemailer from 'nodemailer';

function getTransporter() {
  if (!process.env.SMTP_HOST || !process.env.SMTP_USER || !process.env.SMTP_PASS) {
    return null;
  }
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: parseInt(process.env.SMTP_PORT || '587'),
    secure: process.env.SMTP_PORT === '465',
    auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
    connectionTimeout: 5000,
    greetingTimeout: 5000,
    socketTimeout: 10000,
  });
}

const FROM = process.env.EMAIL_FROM || 'StudyVault <noreply@studyvault.pk>';

async function send(to, subject, html) {
  const transporter = getTransporter();
  if (!transporter) {
    console.log(`\n[EMAIL DEV MODE]\nTo: ${to}\nSubject: ${subject}\n${html.replace(/<[^>]*>/g, '')}\n`);
    return { success: true, dev: true };
  }
  try {
    await transporter.sendMail({ from: FROM, to, subject, html });
    return { success: true };
  } catch (err) {
    console.error('[EMAIL ERROR]', err.message);
    return { success: false, error: err.message };
  }
}

export async function sendOtpEmail(email, otp, name = '') {
  return send(email, 'Your StudyVault Verification Code', `
    <div style="font-family:Arial,sans-serif;max-width:480px;margin:0 auto;padding:20px">
      <h2 style="color:#0A2540;font-size:24px;margin-bottom:8px">Verify your account</h2>
      <p style="color:#334155">Hi ${name || 'there'}, your verification code is:</p>
      <div style="background:#F1F5F9;border-radius:12px;padding:24px;text-align:center;margin:20px 0">
        <span style="font-size:40px;font-weight:700;letter-spacing:10px;color:#0A2540">${otp}</span>
      </div>
      <p style="color:#64748B;font-size:14px">Expires in 10 minutes. Do not share this code.</p>
      <hr style="border:none;border-top:1px solid #E2E8F0;margin:20px 0"/>
      <p style="color:#94A3B8;font-size:12px">StudyVault PK 🇵🇰</p>
    </div>
  `);
}

export async function sendPasswordResetEmail(email, token, name = '') {
  const url = `${process.env.STUDENT_APP_URL || 'http://localhost:3000'}/reset-password?token=${token}`;
  return send(email, 'Reset your StudyVault password', `
    <div style="font-family:Arial,sans-serif;max-width:480px;margin:0 auto;padding:20px">
      <h2 style="color:#0A2540">Reset your password</h2>
      <p style="color:#334155">Hi ${name || 'there'},</p>
      <p style="color:#334155">Click the button below to reset your password. Link expires in 1 hour.</p>
      <a href="${url}" style="display:inline-block;background:#2563EB;color:white;padding:14px 28px;border-radius:10px;text-decoration:none;font-weight:600;margin:16px 0">
        Reset Password
      </a>
      <p style="color:#64748B;font-size:14px">If you didn't request this, ignore this email.</p>
    </div>
  `);
}

export async function sendParentLinkEmail(email, childName, otp) {
  return send(email, `Link ${childName}'s StudyVault account`, `
    <div style="font-family:Arial,sans-serif;max-width:480px;margin:0 auto;padding:20px">
      <h2 style="color:#0A2540">Account Linking Request</h2>
      <p style="color:#334155">${childName} wants to link their account to your parent dashboard.</p>
      <div style="background:#F1F5F9;border-radius:12px;padding:24px;text-align:center;margin:20px 0">
        <span style="font-size:40px;font-weight:700;letter-spacing:10px;color:#0A2540">${otp}</span>
      </div>
      <p style="color:#64748B;font-size:14px">Expires in 10 minutes.</p>
    </div>
  `);
}
