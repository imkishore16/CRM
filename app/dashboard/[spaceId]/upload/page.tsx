import { redirect } from "next/navigation"

interface Props {
  params: {
    spaceId: string
  }
}

export default function UploadPage({ params }: Props) {
  const { spaceId } = params

  redirect(`/dashboard/${spaceId}/upload/campaignData`)
}

