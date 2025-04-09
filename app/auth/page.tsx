"use client"

import { useSession } from "next-auth/react"
import { useRouter, useSearchParams } from "next/navigation"
import { useEffect,useState } from "react"
import type { SignInFlow } from "@/types/auth-types"
import AuthScreen from "@/components/auth/auth-screen"
import LoadingScreen from "@/components/LoadingScreen"

export default function AuthPage() {
  const session = useSession()
  const router = useRouter()
  const searchParams = useSearchParams()

  const authTypeParam = searchParams.get("authType") as SignInFlow
  const [authType, setAuthType] = useState<SignInFlow>(
    authTypeParam === "signIn" || authTypeParam === "signUp" ? authTypeParam : "signIn",
  )

  useEffect(() => {
    const newAuthType = searchParams.get("authType") as SignInFlow
    if (newAuthType === "signIn" || newAuthType === "signUp") {
      setAuthType(newAuthType)
    }
    if (session.status === "authenticated") {
      router.push("/")
    }
  }, [session.status, router,searchParams])

  if (session.status === "loading") {
    return <LoadingScreen message="Checking authentication..." />
  }

  if (session.status === "authenticated") {
    return <LoadingScreen message="Redirecting to dashboard..." />
  }

  return <AuthScreen authType={authType} />
}