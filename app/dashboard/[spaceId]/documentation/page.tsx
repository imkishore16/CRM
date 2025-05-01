"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ChevronRight, BookOpen, FileText, MessageSquare, Settings, Info } from "lucide-react"

export default function DocumentationPage() {
  const [activeTab, setActiveTab] = useState("overview")

  return (
    <div className="container py-10 px-6 md:px-8 lg:px-10 max-w-5xl mx-auto">
      <div className="flex items-center gap-3 mb-8">
        <div className="h-10 w-10 rounded-full bg-black flex items-center justify-center">
          <BookOpen className="h-5 w-5 text-white" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-foreground">Campaign Documentation</h1>
          <p className="text-muted-foreground">Learn how to create effective campaigns and maximize your results</p>
        </div>
      </div>

      <Tabs defaultValue="overview" value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <div className="bg-background border border-border rounded-lg p-1">
          <TabsList className="grid grid-cols-3 w-full">
            <TabsTrigger value="overview" className="data-[state=active]:bg-gray-100">
              <FileText className="h-4 w-4 mr-2" />
              Overview
            </TabsTrigger>
            <TabsTrigger value="instructions" className="data-[state=active]:bg-gray-100">
              <MessageSquare className="h-4 w-4 mr-2" />
              Instructions
            </TabsTrigger>
            <TabsTrigger value="tips" className="data-[state=active]:bg-gray-100">
              <Settings className="h-4 w-4 mr-2" />
              Key Tips
            </TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="overview" className="space-y-6">
          <Card className="border-border">
            <CardHeader className="bg-background border-b border-border">
              <CardTitle className="text-xl font-semibold text-foreground">
                Overview of Campaign Creation Fields
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <p className="text-gray-700 mb-6">
                Before designing a successful campaign, you need to understand the key variables involved. These inputs
                define the structure, communication style, and flow of your campaign.
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {[
                  "Campaign Name",
                  "Campaign Type",
                  "Override Company",
                  "Company Name",
                  "About Company",
                  "Override Persona",
                  "Persona Name",
                  "Persona Job Role",
                  "Communication Style",
                  "Target Users",
                  "Title",
                  "Description",
                  "Campaign Objective",
                  "Campaign Flow",
                  "Product Links",
                  "Initial Message",
                  "Followup Message",
                ].map((item, index) => (
                  <div key={index} className="flex items-center gap-2 p-3 bg-background rounded-md">
                    <ChevronRight className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                    <span className="text-gray-800 font-medium">{item}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="instructions" className="space-y-6">
          <Card className="border-border">
            <CardHeader className="bg-background border-b border-border">
              <CardTitle className="text-xl font-semibold text-foreground">
                Writing Effective Instructions for Each Variable
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6 space-y-8">
              <div>
                <p className="text-gray-700 mb-6">
                  Now that you understand the core variables, let's break down how to create effective prompts for each.
                  The goal is to guide the AI in the best possible way, so it can deliver optimal performance in your
                  campaign.
                </p>

                <div className="space-y-8">
                  {/* Campaign Name */}
                  <div className="border-b border-border pb-6">
                    <h3 className="text-lg font-semibold text-foreground mb-3">1. Campaign Name</h3>
                    <p className="text-gray-700 mb-3">
                      The Campaign Name field doesn't directly affect the Chat. However, it should be descriptive enough
                      to easily identify the campaign's purpose or target audience for internal use.
                    </p>
                    <div className="bg-background p-4 rounded-md">
                      <h4 className="font-medium text-gray-800 mb-2">Tips:</h4>
                      <ul className="list-disc list-inside space-y-1 text-gray-700">
                        <li>Use numbered and lettered headings to organize the campaign structure or funnel.</li>
                        <li>
                          Include a reference to the target contacts for the campaign, as this enhances its value for
                          future use cases and analytics.
                        </li>
                      </ul>
                      <h4 className="font-medium text-gray-800 mt-4 mb-2">Example:</h4>
                      <ul className="list-disc list-inside space-y-1 text-gray-700">
                        <li>"1. User survey for the New Batch 05 - Hubspot 20k List (till 20th September)"</li>
                        <li>"2.A. Pre webinar promotion - Website Inbound Leads"</li>
                        <li>"2.B. Post webinar sales - Attendees (28th September)"</li>
                      </ul>
                    </div>
                  </div>

                  {/* Campaign Type */}
                  <div className="border-b border-border pb-6">
                    <h3 className="text-lg font-semibold text-foreground mb-3">2. Campaign Type</h3>
                    <p className="text-gray-700 mb-3">
                      The Campaign Type determines the approach and tone. Choose between Sales, Survey, or Support.
                    </p>
                    <div className="bg-background p-4 rounded-md">
                      <ul className="list-disc list-inside space-y-2 text-gray-700">
                        <li>
                          <span className="font-medium">"Survey":</span> For user interviews, lead qualifications,
                          product-related feedback, etc.
                        </li>
                        <li>
                          <span className="font-medium">"Sales":</span> For sales pitch about an offering, booking
                          meetings, etc.
                        </li>
                        <li>
                          <span className="font-medium">"Support":</span> For handling all inbound customer query
                          messages, guiding users through their product journey, etc.
                        </li>
                      </ul>
                    </div>
                  </div>

                  {/* Override Company */}
                  <div className="border-b border-border pb-6">
                    <h3 className="text-lg font-semibold text-foreground mb-3">3. Override Company</h3>
                    <p className="text-gray-700 mb-3">
                      This feature is used when you need to run campaigns for a specific sub-product within your larger
                      organization. By default, your company name is passed to the model during chat. When you override
                      the name and description, the model will treat that information while chatting, only for the
                      particular campaign.
                    </p>
                    <div className="bg-background p-4 rounded-md mb-4">
                      <h4 className="font-medium text-gray-800 mb-2">
                        Company Name: The exact name of the creator or sub-brand.
                      </h4>
                      <p className="text-gray-700 mb-2">Best Practice:</p>
                      <ul className="list-disc list-inside space-y-1 text-gray-700 mb-3">
                        <li>Use the full name of the company or sub-product to ensure clarity.</li>
                        <li>
                          Use relevant words, such as 'from' or 'by', to show the connection between the
                          sub-brand/sub-product and the main company.
                        </li>
                      </ul>
                      <p className="text-gray-700 mb-2">Example:</p>
                      <ul className="list-disc list-inside space-y-1 text-gray-700">
                        <li>"Diet Coke by The Coca-Cola Company"</li>
                        <li>"Here from HDFC ERGO"</li>
                      </ul>
                    </div>
                    <div className="bg-background p-4 rounded-md">
                      <h4 className="font-medium text-gray-800 mb-2">
                        About Company: A brief, compelling description of the company or product.
                      </h4>
                      <p className="text-gray-700 mb-2">Best Practice:</p>
                      <ul className="list-disc list-inside space-y-1 text-gray-700 mb-3">
                        <li>Focus on the unique value proposition.</li>
                        <li>Keep it concise but informative.</li>
                      </ul>
                      <p className="text-gray-700 mb-2">Example:</p>
                      <ul className="list-disc list-inside space-y-1 text-gray-700 mb-3">
                        <li>
                          "Helping business leaders manage stress, deal with procrastination, and unlock their
                          potential."
                        </li>
                      </ul>
                      <p className="text-gray-700 italic">
                        Pro Tip: Write the description in a way that resonates with the campaign's target audience.
                      </p>
                    </div>
                  </div>

                  {/* More sections would continue here */}
                  <div className="text-center py-4">
                    <p className="text-muted-foreground">
                      Scroll through the tabs to see more detailed instructions for each campaign variable.
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="tips" className="space-y-6">
          <Card className="border-border">
            <CardHeader className="bg-background border-b border-border">
              <CardTitle className="text-xl font-semibold text-foreground">Key Tips for Writing Flows</CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <div className="space-y-6">
                <div className="flex gap-4 items-start">
                  <div className="bg-black rounded-full p-2 flex-shrink-0">
                    <Info className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-foreground mb-2">Use Second Person POV</h3>
                    <p className="text-gray-700">
                      Instruct the AI addressing as "you" and "your," as if speaking directly to it. Be clear but
                      conversational, using phrases you'd naturally use with your end users.
                    </p>
                  </div>
                </div>

                <div className="flex gap-4 items-start">
                  <div className="bg-black rounded-full p-2 flex-shrink-0">
                    <Info className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-foreground mb-2">Capitalize Action Words</h3>
                    <p className="text-gray-700">
                      Emphasize key actions by capitalizing words like ASK, THANK, or SHARE. This helps the AI
                      prioritize important steps.
                    </p>
                  </div>
                </div>

                <div className="flex gap-4 items-start">
                  <div className="bg-black rounded-full p-2 flex-shrink-0">
                    <Info className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-foreground mb-2">
                      Use Quotation Marks for Specific Phrases
                    </h3>
                    <p className="text-gray-700">
                      When you want the AI to use exact wording, enclose it in quotation marks. This clearly indicates
                      the precise language to be used.
                    </p>
                    <p className="text-gray-700 mt-2 italic">
                      Example: THANK the user for replying. ASK if they have attended any "Java and Spring Boot
                      development" interviews recently.
                    </p>
                  </div>
                </div>

                <div className="flex gap-4 items-start">
                  <div className="bg-black rounded-full p-2 flex-shrink-0">
                    <Info className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-foreground mb-2">Keep Instructions Concise</h3>
                    <p className="text-gray-700">
                      Avoid covering all edge cases in the Flow. With an 8-step limit, focus on precision. The shorter
                      and clearer the instruction, the better it performs.
                    </p>
                  </div>
                </div>

                <div className="flex gap-4 items-start">
                  <div className="bg-black rounded-full p-2 flex-shrink-0">
                    <Info className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-foreground mb-2">Utilize the Second Brain Manager</h3>
                    <p className="text-gray-700">
                      Address more edge cases by utilizing the Second Brain Manager and adding relevant, high-quality
                      memories to the model.
                    </p>
                  </div>
                </div>

                <div className="flex gap-4 items-start">
                  <div className="bg-black rounded-full p-2 flex-shrink-0">
                    <Info className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-foreground mb-2">Test and Iterate</h3>
                    <p className="text-gray-700">
                      Testing is essential! Iterate on the prompt wording to ensure the AI effectively engages users and
                      achieves the desired outcomes.
                    </p>
                    <p className="text-gray-700 mt-2">
                      By default, if the model cannot handle a query, it will ask the end user to email the support
                      address.
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
