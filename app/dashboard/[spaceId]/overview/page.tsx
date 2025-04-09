"use client"

import { use } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { ChevronRight, Settings, Users, Globe } from "lucide-react"

interface OverviewPageProps {
  params: Promise<{
    spaceId: string
  }>
}

export default function OverviewPage({ params }: OverviewPageProps) {
  // Unwrap the params Promise using the use hook
  const unwrappedParams = use(params)
  const { spaceId } = unwrappedParams

  const navigationItems = [
    {
      id: 1,
      title: "Set Target Users",
      description: "Define your audience demographics and preferences",
      href: `/dashboard/${spaceId}/overview/setTargetCustomers`,
      icon: Users,
    },
    {
      id: 2,
      title: "View Product Data",
      description: "Target specific organizations and business types",
      href: `/dashboard/${spaceId}/overview/viewProductData`,
      icon: Settings,
    },
    {
      id: 3,
      title: "Edit Product Data",
      description: "Define geographic areas for your campaign",
      href: `/dashboard/${spaceId}/overview/viewProductData`,
      icon: Globe,
    },
  ]

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-2xl font-bold mb-2 text-gray-900">Campaign Overview</h1>
        <p className="text-gray-600 mb-8">Configure your campaign settings by selecting an option below.</p>

        <div className="grid gap-4">
          {navigationItems.map((item) => (
            <Card
              key={item.id}
              className="border-gray-200 hover:border-gray-300 hover:shadow-sm transition-all cursor-pointer"
              onClick={() => (window.location.href = item.href)}
            >
              <CardContent className="p-0">
                <div className="flex items-center p-4">
                  <div className="mr-4 flex h-12 w-12 items-center justify-center rounded-full bg-gray-100">
                    <item.icon className="h-6 w-6 text-gray-600" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-lg font-medium text-gray-900">{item.title}</h3>
                    <p className="text-sm text-gray-600">{item.description}</p>
                  </div>
                  <ChevronRight className="h-5 w-5 text-gray-400" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  )
}

