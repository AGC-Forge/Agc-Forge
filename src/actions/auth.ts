"use server";

import { signIn, signOut } from "@/auth";
import { prisma } from "@/lib/prisma";
import { hash } from "bcryptjs";
import { randomBytes } from "crypto";
import { AuthError } from "next-auth";
import {
  loginSchema,
  registerSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
} from "@/lib/validations/auth";

export async function loginAction(
  formData: FormData
): Promise<ActionResult> {
  const raw = {
    email: formData.get("email"),
    password: formData.get("password"),
  };

  const parsed = loginSchema.safeParse(raw);
  if (!parsed.success) {
    return {
      success: false,
      fieldErrors: parsed.error.flatten().fieldErrors as Record<string, string[]>,
    };
  }

  try {
    await signIn("credentials", {
      email: parsed.data.email,
      password: parsed.data.password,
      redirect: false,
    });
    return { success: true };
  } catch (error) {
    if (error instanceof AuthError) {
      switch (error.type) {
        case "CredentialsSignin":
          return { success: false, error: "Email atau password salah." };
        default:
          return { success: false, error: error.message || "Terjadi kesalahan saat login." };
      }
    }
    return { success: false, error: "Terjadi kesalahan. Coba lagi." };
  }
}

export async function registerAction(
  formData: FormData
): Promise<ActionResult> {
  const raw = {
    name: formData.get("name"),
    email: formData.get("email"),
    password: formData.get("password"),
    confirmPassword: formData.get("confirmPassword"),
  };

  const parsed = registerSchema.safeParse(raw);
  if (!parsed.success) {
    return {
      success: false,
      fieldErrors: parsed.error.flatten().fieldErrors as Record<string, string[]>,
    };
  }

  const { name, email, password } = parsed.data;

  // Cek email sudah terdaftar
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    return { success: false, error: "Email sudah terdaftar." };
  }

  // Hash password
  const password_hash = await hash(password, 12);

  // Cari atau buat role default "user"
  let defaultRole = await prisma.role.findFirst({ where: { name: "user" } });
  if (!defaultRole) {
    defaultRole = await prisma.role.create({ data: { name: "user", level: 1 } });
  }

  // Buat user
  const user = await prisma.user.create({
    data: {
      name,
      email,
      password_hash,
      role_id: defaultRole.id,
      is_active: true,
    },
  });

  // Buat verification token
  const token = randomBytes(32).toString("hex");
  const expires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 jam

  await prisma.verificationToken.create({
    data: {
      identifier: email,
      token,
      expires,
    },
  });

  // Kirim email verifikasi
  try {
    await sendVerificationEmail(email, name, token);
  } catch (emailError) {
    console.error("[Register] Gagal kirim email:", emailError);
    // Tetap sukses, tapi beri tahu user
    return {
      success: true,
      message: "Akun berhasil dibuat. Gagal mengirim email verifikasi, coba resend.",
      data: { email },
    };
  }

  return {
    success: true,
    message: "Akun berhasil dibuat! Cek email kamu untuk verifikasi.",
    data: { email },
  };
}

export async function verifyEmailAction(token: string): Promise<ActionResult> {
  if (!token) {
    return { success: false, error: "Token tidak valid." };
  }

  const verificationToken = await prisma.verificationToken.findUnique({
    where: { token },
  });

  if (!verificationToken) {
    return { success: false, error: "Token tidak ditemukan atau sudah digunakan." };
  }

  if (verificationToken.expires < new Date()) {
    await prisma.verificationToken.delete({ where: { token } });
    return { success: false, error: "Token sudah kedaluwarsa. Minta token baru." };
  }

  // Update user: set email_verified_at
  await prisma.user.update({
    where: { email: verificationToken.identifier },
    data: { email_verified_at: new Date() },
  });

  // Hapus token setelah digunakan
  await prisma.verificationToken.delete({ where: { token } });

  return { success: true, message: "Email berhasil diverifikasi! Silakan login." };
}

export async function resendVerificationAction(
  email: string
): Promise<ActionResult> {
  const user = await prisma.user.findUnique({ where: { email } });

  if (!user) {
    // Jangan kasih info apakah email terdaftar (security)
    return { success: true, message: "Jika email terdaftar, link verifikasi sudah dikirim." };
  }

  if (user.email_verified_at) {
    return { success: false, error: "Email sudah terverifikasi." };
  }

  // Hapus token lama
  await prisma.verificationToken.deleteMany({
    where: { identifier: email },
  });

  // Buat token baru
  const token = randomBytes(32).toString("hex");
  const expires = new Date(Date.now() + 24 * 60 * 60 * 1000);

  await prisma.verificationToken.create({
    data: { identifier: email, token, expires },
  });

  await sendVerificationEmail(email, user.name, token);

  return { success: true, message: "Link verifikasi baru sudah dikirim ke email kamu." };
}

export async function forgotPasswordAction(
  formData: FormData
): Promise<ActionResult> {
  const raw = { email: formData.get("email") };
  const parsed = forgotPasswordSchema.safeParse(raw);

  if (!parsed.success) {
    return {
      success: false,
      fieldErrors: parsed.error.flatten().fieldErrors as Record<string, string[]>,
    };
  }

  const { email } = parsed.data;

  // Selalu return sukses agar tidak bocorkan info email terdaftar
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user || !user.password_hash) {
    return {
      success: true,
      message: "Jika email terdaftar, link reset password sudah dikirim.",
    };
  }

  // Hapus token reset lama
  await prisma.passwordResetToken.deleteMany({
    where: { userId: user.id },
  });

  // Buat token reset baru
  const token = randomBytes(32).toString("hex");
  const expires = new Date(Date.now() + 60 * 60 * 1000); // 1 jam

  await prisma.passwordResetToken.create({
    data: { token, userId: user.id, expires },
  });

  try {
    await sendPasswordResetEmail(email, user.name, token);
  } catch (err) {
    console.error("[ForgotPassword] Gagal kirim email:", err);
  }

  return {
    success: true,
    message: "Jika email terdaftar, link reset password sudah dikirim.",
  };
}

export async function resetPasswordAction(
  formData: FormData
): Promise<ActionResult> {
  const raw = {
    token: formData.get("token"),
    password: formData.get("password"),
    confirmPassword: formData.get("confirmPassword"),
  };

  const parsed = resetPasswordSchema.safeParse(raw);
  if (!parsed.success) {
    return {
      success: false,
      fieldErrors: parsed.error.flatten().fieldErrors as Record<string, string[]>,
    };
  }

  const { token, password } = parsed.data;

  const resetToken = await prisma.passwordResetToken.findUnique({
    where: { token },
  });

  if (!resetToken) {
    return { success: false, error: "Token tidak valid." };
  }

  if (resetToken.expires < new Date()) {
    await prisma.passwordResetToken.delete({ where: { token } });
    return { success: false, error: "Token sudah kedaluwarsa. Minta reset baru." };
  }

  if (resetToken.used) {
    return { success: false, error: "Token sudah digunakan." };
  }

  const password_hash = await hash(password, 12);

  // Update password dan tandai token sebagai used
  await prisma.$transaction([
    prisma.user.update({
      where: { id: resetToken.userId },
      data: { password_hash },
    }),
    prisma.passwordResetToken.update({
      where: { token },
      data: { used: true },
    }),
  ]);

  return { success: true, message: "Password berhasil diubah. Silakan login." };
}

export async function logoutAction(): Promise<void> {
  await signOut({ redirectTo: "/login" });
}

async function sendVerificationEmail(
  email: string,
  name: string,
  token: string
): Promise<void> {
  const verifyUrl = `${process.env.NEXTAUTH_URL}/verify-email?token=${token}`;

  // Gunakan nodemailer atau Resend sesuai env
  if (process.env.RESEND_API_KEY) {
    await sendWithResend({
      to: email,
      subject: "Verifikasi Email Kamu",
      html: buildVerificationEmailHtml(name, verifyUrl),
    });
  } else if (process.env.SMTP_HOST) {
    await sendWithNodemailer({
      to: email,
      subject: "Verifikasi Email Kamu",
      html: buildVerificationEmailHtml(name, verifyUrl),
    });
  } else {
    // Dev mode: log ke console
    console.log(`\n[DEV] Verification URL for ${email}:\n${verifyUrl}\n`);
  }
}

async function sendPasswordResetEmail(
  email: string,
  name: string,
  token: string
): Promise<void> {
  const resetUrl = `${process.env.NEXTAUTH_URL}/reset-password?token=${token}`;

  if (process.env.RESEND_API_KEY) {
    await sendWithResend({
      to: email,
      subject: "Reset Password",
      html: buildResetEmailHtml(name, resetUrl),
    });
  } else if (process.env.SMTP_HOST) {
    await sendWithNodemailer({
      to: email,
      subject: "Reset Password",
      html: buildResetEmailHtml(name, resetUrl),
    });
  } else {
    console.log(`\n[DEV] Reset URL for ${email}:\n${resetUrl}\n`);
  }
}

async function sendWithResend(opts: {
  to: string;
  subject: string;
  html: string;
}): Promise<void> {
  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: process.env.EMAIL_FROM || "noreply@yourdomain.com",
      to: opts.to,
      subject: opts.subject,
      html: opts.html,
    }),
  });

  if (!response.ok) {
    throw new Error(`Resend error: ${response.statusText}`);
  }
}

async function sendWithNodemailer(opts: {
  to: string;
  subject: string;
  html: string;
}): Promise<void> {
  const nodemailer = await import("nodemailer");

  const transporter = nodemailer.default.createTransport({
    host: process.env.SMTP_HOST,
    port: parseInt(process.env.SMTP_PORT || "587"),
    secure: process.env.SMTP_SECURE === "true",
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });

  await transporter.sendMail({
    from: process.env.EMAIL_FROM || '"Forge AI" <noreply@agcforge.com>',
    to: opts.to,
    subject: opts.subject,
    html: opts.html,
  });
}

function buildVerificationEmailHtml(name: string, url: string): string {
  return `
    <!DOCTYPE html>
    <html>
    <head><meta charset="utf-8"></head>
    <body style="font-family: -apple-system, sans-serif; background: #f4f4f5; padding: 40px 0;">
      <div style="max-width: 480px; margin: 0 auto; background: #fff; border-radius: 12px; overflow: hidden; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
        <div style="background: #6366f1; padding: 32px; text-align: center;">
          <h1 style="color: white; margin: 0; font-size: 24px;">Forge AI</h1>
        </div>
        <div style="padding: 32px;">
          <h2 style="margin-top: 0;">Halo, ${name}! 👋</h2>
          <p style="color: #6b7280; line-height: 1.6;">
            Terima kasih sudah mendaftar. Klik tombol di bawah untuk memverifikasi email kamu.
          </p>
          <a href="${url}" style="display: inline-block; background: #6366f1; color: white; padding: 12px 28px; border-radius: 8px; text-decoration: none; font-weight: 600; margin: 16px 0;">
            Verifikasi Email
          </a>
          <p style="color: #9ca3af; font-size: 14px; margin-top: 24px;">
            Link ini berlaku selama 24 jam. Jika kamu tidak mendaftar, abaikan email ini.
          </p>
        </div>
      </div>
    </body>
    </html>
  `;
}

function buildResetEmailHtml(name: string, url: string): string {
  return `
    <!DOCTYPE html>
    <html>
    <head><meta charset="utf-8"></head>
    <body style="font-family: -apple-system, sans-serif; background: #f4f4f5; padding: 40px 0;">
      <div style="max-width: 480px; margin: 0 auto; background: #fff; border-radius: 12px; overflow: hidden; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
        <div style="background: #6366f1; padding: 32px; text-align: center;">
          <h1 style="color: white; margin: 0; font-size: 24px;">Forge AI</h1>
        </div>
        <div style="padding: 32px;">
          <h2 style="margin-top: 0;">Reset Password</h2>
          <p style="color: #6b7280; line-height: 1.6;">
            Halo <strong>${name}</strong>, kamu meminta reset password. Klik tombol di bawah untuk melanjutkan.
          </p>
          <a href="${url}" style="display: inline-block; background: #6366f1; color: white; padding: 12px 28px; border-radius: 8px; text-decoration: none; font-weight: 600; margin: 16px 0;">
            Reset Password
          </a>
          <p style="color: #9ca3af; font-size: 14px; margin-top: 24px;">
            Link ini berlaku selama 1 jam. Jika kamu tidak meminta reset, abaikan email ini.
          </p>
        </div>
      </div>
    </body>
    </html>
  `;
}
