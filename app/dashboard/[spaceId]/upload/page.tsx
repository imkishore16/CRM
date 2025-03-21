import { redirect } from "next/navigation"
import { use } from "react"

interface Props {
  params: Promise<{
    spaceId: string
  }>
}

export default function UploadPage({ params }: Props) {
  const unwrappedParams = use(params)
  const { spaceId } = unwrappedParams
  redirect(`/dashboard/${spaceId}/upload/campaignData`)
}

