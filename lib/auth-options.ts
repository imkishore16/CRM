import { NextAuthOptions, Session } from "next-auth";
import bcrypt from "bcryptjs";
import { JWT } from "next-auth/jwt";
import Credentials from "next-auth/providers/credentials";
import GoogleProvider from "next-auth/providers/google";

import { emailSchema, passwordSchema } from "@/schema/credentials-schema";
import { PrismaClientInitializationError } from "@prisma/client/runtime/library";
import prisma from "@/lib/db";



export const authOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID ?? "",
      clientSecret: process.env.GOOGLE_CLIENT_SECRET ?? ""
    }),
    Credentials({
      credentials: {
        email: { label: "Email", type: "text" },
        password: { label: "Password", type: "password" }
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
            where: { email: emailValidation.data }
          });

          if (!user) { //user not found , create new user
            const hashedPassword = await bcrypt.hash(passwordValidation.data, 10);

            const newUser = await prisma.user.create({
              data: {
                email: emailValidation.data,
                password: hashedPassword,
                provider: "Credentials",
              }
            });
            return newUser;
          }

          if (!user.password) {
            const hashedPassword = await bcrypt.hash(passwordValidation.data, 10);

            const authUser = await prisma.user.update({
              where: { email: emailValidation.data },
              data: { password: hashedPassword }
            });
            return authUser;
          }

          const passwordVerification = await bcrypt.compare(passwordValidation.data, user.password);
          if (!passwordVerification) {
            throw new Error("Invalid password");
          }

          return user;
        } catch (error) {
          if (error instanceof PrismaClientInitializationError) {
            throw new Error("Internal server error");
          }
          console.log(error);
          throw error;
        }
      },
    })
  ],
  pages: {
    /*
    Redirects users to a custom sign-in page located at /auth when they need to authenticate.
    The default NextAuth sign-in page is overridden, so you can fully customize the UI/UX of the sign-in page.
*/ 
    signIn: "/auth"
  },
  secret: process.env.NEXTAUTH_SECRET ?? "secret",
  session: {
    strategy: "jwt"
  },
  
  callbacks: {
    async jwt({ token, account, profile }) {
      if (account && profile) {
        token.email = profile.email as string;
        token.id = account.access_token;

        // Add Spotify access token if using Spotify Provider
        if (account.provider === "spotify") {
          token.accessToken = account.access_token;
        }
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
        // Pass Spotify token to the session if using Spotify
        if (token.accessToken) {
          console.log("token.accessToken  ",token.accessToken)
          session.user.accessToken = token.accessToken;
        }
        // console.log("session",session);
      } catch (error) {
        if (error instanceof PrismaClientInitializationError) {
          throw new Error("Internal server error");
        }
        console.log(error);
        throw error;
      }
      return session;
    },
    async signIn({ account, profile }) {
      try {
        if (account?.provider === "google" || account?.provider === "spotify") {
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
        console.log(" provider error ",error);
        return false;
      }
    }
  }



} satisfies NextAuthOptions;
