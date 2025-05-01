
"use client"

import { useState, use, useRef ,useEffect} from "react"
import { Button } from "@/components/ui/button"
import { useToast } from "@/components/ui/use-toast"
import { Loader2, PlayCircle, MessageSquare, X, Send, ChevronRight, ChevronLeft } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { cn } from "@/lib/utils"
import { addConversation,fetchConversationHistory,fetchModelProvider } from "@/app/actions/prisma"
import {getCustomInitialMessage ,fetchCustomerData} from "@/app/actions/pc"


interface CampaignPageProps {
  params: Promise<{ spaceId: string }>
}

interface Message {
  id: number
  content: string
  sender: "USER" | "BOT"
}

export default function CampaignPage({ params }: CampaignPageProps) {
  const unwrappedParams = use(params)
  const { spaceId } = unwrappedParams
  const { toast } = useToast()
  const [isLoading, setIsLoading] = useState(false)
  const [chatExpanded, setChatExpanded] = useState(false)
  const [isLoadingHistory, setIsLoadingHistory] = useState(false)

  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState<string>("")
  const [isChatLoading, setIsChatLoading] = useState<boolean>(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const loadConversationHistory = async () => {
      if (chatExpanded && messages.length === 0) {
        setIsLoadingHistory(true);
        try {
          console.log("1")
          const response = await fetchConversationHistory(parseInt(spaceId), spaceId);
          console.log("fetching conversation hsitory",response)
          const conversations = response?.conversations || [];
          if (conversations.length > 0) {
            const historyMessages = conversations.map((conv: any, index: number) => ({
              id: index + 1,
              content: conv.content,
              sender: conv.sender,
            }));
  
            setMessages(historyMessages);
          } else {
            console.log("2")
            const customInitalMessage = await getCustomInitialMessage(parseInt(spaceId)) || "Hello! I&apos;m your AI assistant. How can I help you today?"
            await addConversation(parseInt(spaceId),spaceId,customInitalMessage,"BOT")
            setMessages([
              {
                id: 1,
                content: customInitalMessage,
                sender: "BOT",
              },
            ]);
          }
        } catch (error) {
          console.error("Error loading conversation history:", error);
          toast({
            title: "Error",
            description: "Failed to load conversation history",
            variant: "destructive",
          });
          
          setMessages([
            { 
              id: 1, 
              content: "Sorry there was an error , we will get it fixed soon", 
              sender: "BOT" 
            }
          ]);
        } finally {
          setIsLoadingHistory(false);
          
          // Scroll to bottom after loading history
          setTimeout(() => {
            messagesEndRef.current?.scrollIntoView({ behavior: "auto" });
          }, 100);
        }
      }
    };
    
    loadConversationHistory();
  }, [chatExpanded, toast, messages.length, spaceId]);

  const startCampaign = async () => {
    setIsLoading(true)

    try {
      const response = await fetch(`/api/campaign/?spaceId=${spaceId}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      })

      if (response.ok) {
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

  const handleSendMessage = async () => {
    if (!input.trim()) return

    const userMessage: Message = {
      id: messages.length + 1,
      content: input,
      sender: "USER",
    }
    setMessages((prev) => [...prev, userMessage])
    setInput("")
    setIsChatLoading(true)

    // Scroll to bottom
    setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
    }, 100)

    try {
      const response = await fetch(`/api/sampleChat/?spaceId=${spaceId}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({query:input,mobileNumber:spaceId})
      })
      if (response.ok) {
        const data = await response.json()
        // Only add bot message if there's actual content
        if (data.message && data.message.length > 0) {
          const botMessage: Message = {
            id: messages.length + 2,
            content: data.message,
            sender: "BOT",
          }
          setMessages((prev) => [...prev, botMessage])
        }
      } else {
        const error = await response.json()
        throw new Error(error.message || "Failed to send message")
      }
    } catch (error) {
      console.error("Error in chat:", error)
      toast({
        title: "Chat Error",
        description: "Failed to get a response. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsChatLoading(false)

      // Scroll to bottom again after response
      setTimeout(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
      }, 100)
    }
  }

  return (
    <div className="flex h-[calc(100vh-4rem)]">
      {/* Main content */}
      <div className={cn("flex-1 overflow-auto transition-all duration-300", chatExpanded ? "mr-[400px]" : "mr-0")}>
        <div className="container py-8">
          <div className="max-w-3xl mx-auto">
            <h1 className="text-3xl font-bold mb-6 text-foreground">Campaign Management</h1>

            <Card className="mb-8 border-border">
              <CardContent className="pt-6">
                <div className="text-center">
                  <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gray-100 mb-4">
                    <PlayCircle className="h-8 w-8 text-black" />
                  </div>
                  <h2 className="text-2xl font-semibold mb-2 text-foreground">Ready to Launch Your Campaign?</h2>
                  <p className="text-muted-foreground mb-6 max-w-lg mx-auto">
                    Start your campaign to begin engaging with your audience. Make sure you have uploaded all necessary
                    data.
                  </p>

                  <Button
                    size="lg"
                    onClick={startCampaign}
                    disabled={isLoading}
                    className="px-8 bg-black text-white hover:bg-background hover:text-black hover:border-black border border-transparent transition-colors"
                  >
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
              </CardContent>
            </Card>

            <Card className="border-border">
              <CardHeader>
                <CardTitle className="text-lg font-medium text-foreground">Campaign Information</CardTitle>
              </CardHeader>
              <CardContent className="text-sm text-muted-foreground">
                <p className="mb-4">
                  This will initiate a campaign for Space ID:{" "}
                  <span className="font-mono bg-gray-100 px-1.5 py-0.5 rounded text-gray-800">{spaceId}</span>
                </p>
                <div className="space-y-2">
                  <div className="flex items-start gap-2">
                    <div className="rounded-full bg-gray-100 p-1 mt-0.5">
                      <ChevronRight className="h-3 w-3 text-muted-foreground" />
                    </div>
                    <p>All uploaded data will be used for this campaign</p>
                  </div>
                  <div className="flex items-start gap-2">
                    <div className="rounded-full bg-gray-100 p-1 mt-0.5">
                      <ChevronRight className="h-3 w-3 text-muted-foreground" />
                    </div>
                    <p>The campaign will run according to your configured settings</p>
                  </div>
                  <div className="flex items-start gap-2">
                    <div className="rounded-full bg-gray-100 p-1 mt-0.5">
                      <ChevronRight className="h-3 w-3 text-muted-foreground" />
                    </div>
                    <p>You can monitor progress in the analytics dashboard</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Chat panel */}
      <div
        className={cn(
          "fixed top-16 bottom-0 right-0 bg-background border-l border-border transition-all duration-300 flex flex-col",
          chatExpanded ? "w-[400px]" : "w-[50px]",
        )}
      >
        {/* Toggle button */}
        <button
          onClick={() => setChatExpanded(!chatExpanded)}
          className="absolute -left-10 top-4 bg-black text-white p-2 rounded-l-md hover:bg-gray-800"
        >
          {chatExpanded ? <ChevronRight className="h-5 w-5" /> : <ChevronLeft className="h-5 w-5" />}
        </button>

        {chatExpanded ? (
          <>
            {/* Chat header */}
            <div className="border-b border-border p-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <MessageSquare className="h-5 w-5 text-gray-700" />
                <h3 className="font-medium text-foreground">Test Chat</h3>
              </div>
              <Button
                variant="ghost"
                size="sm"
                className="h-8 w-8 p-0 rounded-full"
                onClick={() => setChatExpanded(false)}
              >
                <X className="h-4 w-4" />
                <span className="sr-only">Close</span>
              </Button>
            </div>

            {/* Chat messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={cn("flex", message.sender === "USER" ? "justify-end" : "justify-start")}
                >
                  <div
                    className={cn(
                      "max-w-[80%] rounded-lg p-3",
                      message.sender === "USER" ? "bg-black text-white" : "bg-gray-100 text-gray-800",
                    )}
                  >
                    {message.content}
                  </div>
                </div>
              ))}

              {isChatLoading && (
                <div className="flex justify-start">
                  <div className="bg-gray-100 text-gray-800 p-3 rounded-lg">
                    <div className="flex space-x-2">
                      <div className="h-2 w-2 rounded-full bg-gray-400 animate-bounce [animation-delay:-0.3s]"></div>
                      <div className="h-2 w-2 rounded-full bg-gray-400 animate-bounce [animation-delay:-0.15s]"></div>
                      <div className="h-2 w-2 rounded-full bg-gray-400 animate-bounce"></div>
                    </div>
                  </div>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>

            {/* Chat input */}
            <div className="border-t border-border p-4">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleSendMessage()}
                  placeholder="Type your message..."
                  className="flex-1 rounded-md border border-border/80 px-3 py-2 text-sm bg-background focus:border-black focus:outline-none focus:ring-1 focus:ring-black"
                  // disabled={isChatLoading}
                />
                <Button
                  onClick={handleSendMessage}
                  disabled={!input.trim()}
                  className="bg-black text-white hover:bg-background hover:text-black hover:border-black border border-transparent transition-colors"
                >
                  <Send className="h-4 w-4" />
                  <span className="sr-only">Send</span>
                </Button>
              </div>
            </div>
          </>
        ) : (
          <div className="h-full flex items-center justify-center">
            <MessageSquare className="h-5 w-5 text-muted-foreground/60" />
          </div>
        )}
      </div>
    </div>
  )
}

