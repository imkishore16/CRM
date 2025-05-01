"use client"

import { useState, useEffect } from "react"
import type { SignInFlow } from "@/types/auth-types"
import SigninCard from "./sign-in-card"
import SignupCard from "./sign-up-card"
import { useRouter } from "next/navigation"

export default function AuthScreen({ authType }: { authType?: SignInFlow }) {
  const [formType, setFormType] = useState<SignInFlow>(authType || "signIn")
  const router = useRouter()

  // Update formType when authType prop changes
  useEffect(() => {
    if (authType && authType !== formType) {
      setFormType(authType)
    }
  }, [authType, formType])

  // Custom form type setter that also updates the URL
  const handleFormTypeChange = (newType: SignInFlow) => {
    setFormType(newType)
    router.push(`/auth?authType=${newType}`)
  }

  return (
    <div className="flex min-h-screen flex-col md:flex-row">
      {/* Left side - Auth form */}
      <div className="flex w-full items-center justify-center bg-background px-4 py-12 md:w-1/2 md:py-0">
        <div className="w-full max-w-md">
          {formType === "signIn" ? (
            <SigninCard setFormType={handleFormTypeChange} />
          ) : (
            <SignupCard setFormType={handleFormTypeChange} />
          )}
        </div>
      </div>

      {/* Right side - Image/Branding */}
      <div className="hidden w-1/2 bg-black md:block">
        <div className="flex h-full flex-col items-center justify-center p-12">
          <div className="mb-8 text-center">
            <h1 className="mb-2 text-4xl font-bold text-white">Welcome to Our Platform</h1>
            <p className="text-muted-foreground/60">Manage your data and connect with customers like never before</p>
          </div>

          <div className="relative h-[400px] w-full max-w-lg rounded-xl bg-gradient-to-br from-gray-800 to-gray-900 p-1">
            <div className="absolute inset-0 flex items-center justify-center rounded-lg">
              <span className="text-lg text-muted-foreground/60">Dashboard Preview</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

