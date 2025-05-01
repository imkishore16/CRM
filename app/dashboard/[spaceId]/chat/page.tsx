"use client"

import { useState, use, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { useToast } from "@/components/ui/use-toast"
import { Loader2, MessageSquare, Send } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { cn } from "@/lib/utils"
import { addConversation, fetchConversationHistory } from "@/app/actions/prisma"
import { getCustomInitialMessage } from "@/app/actions/pc"

interface ChatPageProps {
  params: Promise<{ spaceId: string }>
}

interface Message {
  id: number
  content: string
  sender: "USER" | "BOT"
}

export default function ChatPage() {
  const  spaceId  = "0"
  const mobileNumber = "123456789"

  const { toast } = useToast()

  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState<string>("")
  const [isChatLoading, setIsChatLoading] = useState<boolean>(false)
  const [isLoadingHistory, setIsLoadingHistory] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const loadConversationHistory = async () => {
      if (messages.length === 0) {
        setIsLoadingHistory(true)
        try {
          const response = await fetchConversationHistory(Number.parseInt(spaceId), spaceId)
          console.log("fetching conversation history", response)
          const conversations = response?.conversations || []

          if (conversations.length > 0) {
            const historyMessages = conversations.map((conv: any, index: number) => ({
              id: index + 1,
              content: conv.content,
              sender: conv.sender,
            }))

            setMessages(historyMessages)
          } else {
            const customInitialMessage =
              (await getCustomInitialMessage(Number.parseInt(spaceId))) ||
              "Hello! I&apos;m your AI assistant. How can I help you today?"
            await addConversation(Number.parseInt(spaceId), spaceId, customInitialMessage, "BOT")
            setMessages([
              {
                id: 1,
                content: customInitialMessage,
                sender: "BOT",
              },
            ])
          }
        } catch (error) {
          console.error("Error loading conversation history:", error)
          toast({
            title: "Error",
            description: "Failed to load conversation history",
            variant: "destructive",
          })

          setMessages([
            {
              id: 1,
              content: "Sorry there was an error, we will get it fixed soon",
              sender: "BOT",
            },
          ])
        } finally {
          setIsLoadingHistory(false)

          // Scroll to bottom after loading history
          setTimeout(() => {
            messagesEndRef.current?.scrollIntoView({ behavior: "auto" })
          }, 100)
        }
      }
    }

    loadConversationHistory()
  }, [spaceId, toast, messages.length])

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
        body: JSON.stringify({
          query: input,
          mobileNumber: mobileNumber,
        }),
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
        throw new Error(error.message || "Failed to get response")
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
    <div className="container py-8 h-[calc(100vh-4rem)] flex flex-col">
      <div className="flex-none">
        <h1 className="text-3xl font-bold mb-6 text-foreground">Chat Assistant</h1>
      </div>

      <Card className="flex-1 flex flex-col overflow-hidden border-border">
        <CardHeader className="flex-none border-b border-border">
          <CardTitle className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5 text-gray-700" />
            <span className="text-lg font-medium text-foreground">Conversation</span>
          </CardTitle>
        </CardHeader>

        <CardContent className="flex-1 overflow-y-auto p-4 space-y-4">
          {isLoadingHistory ? (
            <div className="flex justify-center items-center h-full">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground/60" />
            </div>
          ) : (
            <>
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
            </>
          )}
          <div ref={messagesEndRef} />
        </CardContent>

        <div className="border-t border-border p-4 flex-none">
          <div className="flex gap-2">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && handleSendMessage()}
              placeholder="Type your message..."
              className="flex-1 rounded-md border border-border/80 px-3 py-2 text-sm bg-background focus:border-black focus:outline-none focus:ring-1 focus:ring-black"
              disabled={isChatLoading}
            />
            <Button
              onClick={handleSendMessage}
              disabled={!input.trim() || isChatLoading}
              className="bg-black text-white hover:bg-background hover:text-black hover:border-black border border-transparent transition-colors"
            >
              {isChatLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
              <span className="sr-only">Send</span>
            </Button>
          </div>
        </div>
      </Card>
    </div>
  )
}
