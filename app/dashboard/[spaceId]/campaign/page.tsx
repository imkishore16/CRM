"use client"

import { useState, use, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { useToast } from "@/components/ui/use-toast"
import { Loader2, PlayCircle, MessageSquare, X, Send, ChevronRight, ChevronLeft, GripVertical } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { cn } from "@/lib/utils"
import { addConversation, fetchConversationHistory, fetchModelProvider } from "@/app/actions/prisma"
import { getCustomInitialMessage, fetchCustomerData } from "@/app/actions/pc"

interface CampaignPageProps {
  params: Promise<{ spaceId: string }>
}

interface Message {
  id: number
  content: string
  sender: "USER" | "BOT"
  timestamp?: Date
  context?: {
    type: "CONFIRMATION" | "SCHEDULING" | "RESCHEDULING" | "CANCELLATION" | "GENERAL"
    data?: {
      date?: string
      time?: string
      eventId?: string
      action?: string
    }
  }
}

// Add ResizablePanel type
interface ResizablePanelProps {
  children: React.ReactNode;
  defaultWidth: number;
  minWidth: number;
  maxWidth: number;
}

// Add ResizablePanel component
function ResizablePanel({ children, defaultWidth, minWidth, maxWidth }: ResizablePanelProps) {
  const [width, setWidth] = useState(defaultWidth);
  const [isDragging, setIsDragging] = useState(false);
  const dragRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isDragging) return;
      
      const newWidth = window.innerWidth - e.clientX;
      setWidth(Math.min(Math.max(newWidth, minWidth), maxWidth));
    };

    const handleMouseUp = () => {
      setIsDragging(false);
    };

    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, minWidth, maxWidth]);

  return (
    <div style={{ width }} className="relative">
      <div
        ref={dragRef}
        className="absolute left-0 top-0 h-full w-1 cursor-ew-resize group"
        onMouseDown={() => setIsDragging(true)}
      >
        <div className="absolute left-0 top-1/2 -translate-x-full -translate-y-1/2 p-2 opacity-0 group-hover:opacity-100 transition-opacity">
          <GripVertical className="h-4 w-4 text-muted-foreground" />
        </div>
      </div>
      {children}
    </div>
  );
}

// Add AutoResizeTextarea component
function AutoResizeTextarea({ 
  value, 
  onChange, 
  onKeyDown,
  placeholder,
  disabled
}: { 
  value: string;
  onChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
  onKeyDown: (e: React.KeyboardEvent<HTMLTextAreaElement>) => void;
  placeholder?: string;
  disabled?: boolean;
}) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = Math.min(textareaRef.current.scrollHeight, 150) + 'px';
    }
  }, [value]);

  return (
    <textarea
      ref={textareaRef}
      value={value}
      onChange={onChange}
      onKeyDown={onKeyDown}
      placeholder={placeholder}
      disabled={disabled}
      rows={1}
      className="flex-1 rounded-md border border-border/80 px-3 py-2 text-sm bg-background focus:border-black focus:outline-none focus:ring-1 focus:ring-black resize-none min-h-[40px] max-h-[150px]"
    />
  );
}

// Add formatTime helper function
function formatTime(date: Date) {
  return new Intl.DateTimeFormat('en-US', {
    hour: 'numeric',
    minute: 'numeric',
    hour12: true
  }).format(date);
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
  const [lastContext, setLastContext] = useState<Message["context"] | undefined>(undefined);

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

  // Helper function to detect affirmative/negative responses
  const isAffirmativeResponse = (text: string): boolean => {
    const affirmativeWords = [
      'yes', 'yeah', 'yep', 'sure', 'ok', 'okay', 'alright', 'fine',
      'good', 'great', 'perfect', 'cool', 'definitely', 'absolutely',
      'confirmed', 'correct', 'right', 'sounds good', 'that works'
    ];
    return affirmativeWords.some(word => 
      text.toLowerCase().includes(word.toLowerCase())
    );
  };

  const isNegativeResponse = (text: string): boolean => {
    const negativeWords = [
      'no', 'nope', 'nah', 'not', 'dont', "don't", 'cancel',
      'wrong', 'incorrect', 'reschedule', 'change', 'different'
    ];
    return negativeWords.some(word => 
      text.toLowerCase().includes(word.toLowerCase())
    );
  };

  const handleSendMessage = async () => {
    if (!input.trim()) return;

    const userMessage: Message = {
      id: messages.length + 1,
      content: input,
      sender: "USER",
      timestamp: new Date(),
    };
    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsChatLoading(true);

    // Scroll to bottom
    setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, 100);

    try {
      // If the user's message is short and we have context, include it in the API call
      const contextualInput = input.split(' ').length <= 3 && lastContext 
        ? {
            query: input,
            mobileNumber: spaceId,
            context: lastContext
          }
        : {
            query: input,
            mobileNumber: spaceId
          };

      const response = await fetch(`/api/sampleChat/?spaceId=${spaceId}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(contextualInput)
      });

      if (response.ok) {
        const data = await response.json();
        if (data.message && data.message.length > 0) {
          const botMessage: Message = {
            id: messages.length + 2,
            content: data.message,
            sender: "BOT",
            timestamp: new Date(),
            context: data.context // Store the new context from the response
          };
          setMessages((prev) => [...prev, botMessage]);
          setLastContext(data.context); // Update the last context
        }
      } else {
        const error = await response.json();
        throw new Error(error.message || "Failed to send message");
      }
    } catch (error) {
      console.error("Error in chat:", error);
      toast({
        title: "Chat Error",
        description: "Failed to get a response. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsChatLoading(false);

      // Scroll to bottom again after response
      setTimeout(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
      }, 100);
    }
  };

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
      {chatExpanded && (
        <ResizablePanel defaultWidth={400} minWidth={300} maxWidth={800}>
          <div className="fixed top-16 bottom-0 right-0 bg-background border-l border-border flex flex-col h-[calc(100vh-4rem)] ml-[240px]">
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
            <div className="flex-1 overflow-y-auto p-4 space-y-2 bg-[#efeae2] dark:bg-gray-900">
              {messages.map((message, index) => {
                const isFirstInGroup = index === 0 || messages[index - 1].sender !== message.sender;
                const isLastInGroup = index === messages.length - 1 || messages[index + 1].sender !== message.sender;
                
                return (
                  <div
                    key={message.id}
                    className={cn(
                      "flex",
                      message.sender === "USER" ? "justify-end" : "justify-start",
                      !isLastInGroup && "mb-1"
                    )}
                  >
                    <div
                      className={cn(
                        "max-w-[45%] relative group",
                        message.sender === "USER" ? "items-end" : "items-start"
                      )}
                    >
                      <div
                        className={cn(
                          "relative px-3 py-2 rounded-lg break-words",
                          message.sender === "USER" 
                            ? "bg-[#d9fdd3] dark:bg-green-700 ml-8 rounded-tr-none"
                            : "bg-white dark:bg-gray-800 mr-8 rounded-tl-none",
                          !isLastInGroup && (message.sender === "USER" ? "rounded-br-lg" : "rounded-bl-lg")
                        )}
                      >
                        {/* Message content */}
                        <div className="relative whitespace-pre-wrap text-[15px] leading-[20px]">
                          {message.content}
                          {/* Timestamp */}
                          <div 
                            className={cn(
                              "text-[11px] text-gray-500 dark:text-gray-400 leading-none mt-1 ml-1 inline-block float-right pl-2 min-w-[65px]",
                              message.sender === "USER" ? "text-[#667781]" : "text-[#667781]"
                            )}
                          >
                            {message.timestamp ? formatTime(message.timestamp) : ''}
                          </div>
                        </div>
                        {/* Message tail */}
                        <div
                          className={cn(
                            "absolute top-0 w-2 h-2 overflow-hidden",
                            message.sender === "USER" 
                              ? "right-[-6px] [mask-image:url('data:image/svg+xml;base64,PD94bWwgdmVyc2lvbj0iMS4wIiBlbmNvZGluZz0iVVRGLTgiPz4KPHN2ZyB3aWR0aD0iOHB4IiBoZWlnaHQ9IjEzcHgiIHZpZXdCb3g9IjAgMCA4IDEzIiB2ZXJzaW9uPSIxLjEiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyIgeG1sbnM6eGxpbms9Imh0dHA6Ly93d3cudzMub3JnLzE5OTkveGxpbmsiPgogICAgPCEtLSBHZW5lcmF0b3I6IFNrZXRjaCA0MC4zICgzMzgzOSkgLSBodHRwOi8vd3d3LmJvaGVtaWFuY29kaW5nLmNvbS9za2V0Y2ggLS0+CiAgICA8dGl0bGU+dGFpbC1yaWdodDwvdGl0bGU+CiAgICA8ZGVzYz5DcmVhdGVkIHdpdGggU2tldGNoLjwvZGVzYz4KICAgIDxkZWZzPjwvZGVmcz4KICAgIDxnIGlkPSJQYWdlLTEiIHN0cm9rZT0ibm9uZSIgc3Ryb2tlLXdpZHRoPSIxIiBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPgogICAgICAgIDxnIGlkPSJ0YWlsLXJpZ2h0IiBmaWxsPSIjZDlmZGQzIj4KICAgICAgICAgICAgPHBhdGggZD0iTTAsMS45OTk5OTk5NiBDMCwxLjk5OTk5OTk2IDIsMS45OTk5OTk5NiAzLjUsMy40OTk5OTk5NiBDNSw0Ljk5OTk5OTk2IDYsMTAgNiwxMCBDNiwxMCA2LDQuOTk5OTk5OTYgNy41LDMuNDk5OTk5OTYgQzksMi4wMDAwMDAwNiAxMCwyLjAwMDAwMDA2IDEwLDIuMDAwMDAwMDYgTDEwLDAgTDAsMCBMMCwxLjk5OTk5OTk2IFoiIGlkPSJQYXRoLTExNyIgdHJhbnNmb3JtPSJ0cmFuc2xhdGUoNS4wMDAwMDAsIDUuMDAwMDAwKSByb3RhdGUoLTkwLjAwMDAwMCkgdHJhbnNsYXRlKC01LjAwMDAwMCwgLTUuMDAwMDAwKSAiPjwvcGF0aD4KICAgICAgICA8L2c+CiAgICA8L2c+Cjwvc3ZnPg==')]"
                              : "left-[-6px] [mask-image:url('data:image/svg+xml;base64,PD94bWwgdmVyc2lvbj0iMS4wIiBlbmNvZGluZz0iVVRGLTgiPz4KPHN2ZyB3aWR0aD0iOHB4IiBoZWlnaHQ9IjEzcHgiIHZpZXdCb3g9IjAgMCA4IDEzIiB2ZXJzaW9uPSIxLjEiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyIgeG1sbnM6eGxpbms9Imh0dHA6Ly93d3cudzMub3JnLzE5OTkveGxpbmsiPgogICAgPCEtLSBHZW5lcmF0b3I6IFNrZXRjaCA0MC4zICgzMzgzOSkgLSBodHRwOi8vd3d3LmJvaGVtaWFuY29kaW5nLmNvbS9za2V0Y2ggLS0+CiAgICA8dGl0bGU+dGFpbC1sZWZ0PC90aXRsZT4KICAgIDxkZXNjPkNyZWF0ZWQgd2l0aCBTa2V0Y2guPC9kZXNjPgogICAgPGRlZnM+PC9kZWZzPgogICAgPGcgaWQ9IlBhZ2UtMSIgc3Ryb2tlPSJub25lIiBzdHJva2Utd2lkdGg9IjEiIGZpbGw9Im5vbmUiIGZpbGwtcnVsZT0iZXZlbm9kZCI+CiAgICAgICAgPGcgaWQ9InRhaWwtbGVmdCIgZmlsbD0iI2ZmZmZmZiI+CiAgICAgICAgICAgIDxwYXRoIGQ9Ik0wLDEuOTk5OTk5OTYgQzAsMS45OTk5OTk5NiAyLDEuOTk5OTk5OTYgMy41LDMuNDk5OTk5OTYgQzUsNC45OTk5OTk5NiA2LDEwIDYsMTAgQzYsMTAgNiw0Ljk5OTk5OTk2IDcuNSwzLjQ5OTk5OTk2IEM5LDIuMDAwMDAwMDYgMTAsMi4wMDAwMDAwNiAxMCwyLjAwMDAwMDA2IEwxMCwwIEwwLDAgTDAsMS45OTk5OTk5NiBaIiBpZD0iUGF0aC0xMTciIHRyYW5zZm9ybT0idHJhbnNsYXRlKDUuMDAwMDAwLCA1LjAwMDAwMCkgc2NhbGUoLTEsIDEpIHJvdGF0ZSgtOTAuMDAwMDAwKSB0cmFuc2xhdGUoLTUuMDAwMDAwLCAtNS4wMDAwMDApICI+PC9wYXRoPgogICAgICAgIDwvZz4KICAgIDwvZz4KPC9zdmc+')]"
                          )}
                        >
                          <div 
                            className={cn(
                              "w-full h-full",
                              message.sender === "USER" 
                                ? "bg-[#d9fdd3] dark:bg-green-700" 
                                : "bg-white dark:bg-gray-800"
                            )}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}

              {isChatLoading && (
                <div className="flex justify-start">
                  <div className="bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-200 p-3 rounded-lg max-w-[45%] relative rounded-tl-none">
                    <div className="flex space-x-2">
                      <div className="h-2 w-2 rounded-full bg-gray-400 animate-bounce [animation-delay:-0.3s]"></div>
                      <div className="h-2 w-2 rounded-full bg-gray-400 animate-bounce [animation-delay:-0.15s]"></div>
                      <div className="h-2 w-2 rounded-full bg-gray-400 animate-bounce"></div>
                    </div>
                    <div className="absolute left-[-6px] top-0 w-2 h-2 overflow-hidden [mask-image:url('data:image/svg+xml;base64,PD94bWwgdmVyc2lvbj0iMS4wIiBlbmNvZGluZz0iVVRGLTgiPz4KPHN2ZyB3aWR0aD0iOHB4IiBoZWlnaHQ9IjEzcHgiIHZpZXdCb3g9IjAgMCA4IDEzIiB2ZXJzaW9uPSIxLjEiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyIgeG1sbnM6eGxpbms9Imh0dHA6Ly93d3cudzMub3JnLzE5OTkveGxpbmsiPgogICAgPCEtLSBHZW5lcmF0b3I6IFNrZXRjaCA0MC4zICgzMzgzOSkgLSBodHRwOi8vd3d3LmJvaGVtaWFuY29kaW5nLmNvbS9za2V0Y2ggLS0+CiAgICA8dGl0bGU+dGFpbC1sZWZ0PC90aXRsZT4KICAgIDxkZXNjPkNyZWF0ZWQgd2l0aCBTa2V0Y2guPC9kZXNjPgogICAgPGRlZnM+PC9kZWZzPgogICAgPGcgaWQ9IlBhZ2UtMSIgc3Ryb2tlPSJub25lIiBzdHJva2Utd2lkdGg9IjEiIGZpbGw9Im5vbmUiIGZpbGwtcnVsZT0iZXZlbm9kZCI+CiAgICAgICAgPGcgaWQ9InRhaWwtbGVmdCIgZmlsbD0iI2ZmZmZmZiI+CiAgICAgICAgICAgIDxwYXRoIGQ9Ik0wLDEuOTk5OTk5OTYgQzAsMS45OTk5OTk5NiAyLDEuOTk5OTk5OTYgMy41LDMuNDk5OTk5OTYgQzUsNC45OTk5OTk5NiA2LDEwIDYsMTAgQzYsMTAgNiw0Ljk5OTk5OTk2IDcuNSwzLjQ5OTk5OTk2IEM5LDIuMDAwMDAwMDYgMTAsMi4wMDAwMDAwNiAxMCwyLjAwMDAwMDA2IEwxMCwwIEwwLDAgTDAsMS45OTk5OTk5NiBaIiBpZD0iUGF0aC0xMTciIHRyYW5zZm9ybT0idHJhbnNsYXRlKDUuMDAwMDAwLCA1LjAwMDAwMCkgc2NhbGUoLTEsIDEpIHJvdGF0ZSgtOTAuMDAwMDAwKSB0cmFuc2xhdGUoLTUuMDAwMDAwLCAtNS4wMDAwMDApICI+PC9wYXRoPgogICAgICAgIDwvZz4KICAgIDwvZz4KPC9zdmc+')]">
                      <div className="w-full h-full bg-white dark:bg-gray-800" />
                    </div>
                  </div>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>

            {/* Chat input */}
            <div className="border-t border-border/50 bg-background p-4">
              <div className="flex gap-2">
                <AutoResizeTextarea
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      handleSendMessage();
                    }
                  }}
                  placeholder="Type a message"
                  disabled={isChatLoading}
                />
                <Button
                  onClick={handleSendMessage}
                  disabled={!input.trim() || isChatLoading}
                  className="bg-black text-white hover:bg-background hover:text-black hover:border-black border border-transparent transition-colors self-end h-10 px-4"
                >
                  <Send className="h-4 w-4" />
                  <span className="sr-only">Send</span>
                </Button>
              </div>
            </div>
          </div>
        </ResizablePanel>
      )}

      {!chatExpanded && (
        <button
          onClick={() => setChatExpanded(true)}
          className="fixed top-20 right-0 bg-black text-white p-2 rounded-l-md hover:bg-gray-800 ml-[240px]"
        >
          <MessageSquare className="h-5 w-5" />
        </button>
      )}
    </div>
  )
}

