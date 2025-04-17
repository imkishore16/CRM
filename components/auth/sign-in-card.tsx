"use client"
import type React from "react"
import { useState } from "react"
import { AlertCircle } from "lucide-react"
import { FcGoogle } from "react-icons/fc"
import { signIn } from "next-auth/react"
import { useRouter } from "next/navigation"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import type { SignInFlow } from "@/types/auth-types"
import { Label } from "@/components/ui/label"

interface SigninCardProps {
  setFormType: (state: SignInFlow) => void
}

export default function SigninCard({ setFormType }: SigninCardProps) {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [pending, setPending] = useState(false)
  const [error, setError] = useState("")
  const router = useRouter()

  const signInWithProvider = async (provider: "google" | "credentials" | "spotify") => {
    try {
      const res = await signIn(provider, {
        email,
        password,
        redirect: false,
        callbackUrl: "/home",
      })

      if (res?.error) {
        setError(res.error)
      } else {
        router.push("/")
      }
      setPending(false)
    } catch (error) {
      console.log(error)
      setPending(false)
    }
  }

  const handlerCredentialSignin = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()

    setError("")
    setPending(true)
    signInWithProvider("credentials")
  }

  const handleGoogleSignin = () => {
    setError("")
    setPending(true)
    signInWithProvider("google")
  }

  return (
    <Card className="w-full border border-gray-200 bg-white shadow-sm">
      <CardHeader className="space-y-1 pb-6">
        <CardTitle className="text-center text-2xl font-bold text-gray-900">Sign In</CardTitle>
        <p className="text-center text-sm text-gray-500">Enter your credentials to access your account</p>
      </CardHeader>

      {!!error && (
        <div className="mx-6 mb-4 flex items-center gap-x-2 rounded-md bg-red-50 p-3 text-sm text-red-600">
          <AlertCircle className="h-4 w-4 shrink-0" />
          <p>{error}</p>
        </div>
      )}

      <CardContent className="space-y-6 px-6">
        <form onSubmit={handlerCredentialSignin} className="space-y-4">
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
              className="border-gray-300 focus:border-black focus:ring-black"
              type="email"
              required
            />
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="password" className="text-gray-700">
                Password
              </Label>
              <Button variant="link" className="h-auto p-0 text-xs text-gray-600 hover:text-black" type="button">
                Forgot password?
              </Button>
            </div>
            <Input
              id="password"
              disabled={pending}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="border-gray-300 focus:border-black focus:ring-black"
              type="password"
              required
            />
          </div>

          <Button disabled={pending} type="submit" className="w-full bg-black text-white hover:bg-gray-800">
            {pending ? (
              <>
                <span className="mr-2 inline-block h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"></span>
                Signing in...
              </>
            ) : (
              "Sign In"
            )}
          </Button>
        </form>

        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <Separator className="w-full" />
          </div>
          <div className="relative flex justify-center text-xs">
            <span className="bg-white px-2 text-gray-500">or continue with</span>
          </div>
        </div>

        <Button
          disabled={pending}
          onClick={handleGoogleSignin}
          variant="outline"
          className="relative w-full border-gray-300 hover:bg-gray-50"
        >
          <FcGoogle className="mr-2 h-5 w-5" />
          Google
        </Button>

        <div className="text-center text-sm">
          <p className="text-gray-600">
            Don&apos;t have an account?{" "}
            <button
              type="button"
              className="font-medium text-black hover:underline"
              onClick={() => setFormType("signUp")}
            >
              Sign up
            </button>
          </p>
        </div>
      </CardContent>
    </Card>
  )
}

