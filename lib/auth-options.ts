import { NextAuthOptions, Session } from "next-auth";
import { JWT } from "next-auth/jwt";
import CredentialsProvider from "next-auth/providers/credentials";
import GoogleProvider from "next-auth/providers/google";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { PrismaClient } from "@prisma/client";
import { PrismaAdapter } from "@next-auth/prisma-adapter";
import { PrismaClientInitializationError } from "@prisma/client/runtime/library";

const prisma = new PrismaClient();
const emailSchema = z.string().email();
const passwordSchema = z.string().min(8);

export const authOptions: NextAuthOptions = {
  providers: [
    GoogleProvider({      
      clientId: process.env.GOOGLE_CLIENT_ID ?? "",
      clientSecret: process.env.GOOGLE_CLIENT_SECRET ?? "",
      httpOptions: {
        timeout: 60000,
      }
    }),
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { type: "email" },
        password: { type: "password" }
      },
      async authorize(credentials) {
        if (!credentials || !credentials.email || !credentials.password) {
          throw new Error("Email and password are required");
        }

        const emailValidation = emailSchema.safeParse(credentials.email);
        if (!emailValidation.success) {
          throw new Error("Invalid email format");
        }

        const passwordValidation = passwordSchema.safeParse(credentials.password);
        if (!passwordValidation.success) {
          throw new Error("Password must be at least 8 characters long");
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
              id: newUser.id.toString(),
              email: newUser.email,
              name: newUser.name || null,
              password:hashedPassword||null,
              provider: newUser.provider,
            };
          }

          if (!user.password) {
            const hashedPassword = await bcrypt.hash(passwordValidation.data, 10);
            const updatedUser = await prisma.user.update({
              where: { email: emailValidation.data },
              data: { password: hashedPassword },
            });
            return {
              id: updatedUser.id.toString(),
              email: updatedUser.email,
              name: updatedUser.name || null,
              password:hashedPassword||null,
              provider: updatedUser.provider,
            };
          }

          const passwordValid = await bcrypt.compare(
            passwordValidation.data,
            user.password
          );
          if (!passwordValid) {
            throw new Error("Invalid password");
          }

          return {
            id: user.id.toString(),
            email: user.email,
            name: user.name || null,
            password:user.password||null,
            provider: user.provider,
          };
        } catch (error) {
          console.error("Authorization error:", error);
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
    async signIn({ account, profile }) {
      try {
        if (account?.provider === "google" ) {
          const user = await prisma.user.findUnique({
            where: {
              email: profile?.email!,
            }
          });

          if (!user) {
            await prisma.user.create({
              data: {
                email: profile?.email!,
                name: profile?.name || undefined,
                provider: account?.provider === "google" ? "Google": "Spotify",
              }
            });
          }
        }
        return true;
      } catch (error) {
        return false;
      }
    },
    async jwt({ token, account, profile }) {
      if (account && profile) {
        token.email = profile.email as string;
        token.id = account.access_token;
      }
      return token;
    },
    async session({ session, token }: {
      session: Session,
      token: JWT;
    }) {
      try {
        const user = await prisma.user.findUnique({
          where: { email: token.email }
        });

        if (user) {
          session.user.id = user.id;
        }
        if (token.accessToken) {
          session.user.accessToken = token.accessToken;
        }
      } catch (error) {
        if (error instanceof PrismaClientInitializationError) {
          throw new Error("Internal server error");
        }
        console.log(error);
        throw error;
      }
      return session;
    },
    
  },
};
