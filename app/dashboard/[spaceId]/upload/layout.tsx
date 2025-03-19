"use client"

import type React from "react"

import { usePathname } from "next/navigation"
import Link from "next/link"
import { FileText, Users, ShoppingBag } from "lucide-react"
import { cn } from "@/lib/utils"

interface UploadLayoutProps {
  children: React.ReactNode
  params: {
    spaceId: string
  }
}

export default function UploadLayout({ children, params }: UploadLayoutProps) {
  const { spaceId } = params
  const pathname = usePathname()

  const uploadNavItems = [
    {
      name: "Campaign Data",
      href: `/dashboard/${spaceId}/upload/campaignData`,
      icon: FileText,
    },
    {
      name: "Customer Data",
      href: `/dashboard/${spaceId}/upload/customerData`,
      icon: Users,
    },
    {
      name: "Product Data",
      href: `/dashboard/${spaceId}/upload/productData`,
      icon: ShoppingBag,
    },
  ]

  return (
    <div className="flex flex-col w-full">
      {/* Secondary Navigation */}
      <div className="border-b bg-background">
        <div className="container flex h-16 items-center px-4">
          <h1 className="text-lg font-semibold mr-8">Upload Data</h1>
          <nav className="flex items-center space-x-4 lg:space-x-6">
            {uploadNavItems.map((item) => {
              const isActive =
                pathname === item.href ||
                (pathname.startsWith(item.href) && item.href !== `/dashboard/${spaceId}/upload`)

              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={cn(
                    "flex items-center text-sm font-medium transition-colors hover:text-primary",
                    isActive ? "text-primary border-b-2 border-primary" : "text-muted-foreground",
                  )}
                >
                  <item.icon className="mr-2 h-4 w-4" />
                  {item.name}
                </Link>
              )
            })}
          </nav>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1">{children}</div>
    </div>
  )
}

