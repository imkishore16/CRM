import { NextAuthOptions, Session } from "next-auth";
import { JWT } from "next-auth/jwt";
import CredentialsProvider from "next-auth/providers/credentials";
import GoogleProvider from "next-auth/providers/google";
import { PrismaClient } from "@prisma/client";
import { PrismaClientInitializationError } from "@prisma/client/runtime/library";
import bcrypt from "bcrypt";
import { z } from "zod";

const prisma = new PrismaClient();

const emailSchema = z.string().email();
const passwordSchema = z.string().min(8);

export const authOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID ?? "",
      clientSecret: process.env.GOOGLE_CLIENT_SECRET ?? "",
    }),
    CredentialsProvider({
      credentials: {
        email: { label: "Email", type: "text" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials || !credentials.email || !credentials.password) {
          return null;
        }

        const emailValidation = emailSchema.safeParse(credentials.email);
        if (!emailValidation.success) {
          throw new Error("Invalid email");
        }

        const passwordValidation = passwordSchema.safeParse(credentials.password);
        if (!passwordValidation.success) {
          throw new Error(passwordValidation.error.issues[0].message);
        }

        try {
          const user = await prisma.user.findUnique({
            where: { email: emailValidation.data },
          });

          if (!user) {
            const hashedPassword = await bcrypt.hash(passwordValidation.data, 10);
            const newUser = await prisma.user.create({
              data: {
                email: emailValidation.data,
                password: hashedPassword,
                provider: "Credentials",
              },
            });
            return {
              id: newUser.id.toString(), // Convert id to string
              email: newUser.email,
              name: newUser.name || null,
              provider: newUser.provider,
            };
          }

          if (!user.password) {
            const hashedPassword = await bcrypt.hash(passwordValidation.data, 10);
            const authUser = await prisma.user.update({
              where: { email: emailValidation.data },
              data: { password: hashedPassword },
            });
            return {
              id: authUser.id.toString(), // Convert id to string
              email: authUser.email,
              name: authUser.name || null,
              provider: authUser.provider,
            };
          }

          const passwordVerification = await bcrypt.compare(
            passwordValidation.data,
            user.password
          );
          if (!passwordVerification) {
            throw new Error("Invalid password");
          }
          return {
            id: user.id.toString(), // Convert id to string
            email: user.email,
            name: user.name || null,
            provider: user.provider,
          };
        } catch (error) {
          console.error(error);
          throw new Error("Internal server error");
        }
      },
    }),
  ],
  pages: {
    signIn: "/auth",
  },
  secret: process.env.NEXTAUTH_SECRET ?? "secret",
  session: {
    strategy: "jwt",
  },
  callbacks: {
    async jwt({ token, account, profile }) {
      if (account && profile) {
        token.email = profile.email as string;
        token.id = account.access_token;

        if (account.provider === "spotify") {
          token.accessToken = account.access_token;
        }
      }
      return token;
    },
    async session({ session, token }: { session: Session; token: JWT }) {
      try {
        const user = await prisma.user.findUnique({
          where: { email: token.email },
        });

        if (user) {
          session.user.id = user.id;
        }

        if (token.accessToken) {
          session.user.accessToken = token.accessToken;
        }
      } catch (error) {
        console.error(error);
        throw new Error("Internal server error");
      }
      return session;
    },
    async signIn({ account, profile }) {
      try {
        if (account?.provider === "google" || account?.provider === "spotify") {
          if (!profile?.email) {
            throw new Error("Email is required");
          }

          const user = await prisma.user.findUnique({
            where: { email: profile.email },
          });

          if (!user) {
            await prisma.user.create({
              data: {
                email: profile.email,
                name: profile.name || undefined,
                provider: account.provider === "google" ? "Google" : "Spotify",
                password: "dummy_password",
              },
            });
          }
        }
        return true;
      } catch (error) {
        console.error("Provider error:", error);
        return false;
      }
    },
  },
} satisfies NextAuthOptions;