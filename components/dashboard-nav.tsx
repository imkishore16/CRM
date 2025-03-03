"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"

interface NavItem {
  name: string;
  href: string;
  icon: React.ComponentType<any>;
}

interface DashboardNavProps {
  navItems: NavItem[];
}

export default function DashboardNav({ navItems }: DashboardNavProps) {
  const pathname = usePathname()
  // console.log("++++++++++++++++++++++++++++++++++++++++++++++")
  // console.log("pathname :",pathname)
  // navItems.map((item)=>{
  //   const isActive = pathname === item.href
  //   console.log("item.name :",item.name)
  //   console.log("item.href :",item.href)

  // })
  return (
    <nav className="flex flex-col space-y-1">
      {navItems.map((item) => {
        const isActive = pathname === item.href
        const Icon = item.icon
        
        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "flex items-center px-3 py-2 text-sm font-medium rounded-md",
              isActive 
                ? "bg-gray-100 text-gray-900" 
                : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
            )}
          >
            <Icon className={cn("mr-3 h-5 w-5", isActive ? "text-gray-900" : "text-gray-400")} />
            {item.name}
          </Link>
        )
      })}
    </nav>
  )
}