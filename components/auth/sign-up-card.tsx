"use client";
import { useState } from "react";
import { FcGoogle } from "react-icons/fc";
import { SiSpotify } from "react-icons/si"; // Import Spotify icon
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";

import { SignInFlow } from "@/types/auth-types";
import { TriangleAlert } from "lucide-react";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";

interface SignupCardProps {
  setFormType: (state: SignInFlow) => void;
}

export default function SignupCard({ setFormType: setState }: SignupCardProps) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);
  const router = useRouter();

  const signInWithProvider = async (provider: "google" | "credentials" | "spotify") => {
    try {
      const res = signIn(provider, {
        email,
        password,
        redirect: false,
        callbackUrl: "/home",
      });
      
      res.then((res) => {
        if (res?.error) {
          setError(res.error);
        } else {
          router.push("/"); // Redirect on successful signup
        }
        setPending(false);
      });
      
    } catch (error) {
      console.log(error);
    }
  };

  const handlerCredentialSignup = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError("");
    setPending(true);
    if (password !== confirmPassword) {
      setError("Passwords do not match");
      setPending(false);
      return;
    }
    signInWithProvider("credentials");
  };

  const handleGoogleSignup = () => {
    setError("");
    setPending(true);
    signInWithProvider("google");
  };

  const handleSpotifySignup = () => {
    setError("");
    setPending(true);
    signInWithProvider("spotify");
  };

  return (
    <Card className="h-full w-full border-purple-600 bg-gray-800 bg-opacity-50 p-8">
      <CardHeader className="w-full">
        <CardTitle className="text-center text-3xl font-bold text-white">
          Signup to Start Listening
        </CardTitle>
      </CardHeader>
      {!!error && (
        <div className="mb-6 flex w-full items-center gap-x-2 rounded-md bg-destructive p-3 text-sm text-white">
          <TriangleAlert className="size-4 shrink-0" />
          <p>{error}</p>
        </div>
      )}
      <CardContent className="space-y-6 px-0 pb-0">
        <form className="space-y-4" onSubmit={handlerCredentialSignup}>
          <Input
            disabled={pending}
            value={email}
            placeholder="Email"
            onChange={(e) => setEmail(e.target.value)}
            className="border-gray-400 bg-transparent text-white placeholder:text-gray-400 focus-visible:ring-purple-600 focus-visible:ring-offset-0"
            type="email"
            required
          />
          <Input
            disabled={pending}
            value={password}
            placeholder="Password"
            onChange={(e) => setPassword(e.target.value)}
            className="border-gray-400 bg-transparent text-white placeholder:text-gray-400 focus-visible:ring-purple-600 focus-visible:ring-offset-0"
            type="password"
            required
          />
          <Input
            disabled={pending}
            value={confirmPassword}
            placeholder="Confirm Password"
            onChange={(e) => setConfirmPassword(e.target.value)}
            className="border-gray-400 bg-transparent text-white placeholder:text-gray-400 focus-visible:ring-purple-600 focus-visible:ring-offset-0"
            type="password"
            required
          />
          <Button
            type="submit"
            className="w-full bg-purple-600 hover:bg-purple-700"
            size={"lg"}
            disabled={pending}
          >
            Continue
          </Button>
        </form>
        <Separator className="bg-gradient-to-r from-gray-800 via-neutral-500 to-gray-800" />
        <div className="flex flex-col items-center gap-y-2.5">
          <Button
            disabled={pending}
            onClick={handleGoogleSignup}
            size={"lg"}
            className="relative w-full bg-white text-black hover:bg-white/90"
          >
            <FcGoogle className="absolute left-2.5 top-3 size-5" />
            Continue with Google
          </Button>
          {/* <Button
            disabled={pending}
            onClick={handleSpotifySignup}
            size={"lg"}
            className="relative w-full bg-green-600 text-white hover:bg-green-700"
          >
            <SiSpotify className="absolute left-2.5 top-3 size-5" />
            Continue with Spotify
          </Button> */}
          <p className="text-xs text-muted-foreground">
            Already have an account?{" "}
            <span
              className="cursor-pointer text-sky-700 hover:underline"
              onClick={() => setState("signIn")}
            >
              Sign in
            </span>
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
