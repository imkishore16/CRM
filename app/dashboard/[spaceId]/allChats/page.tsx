"use client"

import { useState, useEffect, useRef } from "react"
import { useParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useToast } from "@/components/ui/use-toast"
import { Search, MessageSquare, User, Bot, Send, Loader2, Calendar, Clock } from "lucide-react"
import { format } from "date-fns"
import { cn } from "@/lib/utils"

interface Conversation {
  id: number
  spaceId: number
  mobileNumber: string
  llm: string
  user: string
  createdAt: string
  messages?: Message[]
}

interface Message {
  id: number
  content: string
  sender: "user" | "bot"
  timestamp: string
}

export default function AllChatsPage() {
  const params = useParams()
  const spaceId = params.spaceId
  const { toast } = useToast()

  const [conversations, setConversations] = useState<Conversation[]>([])
  const [filteredConversations, setFilteredConversations] = useState<Conversation[]>([])
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null)
  const [searchQuery, setSearchQuery] = useState("")
  const [isLoading, setIsLoading] = useState(true)
  const [newMessage, setNewMessage] = useState("")
  const [isSending, setIsSending] = useState(false)

  const messagesEndRef = useRef<HTMLDivElement>(null)

  // Fetch conversations
  useEffect(() => {
    const fetchConversations = async () => {
      setIsLoading(true)
      try {
        // This would be your actual API endpoint
        const response = await fetch(`/api/conversations?spaceId=${spaceId}`)

        if (!response.ok) {
          throw new Error("Failed to fetch conversations")
        }

        // For demo purposes, creating mock data
        // In production, you would use: const data = await response.json()
        const mockData = generateMockConversations(spaceId as string)
        setConversations(mockData)
        setFilteredConversations(mockData)

        // Select the first conversation by default if available
        if (mockData.length > 0) {
          setSelectedConversation(mockData[0])
        }
      } catch (error) {
        console.error("Error fetching conversations:", error)
        toast({
          title: "Error",
          description: "Failed to load conversations. Please try again.",
          variant: "destructive",
        })
      } finally {
        setIsLoading(false)
      }
    }

    fetchConversations()
  }, [spaceId, toast])

  // Filter conversations based on search query
  useEffect(() => {
    if (!searchQuery.trim()) {
      setFilteredConversations(conversations)
      return
    }

    const filtered = conversations.filter(
      (conv) =>
        conv.mobileNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
        conv.user.toLowerCase().includes(searchQuery.toLowerCase()),
    )

    setFilteredConversations(filtered)
  }, [searchQuery, conversations])

  // Scroll to bottom of messages when conversation changes or new message is added
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [selectedConversation])

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !selectedConversation) return

    setIsSending(true)

    try {
      // In a real app, you would send this to your API
      // const response = await fetch(`/api/conversations/${selectedConversation.id}/messages`, {
      //   method: "POST",
      //   headers: { "Content-Type": "application/json" },
      //   body: JSON.stringify({ content: newMessage }),
      // })

      // For demo purposes, we'll just update the state locally
      const userMessage: Message = {
        id: Date.now(),
        content: newMessage,
        sender: "user",
        timestamp: new Date().toISOString(),
      }

      // Add user message
      const updatedConversation = {
        ...selectedConversation,
        messages: [...(selectedConversation.messages || []), userMessage],
      }

      setSelectedConversation(updatedConversation)
      setNewMessage("")

      // Simulate bot response after a delay
      setTimeout(() => {
        const botMessage: Message = {
          id: Date.now() + 1,
          content: `This is an automated response to: "${newMessage}"`,
          sender: "bot",
          timestamp: new Date().toISOString(),
        }

        const finalConversation = {
          ...updatedConversation,
          messages: [...(updatedConversation.messages || []), botMessage],
        }

        setSelectedConversation(finalConversation)

        // Update the conversation in the list
        setConversations(conversations.map((conv) => (conv.id === selectedConversation.id ? finalConversation : conv)))

        setFilteredConversations(
          filteredConversations.map((conv) => (conv.id === selectedConversation.id ? finalConversation : conv)),
        )

        // Scroll to bottom
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
      }, 1000)
    } catch (error) {
      console.error("Error sending message:", error)
      toast({
        title: "Error",
        description: "Failed to send message. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsSending(false)
    }
  }

  // Helper function to generate mock data for demo purposes
  const generateMockConversations = (spaceId: string): Conversation[] => {
    return Array.from({ length: 10 }, (_, i) => ({
      id: i + 1,
      spaceId: Number.parseInt(spaceId as string),
      mobileNumber: `+1${Math.floor(1000000000 + Math.random() * 9000000000)}`,
      llm: ["openai", "gemini", "huggingface"][Math.floor(Math.random() * 3)],
      user: `User ${i + 1}`,
      createdAt: new Date(Date.now() - Math.random() * 10 * 24 * 60 * 60 * 1000).toISOString(),
      messages: Array.from({ length: Math.floor(Math.random() * 10) + 3 }, (_, j) => ({
        id: j + 1,
        content:
          j % 2 === 0
            ? `This is a user message ${j + 1}. How can you help me today?`
            : `This is a bot response ${j + 1}. I'm here to assist you with your questions.`,
        sender: j % 2 === 0 ? "user" : "bot",
        timestamp: new Date(Date.now() - (10 - j) * 60000).toISOString(),
      })),
    }))
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return format(date, "MMM d, yyyy")
  }

  const formatTime = (dateString: string) => {
    const date = new Date(dateString)
    return format(date, "h:mm a")
  }

  return (
    <div className="flex h-[calc(100vh-4rem)] md:h-screen">
      {/* Sidebar - Conversation List */}
      <div className="w-full max-w-xs border-r border-gray-200 bg-white flex flex-col">
        <div className="p-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Conversations</h2>
          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
            <Input
              type="text"
              placeholder="Search conversations..."
              className="pl-9 border-gray-200 focus:border-gray-300 focus:ring-gray-300"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto">
          {isLoading ? (
            <div className="flex justify-center items-center h-full">
              <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
            </div>
          ) : filteredConversations.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full p-4 text-center">
              <MessageSquare className="h-12 w-12 text-gray-300 mb-2" />
              <p className="text-gray-500">No conversations found</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {filteredConversations.map((conversation) => (
                <button
                  key={conversation.id}
                  className={cn(
                    "w-full text-left p-4 hover:bg-gray-50 transition-colors",
                    selectedConversation?.id === conversation.id ? "bg-gray-50" : "",
                  )}
                  onClick={() => setSelectedConversation(conversation)}
                >
                  <div className="flex justify-between items-start mb-1">
                    <span className="font-medium text-gray-900 truncate">{conversation.user}</span>
                    <span className="text-xs text-gray-500">{formatDate(conversation.createdAt)}</span>
                  </div>
                  <div className="flex items-center text-sm text-gray-500">
                    <span className="truncate">{conversation.mobileNumber}</span>
                  </div>
                  <div className="flex items-center mt-1">
                    <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-700">
                      {conversation.llm}
                    </span>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Main Content - Selected Conversation */}
      <div className="flex-1 flex flex-col bg-gray-50">
        {selectedConversation ? (
          <>
            {/* Conversation Header */}
            <div className="bg-white border-b border-gray-200 p-4">
              <div className="flex justify-between items-center">
                <div>
                  <h2 className="text-lg font-semibold text-gray-900">{selectedConversation.user}</h2>
                  <div className="flex items-center text-sm text-gray-500 gap-4">
                    <span>{selectedConversation.mobileNumber}</span>
                    <div className="flex items-center gap-1">
                      <Calendar className="h-3.5 w-3.5" />
                      <span>{formatDate(selectedConversation.createdAt)}</span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs px-2 py-1 rounded-full bg-gray-100 text-gray-700">
                    {selectedConversation.llm}
                  </span>
                </div>
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {selectedConversation.messages?.map((message) => (
                <div
                  key={message.id}
                  className={cn("flex", message.sender === "user" ? "justify-end" : "justify-start")}
                >
                  <div className="flex items-start gap-2 max-w-[80%]">
                    {message.sender === "bot" && (
                      <div className="flex h-8 w-8 shrink-0 select-none items-center justify-center rounded-full bg-gray-100">
                        <Bot className="h-4 w-4 text-gray-600" />
                      </div>
                    )}
                    <div>
                      <div
                        className={cn(
                          "rounded-lg p-3",
                          message.sender === "user"
                            ? "bg-black text-white"
                            : "bg-white border border-gray-200 text-gray-800",
                        )}
                      >
                        {message.content}
                      </div>
                      <div className="mt-1 text-xs text-gray-500 flex justify-end">
                        <Clock className="h-3 w-3 mr-1" />
                        {formatTime(message.timestamp)}
                      </div>
                    </div>
                    {message.sender === "user" && (
                      <div className="flex h-8 w-8 shrink-0 select-none items-center justify-center rounded-full bg-gray-100">
                        <User className="h-4 w-4 text-gray-600" />
                      </div>
                    )}
                  </div>
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>

            {/* Message Input */}
            <div className="border-t border-gray-200 bg-white p-4">
              <div className="flex gap-2">
                <Input
                  type="text"
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && !isSending && handleSendMessage()}
                  placeholder="Type your message..."
                  className="border-gray-200 focus:border-gray-300 focus:ring-gray-300"
                  disabled={isSending}
                />
                <Button
                  onClick={handleSendMessage}
                  disabled={isSending || !newMessage.trim()}
                  className="bg-black text-white hover:bg-white hover:text-black hover:border-black border border-transparent transition-colors"
                >
                  {isSending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                  <span className="sr-only">Send</span>
                </Button>
              </div>
            </div>
          </>
        ) : (
          <div className="flex flex-col items-center justify-center h-full p-4 text-center">
            <MessageSquare className="h-16 w-16 text-gray-300 mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No Conversation Selected</h3>
            <p className="text-gray-500 max-w-md">
              Select a conversation from the sidebar to view messages and interact with customers.
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
