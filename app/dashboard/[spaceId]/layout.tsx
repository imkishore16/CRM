"use client"

import DashboardNav from "@/components/dashboard-nav"
import type { ReactNode } from "react"
import { use, useState } from "react"
import { LayoutDashboard, BarChart, Upload, Send, Settings, Users, HelpCircle, Menu, X ,BookOpen} from "lucide-react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { useRouter } from "next/navigation"
import { useTheme } from "next-themes"
import { ScrollArea } from "@/components/ui/scroll-area"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { ChevronDown } from "lucide-react"

const NavItems = (spaceId: string) => [
  {
    name: "Dashboard",
    href: `/dashboard/${spaceId}`,
    icon: LayoutDashboard,
    description: "Overview of your space",
  },
  {
    name: "Overview",
    href: `/dashboard/${spaceId}/overview`,
    icon: BarChart,
    description: "Performance metrics",
  },
  {
    name: "Upload Data",
    href: `/dashboard/${spaceId}/upload`,
    icon: Upload,
    description: "Add new content",
  },
  {
    name: "Campaigns",
    href: `/dashboard/${spaceId}/campaign`,
    icon: Send,
    description: "Manage outreach",
  },
  {
    name: "Chat",
    href: `/dashboard/${spaceId}/chat`,
    icon: Users,
    description: "Interact with AI",
  },
  {
    name: "Settings",
    href: `/dashboard/${spaceId}/settings`,
    icon: Settings,
    description: "Configure your space",
  },
]

interface DashboardLayoutProps {
  children: ReactNode
  params: Promise<{
    spaceId: string
  }>
}

export default function DashboardLayout({ children, params }: DashboardLayoutProps) {
  const unwrappedParams = use(params)
  const { spaceId } = unwrappedParams
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const router = useRouter()


  return (
    <div className="flex min-h-screen flex-col bg-background md:flex-row">
      {/* Mobile header */}
      <div className="border-b border-border bg-background p-4 md:hidden">
        <div className="flex items-center justify-between">
          <Link href="/" className="text-xl font-bold text-foreground">
            Dashboard
          </Link>
          <Button
            variant="outline"
            size="sm"
            className="border-border"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            <span className="sr-only">Toggle menu</span>
            {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </Button>
        </div>
      </div>

      {/* Mobile menu */}
      {mobileMenuOpen && (
        <div className="border-b border-border bg-background md:hidden">
          <div className="py-2">
            <DashboardNav navItems={NavItems(spaceId)} />
          </div>
        </div>
      )}

      {/* Sidebar */}
      <div className="hidden w-64 flex-shrink-0 border-r border-border bg-background md:block">
        <div className="flex h-16 items-center border-b border-border px-6">
          <Link href="/" className="text-xl font-bold text-foreground">
            Dashboard
          </Link>
        </div>
        <div className="p-4">
          <DashboardNav navItems={NavItems(spaceId)} />
        </div>

        <div className="mt-auto p-4">
          <div className="rounded-lg border border-border bg-muted p-4">
            <div className="flex items-center gap-3">
              <div className="rounded-full bg-foreground p-2">
                <HelpCircle className="h-4 w-4 text-background" />
              </div>
              <div>
                <h4 className="text-sm font-medium text-foreground">Need help?</h4>
                <p className="text-xs text-muted-foreground">Contact support</p>
              </div>
            </div>
            <Button
              variant="link"
              className="mt-2 h-auto p-0 text-xs text-foreground flex items-center hover:text-foreground/80"
              onClick={() => router.push(`/dashboard/${spaceId}/documentation`)}
            >
              <BookOpen className="h-3 w-3 mr-1" />
              View documentation
            </Button>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div
        className={cn(
          "flex-1 overflow-hidden",
          mobileMenuOpen ? "h-[calc(100vh-8rem)]" : "h-[calc(100vh-4rem)]",
          "md:h-screen no-scrollbar"
        )}
      >
        <div className="h-full overflow-auto no-scrollbar">
          {children}
        </div>
      </div>
    </div>
  )
}