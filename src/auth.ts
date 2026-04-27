import NextAuth, { type NextAuthConfig } from "next-auth";
import GitHub from "next-auth/providers/github";
import Google from "next-auth/providers/google";
import Credentials from "next-auth/providers/credentials";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { prisma } from "@/lib/prisma";
import { compare } from "bcryptjs";

export const authOptions: NextAuthConfig = {
  adapter: PrismaAdapter(prisma) as any,
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 hari
  },
  providers: [
    // ── GitHub OAuth ────────────────────────────────
    GitHub({
      clientId: process.env.GITHUB_CLIENT_ID || "",
      clientSecret: process.env.GITHUB_CLIENT_SECRET || "",
    }),

    // ── Google OAuth ────────────────────────────────
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID || "",
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || "",
    }),

    // ── Email + Password ────────────────────────────
    Credentials({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error("Email dan password wajib diisi.");
        }

        const user = await prisma.user.findUnique({
          where: { email: credentials.email as string },
          include: { role: true },
        });

        if (!user) {
          throw new Error("Email tidak terdaftar.");
        }

        if (!user.password_hash) {
          throw new Error("Akun ini menggunakan login sosial. Silakan login dengan GitHub atau Google.");
        }

        const isValid = await compare(
          credentials.password as string,
          user.password_hash
        );

        if (!isValid) {
          throw new Error("Password salah.");
        }

        if (!user.email_verified_at) {
          throw new Error("Email belum diverifikasi. Cek inbox kamu.");
        }

        if (!user.is_active) {
          throw new Error("Akun kamu dinonaktifkan. Hubungi admin.");
        }

        // Update last login
        await prisma.user.update({
          where: { id: user.id },
          data: { last_login_at: new Date() },
        });

        return {
          id: user.id,
          name: user.name,
          email: user.email,
          image: user.avatar,
          role: user.role.name,
          role_level: user.role.level,
        };
      },
    }),
  ],

  pages: {
    signIn: "/login",
    error: "/login",
    verifyRequest: "/verify-email",
    newUser: "/chat",
  },

  callbacks: {
    // ── JWT Callback ─────────────────────────────
    async jwt({ token, user, account }) {
      if (user) {
        token.id = user.id;
        token.role = (user as any).role ?? "user";
        token.role_level = (user as any).role_level ?? 0;
      }

      // OAuth provider: cek/buat role default
      if (account && account.provider !== "credentials") {
        const dbUser = await prisma.user.findUnique({
          where: { email: token.email! },
          include: { role: true },
        });
        if (dbUser) {
          token.id = dbUser.id;
          token.role = dbUser.role.name;
          token.role_level = dbUser.role.level;

          // Update last login untuk OAuth
          await prisma.user.update({
            where: { id: dbUser.id },
            data: { last_login_at: new Date() },
          });
        }
      }

      return token;
    },

    // ── Session Callback ──────────────────────────
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        (session.user as any).role = token.role;
        (session.user as any).role_level = token.role_level;
      }
      return session;
    },

    // ── SignIn Callback ───────────────────────────
    async signIn({ user, account }) {
      // OAuth providers: auto-assign role default jika user baru
      if (account && account.provider !== "credentials") {
        try {
          const existingUser = await prisma.user.findUnique({
            where: { email: user.email! },
          });

          if (!existingUser) {
            // Cari atau buat role "user"
            let defaultRole = await prisma.role.findFirst({
              where: { name: "user" },
            });

            if (!defaultRole) {
              defaultRole = await prisma.role.create({
                data: { name: "user", level: 1 },
              });
            }

            // Update user yang dibuat oleh adapter agar punya role
            await prisma.user.updateMany({
              where: { email: user.email! },
              data: { role_id: defaultRole.id },
            });
          }
        } catch (error) {
          console.error("[Auth] signIn callback error:", error);
          return false;
        }
      }
      return true;
    },
  },

  events: {
    // Log setiap sign in untuk audit
    async signIn({ user, account }) {
      console.log(`[Auth] Sign in: ${user.email} via ${account?.provider}`);
    },
  },

  secret: process.env.NEXTAUTH_SECRET,
  debug: process.env.NODE_ENV === "development",
};

export const { handlers, auth, signIn, signOut } = NextAuth(authOptions);
