"use client"

import { useSession } from "next-auth/react"
import { useRouter, useSearchParams } from "next/navigation"
import { useEffect, useState } from "react"
import type { SignInFlow } from "@/types/auth-types"
import AuthScreen from "@/components/auth/auth-screen"

export default function AuthPage() {
  const [formType, setFormType] = useState<SignInFlow | undefined>(undefined)
  const session = useSession()
  const router = useRouter()
  const searchParams = useSearchParams()

  useEffect(() => {
    const authType = searchParams.get("authType") as SignInFlow | null
    setFormType(authType || undefined)
  }, [searchParams])

  useEffect(() => {
    if (session.status === "authenticated") {
      router.push("/")
    }
  }, [session.status, router])

  return <AuthScreen authType={formType} />
}
