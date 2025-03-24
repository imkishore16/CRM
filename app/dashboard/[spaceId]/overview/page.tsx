"use client"

import { use } from "react"
import ClickableTable from "@/components/clickable-table"

interface OverviewPageProps {
  params: Promise<{
    spaceId: string
  }>
}

export default function OverviewPage({ params }: OverviewPageProps) {
  // Unwrap the params Promise using the use hook
  const unwrappedParams = use(params)
  const { spaceId } = unwrappedParams

  console.log("spaceId : ", spaceId)

  const tableData = [
    { id: 1, title: "Set Target Users", href: `/dashboard/${spaceId}/overview/setTargetCustomers` },
    { id: 3, title: "Set Target Companies", href: `/dashboard/${spaceId}/overview/setTargetCompanies` },
    { id: 4, title: "Set Target Regions", href: `/dashboard/${spaceId}/overview/setTargetRegions` },
  ]

  return (
    <div className="container mx-auto py-10 px-4">
      <h1 className="text-2xl font-bold mb-6">Overview</h1>
      <p className="mb-8">Select an option below to configure your campaign settings.</p>

      <div className="max-w-2xl">
        <ClickableTable items={tableData} />
      </div>
    </div>
  )
}

