import { type DefaultSession } from "next-auth";

declare module "next-auth" {
  interface Session {
    user: {
      id: int;
      email: string;
      // Add accessToken here
      accessToken?: string;
    } & DefaultSession["user"]; // by default session object will have name email and image
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: int;
    email: string;
    // Add accessToken here
    accessToken?: string;
  }
}