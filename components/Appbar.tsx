"use client"

import { signOut, useSession } from "next-auth/react"
import { Button } from "@/components/ui/button"
import { useRouter } from "next/navigation"
import { ThemeSwitcher } from "./ThemeSwitcher"
import Link from "next/link"
import { appBar } from "@/constants/appBar"
import { Menu } from "lucide-react"
import { useState } from "react"

export function Appbar({ showThemeSwitch = true }) {
  const session = useSession()
  const router = useRouter()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  
  const navigateTo = (path: string, query = {}) => {
    setMobileMenuOpen(false)
    
    if (Object.keys(query).length > 0) {
      // For App Router, we need to construct the URL with search params
      const searchParams = new URLSearchParams()
      Object.entries(query).forEach(([key, value]) => {
        searchParams.set(key, String(value))
      })
      
      const url = `${path}?${searchParams.toString()}`
      router.push(url)
    } else {
      router.push(path)
    }
  }
  

  // Consistent styling classes
  const linkClass = "text-sm font-medium text-gray-700 hover:text-black transition-colors"
  const btnOutlineClass = "border-black bg-black text-white hover:bg-white hover:text-black transition-colors"
  const btnFilledClass = "bg-black text-white hover:bg-gray-900 transition-colors"

  return (
    <header className="sticky top-0 z-50 w-full border-b border-gray-200 bg-white/90 backdrop-blur-md">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        <div 
          onClick={() => navigateTo("/home")} 
          className="flex items-center gap-2 cursor-pointer"
        >
          <span className="text-xl font-bold text-black">{appBar.appTitle}</span>
        </div>

        {/* Desktop Navigation */}
        <div className="hidden md:flex items-center gap-6">
          {session.data?.user ? (
            <>
              

              <div className="flex items-center gap-4">
                {showThemeSwitch && <ThemeSwitcher />}
                <Button
                  variant="outline"
                  className={btnOutlineClass}
                  onClick={() => signOut({ callbackUrl: "/" })}
                >
                  Logout
                </Button>
              </div>
            </>
          ) : (
            <div className="flex items-center gap-4">
              {showThemeSwitch && <ThemeSwitcher />}
              <Button
                variant="outline"
                className={btnOutlineClass}
                onClick={() => navigateTo("/auth", { authType: "signIn" })}
              >
                Sign In
              </Button>
              <Button
                variant="outline"
                className={btnOutlineClass}
                onClick={() => navigateTo("/auth", { authType: "signUp" })}
              >
                Sign Up
              </Button>
            </div>
          )}
        </div>

        {/* Mobile Menu Button */}
        <button
          className="md:hidden p-2 rounded-md hover:bg-gray-100"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
        >
          <Menu className="h-6 w-6 text-black" />
          <span className="sr-only">Toggle menu</span>
        </button>
      </div>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-gray-200 bg-white">
          <div className="container mx-auto px-4 py-3 space-y-3">
            {session.data?.user ? (
              <>
                
                <div className="pt-2 flex items-center justify-between">
                  {showThemeSwitch && <ThemeSwitcher />}
                  <Button
                    variant="outline"
                    className={btnOutlineClass}
                    onClick={() => {
                      signOut({ callbackUrl: "/" })
                      setMobileMenuOpen(false)
                    }}
                  >
                    Logout
                  </Button>
                </div>
              </>
            ) : (
              <div className="pt-2 flex flex-col gap-3">
                {showThemeSwitch && <ThemeSwitcher />}
                <Button
                  variant="outline"
                  className={`w-full ${btnOutlineClass}`}
                  onClick={() => navigateTo("/auth")}
                >
                  Sign In
                </Button>
                <Button
                  className={`w-full ${btnOutlineClass}`}
                  onClick={() => navigateTo("/auth", { authType: "signUp" })}
                >
                  Sign Up
                </Button>
              </div>
            )}
          </div>
        </div>
      )}
    </header>
  )
}