"use client";

import DashboardNav from "@/components/dashboard-nav";
import type { ReactNode } from "react";
import { use } from "react";
import { LayoutDashboard, User, Settings } from "lucide-react";

const NavItems = (spaceId: string) => [
  { name: "Dashboard", href: `/dashboard/${spaceId}`, icon: LayoutDashboard },
  { name: "Overview", href: `/dashboard/${spaceId}/overview`, icon: User },
  { name: "Upload Data", href: `/dashboard/${spaceId}/upload`, icon: Settings },
  { name: "Start Campaign", href: `/dashboard/${spaceId}/campaign`, icon: Settings },
];

interface DashboardLayoutProps {
  children: ReactNode;
  params: Promise<{
    spaceId: string
  }>
}

export default function DashboardLayout({ children, params }: DashboardLayoutProps) {
  const unwrappedParams = use(params);
  const { spaceId } = unwrappedParams;

  return (
    <div className="flex min-h-screen">
      <div className="w-64 border-r bg-card shadow-sm">
        <div className="p-4">
          <h2 className="text-xl font-semibold">Dashboard</h2>
        </div>
        <DashboardNav navItems={NavItems(spaceId)} />
      </div>

      <div className="flex-1">
        {children}
      </div>
    </div>
  );
}