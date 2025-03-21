"use client"

import { useState, use } from "react"
import { Button } from "@/components/ui/button"
import { useToast } from "@/components/ui/use-toast"
import { Loader2, PlayCircle } from "lucide-react"

interface CampaignPageProps {
  params: Promise<{ spaceId: string }>
}

export default function CampaignPage({ params }: CampaignPageProps) {
  const unwrappedParams = use(params)
  const { spaceId } = unwrappedParams
  const { toast } = useToast()
  const [isLoading, setIsLoading] = useState(false)

  const startCampaign = async () => {
    setIsLoading(true)

    try {
      const response = await fetch(`/api/campaign/spaceId=${spaceId}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ spaceId }),
      })

      if (response.ok) {
        const data = await response.json()
        toast({
          title: "Campaign Started",
          description: "Your campaign has been successfully started.",
        })
      } else {
        const error = await response.json()
        throw new Error(error.message || "Failed to start campaign")
      }
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to start campaign",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="container py-10">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-3xl font-bold mb-6">Campaign Management</h1>

        <div className="bg-card border rounded-lg p-8 shadow-sm">
          <div className="text-center">
            <PlayCircle className="h-16 w-16 text-primary mx-auto mb-4" />
            <h2 className="text-2xl font-semibold mb-2">Ready to Launch Your Campaign?</h2>
            <p className="text-muted-foreground mb-6">
              Start your campaign to begin engaging with your audience. Make sure you have uploaded all necessary data.
            </p>

            <Button size="lg" onClick={startCampaign} disabled={isLoading} className="px-8">
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Starting...
                </>
              ) : (
                "Start Campaign"
              )}
            </Button>
          </div>
        </div>

        <div className="mt-8 bg-muted/50 rounded-lg p-6 border">
          <h3 className="font-medium mb-2">Campaign Information</h3>
          <p className="text-sm text-muted-foreground mb-4">
            This will initiate a campaign for Space ID:{" "}
            <span className="font-mono bg-muted px-1 py-0.5 rounded">{spaceId}</span>
          </p>
          <div className="text-sm space-y-2">
            <p>• All uploaded data will be used for this campaign</p>
            <p>• The campaign will run according to your configured settings</p>
            <p>• You can monitor progress in the analytics dashboard</p>
          </div>
        </div>
      </div>
    </div>
  )
}

