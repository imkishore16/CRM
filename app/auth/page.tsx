"use client";

import { useSession } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";

import { SignInFlow } from "@/types/auth-types";
import AuthScreen from "@/components/auth/auth-screen";

export default function AuthPage() {
  const session = useSession();
  const router = useRouter();
  const searchParams = useSearchParams();

  // Get the auth type directly from searchParams
  const authType = searchParams.get("authType") as SignInFlow;

  // Check if it's valid and provide a default
  const formType: SignInFlow =
    (authType === "signIn" || authType === "signUp") ? authType : "signIn";

  console.log("Form type", formType);

  if (session.status === "authenticated") {
    router.push("/");
    return null;
  }

  return <AuthScreen authType={formType} />;
}
