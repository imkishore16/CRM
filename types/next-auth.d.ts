import { type DefaultSession } from "next-auth";

declare module "next-auth" {
  interface Session {
    user: {
      id: int;
      email: string;
      accessToken?: string;
    } & DefaultSession["user"]; 
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: int;
    email: string;
    accessToken?: string;
  }
}