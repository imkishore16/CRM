"use client";
import { signIn, signOut, useSession } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import { ThemeSwitcher } from "./ThemeSwitcher";
import Link from "next/link";
import { appBar } from "@/constants/appBar";


export function Appbar({ showThemeSwitch = true }) {
  const session = useSession();
  const router = useRouter();

  return (
    <div className="flex justify-between px-5 py-4 md:px-10 xl:px-20">
      <div
        onClick={() => {
          router.push("/home");
        }}
        className={`flex flex-col justify-center text-lg font-bold hover:cursor-pointer ${showThemeSwitch ? "" : "text-white"}`}
      >
        {appBar.appTitle}
      </div>
      <div className="flex items-center gap-x-2">

        {session.data?.user && (
          <Button
            className="bg-purple-600 text-white hover:bg-purple-700"
            onClick={() =>
              signOut({
                callbackUrl: "/",
              })
            }
          >
            Logout
          </Button>
        )}
        {!session.data?.user && (
          <div className="space-x-3">
            <Link
              href={{
                pathname: "/auth",
                query: {
                  authType: "signIn",  // Use "signIn" here
                },
              }}
            >
              <Button
                variant={"ghost"}
                className="bg-purple-600 text-white hover:bg-purple-700"
              >
                Signin
              </Button>
            </Link>
            <Link
              href={{
                pathname: "/auth",
                query: {
                  authType: "signUp",  // Use "signUp" here
                },
              }}
            >
              <Button
                variant={"ghost"}
                className="text-white hover:bg-white/10"
              >
                Signup
              </Button>
            </Link>
          </div>
        )}

        {showThemeSwitch && <ThemeSwitcher />}
      </div>
    </div>
  );
}
