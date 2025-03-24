"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { redirect } from 'next/navigation';
import { SignInFlow } from "@/types/auth-types";
import AuthScreen from "@/components/auth/auth-screen";

interface AuthPageProps {
  searchParams: Promise<Record<string, string | undefined>>;
}

export default function AuthPage({ searchParams }: AuthPageProps) {
  const [formType, setFormType] = useState<SignInFlow | undefined>(undefined);
  const session = useSession();
  const router = useRouter();

  useEffect(() => {
    const fetchSearchParams = async () => {
      const params = await searchParams;
      setFormType(params.authType as SignInFlow | undefined);
    };

    fetchSearchParams();
  }, [searchParams]);

  if (session.status === "authenticated") {
    redirect("/");
  }

  return <AuthScreen authType={formType} />;
}