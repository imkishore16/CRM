"use client"

import { cn } from "@/lib/utils"

import type React from "react"
import { useState, use, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useToast } from "@/components/ui/use-toast"
import UploadField from "@/components/UploadField"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Loader2, Info } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { fetchModelProvider } from "@/app/actions/prisma"

interface CampaignFormProps {
  params: Promise<{ spaceId: string }>
}

const communicationStyles = [
  { id: "formal", label: "Formal" },
  { id: "casual", label: "Casual" },
  { id: "friendly", label: "Friendly" },
  { id: "professional", label: "Professional" },
  { id: "direct", label: "Direct" },
  { id: "persuasive", label: "Persuasive" },
]

const campaignTypes = [
  "Email Marketing",
  "Social Media",
  "Content Marketing",
  "Event Marketing",
  "Product Launch",
  "Lead Generation",
  "Brand Awareness",
  "Customer Retention",
]

const llmOptions = [
  { value: "openai", label: "OpenAI" },
  { value: "gemini", label: "Gemini" },
  { value: "huggingface", label: "Hugging Face" },
]

export default function CampaignDataPage({ params }: CampaignFormProps) {
  const unwrappedParams = use(params)
  const { spaceId } = unwrappedParams
  const { toast } = useToast()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isUpdatingLLM, setIsUpdatingLLM] = useState(false)

  // Form state
  const [campaignName, setCampaignName] = useState("")
  const [campaignType, setCampaignType] = useState("")
  const [overrideCompany, setOverrideCompany] = useState("")
  const [personaName, setPersonaName] = useState("")
  const [jobRole, setJobRole] = useState("")
  const [campaignObjective, setCampaignObjective] = useState("")
  const [selectedStyles, setSelectedStyles] = useState<string[]>([])
  const [selectedLLM, setSelectedLLM] = useState<string>("gemini")

  // File uploads
  const [campaignFlow, setCampaignFlow] = useState<File | null>(null)
  const [productLinks, setProductLinks] = useState<File | null>(null)
  const [initialMessage, setInitialMessage] = useState<File | null>(null)
  const [followUpMessage, setFollowUpMessage] = useState<File | null>(null)

  // Form validation
  const [errors, setErrors] = useState<Record<string, string>>({})

  // Fetch current LLM setting
  useEffect(() => {
    const fetchLLMSetting = async () => {
      try {
        const modelProvider = await fetchModelProvider(parseInt(spaceId))
        setSelectedLLM(modelProvider ?? "gemini")

      } catch (error) {
        console.error("Error fetching LLM setting:", error)
      }
    }

    fetchLLMSetting()
  }, [spaceId])

  const handleCommunicationStyleChange = (styleId: string, checked: boolean) => {
    setSelectedStyles((prev) => (checked ? [...prev, styleId] : prev.filter((id) => id !== styleId)))
  }

  const validateForm = () => {
    const newErrors: Record<string, string> = {}

    if (!campaignName.trim()) newErrors.campaignName = "Campaign name is required"
    if (!campaignType) newErrors.campaignType = "Campaign type is required"
    if (!campaignObjective.trim()) newErrors.campaignObjective = "Campaign objective is required"
    if (selectedStyles.length === 0) newErrors.communicationStyle = "At least one communication style is required"
    if (!campaignFlow) newErrors.campaignFlow = "Campaign flow file is required"
    if (!productLinks) newErrors.productLinks = "Product links file is required"
    if (!initialMessage) newErrors.initialMessage = "Initial message file is required"
    if (!followUpMessage) newErrors.followUpMessage = "Follow-up message file is required"

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleLLMChange = async (value: string) => {
    setSelectedLLM(value)
    setIsUpdatingLLM(true)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!validateForm()) {
      toast({
        title: "Validation Error",
        description: "Please fill in all required fields",
        variant: "destructive",
      })
      return
    }

    setIsSubmitting(true)

    try {
      const formData = new FormData()

      // Add text fields
      formData.append("campaignName", campaignName)
      formData.append("campaignType", campaignType)
      formData.append("overrideCompany", overrideCompany)
      formData.append("personaName", personaName)
      formData.append("jobRole", jobRole)
      formData.append("campaignObjective", campaignObjective)

      // Add communication styles as a JSON string
      formData.append("communicationStyles", JSON.stringify(selectedStyles))

      // Add files
      if (campaignFlow) formData.append("campaignFlow", campaignFlow)
      if (productLinks) formData.append("productLinks", productLinks)
      if (initialMessage) formData.append("initialMessage", initialMessage)
      if (followUpMessage) formData.append("followUpMessage", followUpMessage)

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_NEXTAUTH_URL}/api/embed?spaceId=${spaceId}&namespace=campaignData`,
        {
          method: "POST",
          body: formData,
        },
      )

      if (response.ok) {
        toast({
          title: "Success",
          description: "Campaign data uploaded successfully",
        })

        // Reset form
        setCampaignName("")
        setCampaignType("")
        setOverrideCompany("")
        setPersonaName("")
        setJobRole("")
        setCampaignObjective("")
        setSelectedStyles([])
        setCampaignFlow(null)
        setProductLinks(null)
        setInitialMessage(null)
        setFollowUpMessage(null)
      } else {
        throw new Error("Failed to upload campaign data")
      }
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to upload campaign data",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="container max-w-4xl py-8 px-4">
      <h1 className="text-2xl font-bold mb-2 text-gray-900">Campaign Data Upload</h1>
      <p className="text-gray-600 mb-6">Configure your campaign settings and upload necessary files.</p>

      <Alert className="mb-6 border-gray-200 bg-gray-50">
        <Info className="h-4 w-4 text-gray-700" />
        <AlertDescription className="text-gray-700">
          All fields marked with an asterisk (*) are required.
        </AlertDescription>
      </Alert>

      {/* LLM Selection Card */}
      <Card className="border-gray-200 mb-6">
        <CardHeader>
          <CardTitle className="text-xl font-semibold text-gray-900">LLM Preference</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <Label htmlFor="llm-selection" className="text-gray-700">
              Select Language Model
            </Label>
            <div className="flex items-center gap-4">
              <Select value={selectedLLM} onValueChange={handleLLMChange} disabled={isUpdatingLLM}>
                <SelectTrigger
                  id="llm-selection"
                  className="w-[200px] border-gray-200 bg-white focus:border-gray-300 focus:ring-gray-300"
                >
                  <SelectValue placeholder="Select LLM" />
                </SelectTrigger>
                <SelectContent className="bg-white">
                  {llmOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {isUpdatingLLM && <Loader2 className="h-4 w-4 animate-spin text-gray-400" />}
            </div>
            <p className="text-sm text-gray-500">This setting will be used for all campaigns in this space.</p>
          </div>
        </CardContent>
      </Card>

      <Card className="border-gray-200">
        <CardHeader>
          <CardTitle className="text-xl font-semibold text-gray-900">Campaign Information</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Campaign Name */}
              <div className="space-y-2">
                <Label htmlFor="campaignName" className={errors.campaignName ? "text-red-500" : "text-gray-700"}>
                  Campaign Name <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="campaignName"
                  value={campaignName}
                  onChange={(e) => setCampaignName(e.target.value)}
                  className={cn(
                    "border-gray-200 bg-white focus:border-gray-300 focus:ring-gray-300",
                    errors.campaignName && "border-red-500",
                  )}
                />
                {errors.campaignName && <p className="text-red-500 text-xs">{errors.campaignName}</p>}
              </div>

              {/* Campaign Type */}
              <div className="space-y-2">
                <Label htmlFor="campaignType" className={errors.campaignType ? "text-red-500" : "text-gray-700"}>
                  Campaign Type <span className="text-red-500">*</span>
                </Label>
                <Select value={campaignType} onValueChange={setCampaignType}>
                  <SelectTrigger
                    className={cn(
                      "border-gray-200 bg-white focus:border-gray-300 focus:ring-gray-300",
                      errors.campaignType && "border-red-500",
                    )}
                  >
                    <SelectValue placeholder="Select campaign type" />
                  </SelectTrigger>
                  <SelectContent className="bg-white">
                    {campaignTypes.map((type) => (
                      <SelectItem key={type} value={type}>
                        {type}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.campaignType && <p className="text-red-500 text-xs">{errors.campaignType}</p>}
              </div>

              {/* Override Company */}
              <div className="space-y-2">
                <Label htmlFor="overrideCompany" className="text-gray-700">
                  Override Company
                </Label>
                <Input
                  id="overrideCompany"
                  value={overrideCompany}
                  onChange={(e) => setOverrideCompany(e.target.value)}
                  className="border-gray-200 bg-white focus:border-gray-300 focus:ring-gray-300"
                />
              </div>

              {/* Override Persona - Name */}
              <div className="space-y-2">
                <Label htmlFor="personaName" className="text-gray-700">
                  Persona Name
                </Label>
                <Input
                  id="personaName"
                  value={personaName}
                  onChange={(e) => setPersonaName(e.target.value)}
                  className="border-gray-200 bg-white focus:border-gray-300 focus:ring-gray-300"
                />
              </div>

              {/* Override Persona - Job Role */}
              <div className="space-y-2">
                <Label htmlFor="jobRole" className="text-gray-700">
                  Job Role
                </Label>
                <Input
                  id="jobRole"
                  value={jobRole}
                  onChange={(e) => setJobRole(e.target.value)}
                  className="border-gray-200 bg-white focus:border-gray-300 focus:ring-gray-300"
                />
              </div>

              {/* Campaign Objective */}
              <div className="space-y-2">
                <Label
                  htmlFor="campaignObjective"
                  className={errors.campaignObjective ? "text-red-500" : "text-gray-700"}
                >
                  Campaign Objective <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="campaignObjective"
                  value={campaignObjective}
                  onChange={(e) => setCampaignObjective(e.target.value)}
                  className={cn(
                    "border-gray-200 bg-white focus:border-gray-300 focus:ring-gray-300",
                    errors.campaignObjective && "border-red-500",
                  )}
                />
                {errors.campaignObjective && <p className="text-red-500 text-xs">{errors.campaignObjective}</p>}
              </div>
            </div>

            {/* Communication Style */}
            <div className="space-y-2">
              <Label className={errors.communicationStyle ? "text-red-500" : "text-gray-700"}>
                Communication Style <span className="text-red-500">*</span>
              </Label>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4 p-4 border border-gray-200 rounded-md bg-gray-50">
                {communicationStyles.map((style) => (
                  <div key={style.id} className="flex items-center space-x-2">
                    <Checkbox
                      id={`style-${style.id}`}
                      checked={selectedStyles.includes(style.id)}
                      onCheckedChange={(checked) => handleCommunicationStyleChange(style.id, checked === true)}
                      className="border-gray-300 text-black focus:ring-gray-300"
                    />
                    <Label htmlFor={`style-${style.id}`} className="cursor-pointer text-gray-700">
                      {style.label}
                    </Label>
                  </div>
                ))}
              </div>
              {errors.communicationStyle && <p className="text-red-500 text-xs">{errors.communicationStyle}</p>}
            </div>

            {/* File Uploads */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <UploadField
                id="campaignFlow"
                title="Campaign Flow"
                required
                value={campaignFlow}
                onChange={setCampaignFlow}
                error={!!errors.campaignFlow}
                helperText={errors.campaignFlow}
              />

              <UploadField
                id="productLinks"
                title="Product Links"
                required
                value={productLinks}
                onChange={setProductLinks}
                error={!!errors.productLinks}
                helperText={errors.productLinks}
              />

              <UploadField
                id="initialMessage"
                title="Initial Message"
                required
                value={initialMessage}
                onChange={setInitialMessage}
                error={!!errors.initialMessage}
                helperText={errors.initialMessage}
              />

              <UploadField
                id="followUpMessage"
                title="Follow-up Message"
                required
                value={followUpMessage}
                onChange={setFollowUpMessage}
                error={!!errors.followUpMessage}
                helperText={errors.followUpMessage}
              />
            </div>

            <div className="pt-4 flex justify-end">
              <Button
                type="submit"
                className="bg-black text-white hover:bg-white hover:text-black hover:border-black border border-transparent transition-colors"
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Uploading...
                  </>
                ) : (
                  "Submit Campaign Data"
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
