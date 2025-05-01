"use client"
import { useState } from "react"
import type React from "react"

import { FcGoogle } from "react-icons/fc"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Separator } from "@/components/ui/separator"
import { Label } from "@/components/ui/label"
import type { SignInFlow } from "@/types/auth-types"
import { AlertCircle } from "lucide-react"
import { useRouter } from "next/navigation"
import { signIn } from "next-auth/react"

interface SignupCardProps {
  setFormType: (state: SignInFlow) => void
}

export default function SignupCard({ setFormType }: SignupCardProps) {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [error, setError] = useState("")
  const [pending, setPending] = useState(false)
  const router = useRouter()

  const signInWithProvider = async (provider: "google" | "credentials" | "spotify") => {
    try {
      const res = signIn(provider, {
        email,
        password,
        redirect: false,
        callbackUrl: "/home",
      })

      res.then((res) => {
        if (res?.error) {
          setError(res.error)
        } else {
          router.push("/") // Redirect on successful signup
        }
        setPending(false)
      })
    } catch (error) {
      console.log(error)
    }
  }

  const handlerCredentialSignup = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setError("")
    setPending(true)
    if (password !== confirmPassword) {
      setError("Passwords do not match")
      setPending(false)
      return
    }
    signInWithProvider("credentials")
  }

  const handleGoogleSignup = () => {
    setError("")
    setPending(true)
    signInWithProvider("google")
  }

  return (
    <Card className="w-full border border-border bg-background shadow-sm">
      <CardHeader className="space-y-1 pb-6">
        <CardTitle className="text-center text-2xl font-bold text-foreground">Create an Account</CardTitle>
        <p className="text-center text-sm text-muted-foreground">Enter your details to create your account</p>
      </CardHeader>

      {!!error && (
        <div className="mx-6 mb-4 flex items-center gap-x-2 rounded-md bg-red-50 p-3 text-sm text-red-600">
          <AlertCircle className="h-4 w-4 shrink-0" />
          <p>{error}</p>
        </div>
      )}

      <CardContent className="space-y-6 px-6">
        <form className="space-y-4" onSubmit={handlerCredentialSignup}>
          <div className="space-y-2">
            <Label htmlFor="email" className="text-gray-700">
              Email
            </Label>
            <Input
              id="email"
              disabled={pending}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="name@example.com"
              className="border-border/80 focus:border-black focus:ring-black"
              type="email"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="password" className="text-gray-700">
              Password
            </Label>
            <Input
              id="password"
              disabled={pending}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="border-border/80 focus:border-black focus:ring-black"
              type="password"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="confirm-password" className="text-gray-700">
              Confirm Password
            </Label>
            <Input
              id="confirm-password"
              disabled={pending}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="••••••••"
              className="border-border/80 focus:border-black focus:ring-black"
              type="password"
              required
            />
          </div>

          <Button type="submit" className="w-full bg-black text-white hover:bg-gray-800" disabled={pending}>
            {pending ? (
              <>
                <span className="mr-2 inline-block h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"></span>
                Creating account...
              </>
            ) : (
              "Create Account"
            )}
          </Button>
        </form>

        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <Separator className="w-full" />
          </div>
          <div className="relative flex justify-center text-xs">
            <span className="bg-background px-2 text-muted-foreground">or continue with</span>
          </div>
        </div>

        <Button
          disabled={pending}
          onClick={handleGoogleSignup}
          variant="outline"
          className="relative w-full border-border/80 hover:bg-background"
        >
          <FcGoogle className="mr-2 h-5 w-5" />
          Google
        </Button>

        <div className="text-center text-sm">
          <p className="text-muted-foreground">
            Already have an account?{" "}
            <button
              type="button"
              className="font-medium text-black hover:underline"
              onClick={() => setFormType("signIn")}
            >
              Sign in
            </button>
          </p>
        </div>
      </CardContent>
    </Card>
  )
}

