import { use } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { BarChart, Users, ArrowUpRight, MessageSquare, FileText, ArrowRight, Upload, Send } from "lucide-react"
import { Button } from "@/components/ui/button"
import Link from "next/link"

interface DashboardProps {
  params: Promise<{ spaceId: string }>
}

export default function Dashboard({ params }: DashboardProps) {
  const unwrappedParams = use(params)
  const { spaceId } = unwrappedParams

  return (
    <div className="p-6 md:p-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-foreground md:text-3xl">Dashboard</h1>
        <p className="text-muted-foreground">Welcome to your space overview</p>
      </div>

      {/* Stats cards */}
      <div className="mb-8 grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
        <Card className="border-border">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Users</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">1,234</div>
            <div className="flex items-center text-xs text-green-600">
              <ArrowUpRight className="mr-1 h-3 w-3" />
              <span>12% from last month</span>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Conversations</CardTitle>
            <MessageSquare className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">854</div>
            <div className="flex items-center text-xs text-green-600">
              <ArrowUpRight className="mr-1 h-3 w-3" />
              <span>18% from last month</span>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Documents</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">32</div>
            <div className="flex items-center text-xs text-green-600">
              <ArrowUpRight className="mr-1 h-3 w-3" />
              <span>4% from last month</span>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Engagement</CardTitle>
            <BarChart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">76%</div>
            <div className="flex items-center text-xs text-green-600">
              <ArrowUpRight className="mr-1 h-3 w-3" />
              <span>7% from last month</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick actions */}
      <div className="mb-8">
        <h2 className="text-lg font-semibold text-foreground mb-4">Quick Actions</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="border-border hover:border-border/80 hover:shadow-sm transition-all">
            <CardContent className="p-0">
              <Link href={`/dashboard/${spaceId}/upload`} className="block p-4">
                <div className="flex items-center gap-4">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-muted">
                    <Upload className="h-5 w-5 text-muted-foreground" />
                  </div>
                  <div>
                    <h3 className="font-medium text-foreground">Upload Data</h3>
                    <p className="text-sm text-muted-foreground">Add new content to your space</p>
                  </div>
                </div>
              </Link>
            </CardContent>
          </Card>

          <Card className="border-border hover:border-border/80 hover:shadow-sm transition-all">
            <CardContent className="p-0">
              <Link href={`/dashboard/${spaceId}/campaign`} className="block p-4">
                <div className="flex items-center gap-4">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-muted">
                    <Send className="h-5 w-5 text-muted-foreground" />
                  </div>
                  <div>
                    <h3 className="font-medium text-foreground">Start Campaign</h3>
                    <p className="text-sm text-muted-foreground">Launch your outreach campaign</p>
                  </div>
                </div>
              </Link>
            </CardContent>
          </Card>

          <Card className="border-border hover:border-border/80 hover:shadow-sm transition-all">
            <CardContent className="p-0">
              <Link href={`/dashboard/${spaceId}/chat`} className="block p-4">
                <div className="flex items-center gap-4">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-muted">
                    <MessageSquare className="h-5 w-5 text-muted-foreground" />
                  </div>
                  <div>
                    <h3 className="font-medium text-foreground">Chat</h3>
                    <p className="text-sm text-muted-foreground">Interact with your AI assistant</p>
                  </div>
                </div>
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Main content */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Activity chart */}
        <Card className="col-span-2 border-border">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-lg font-semibold text-foreground">Activity Overview</CardTitle>
            <Button
              variant="outline"
              size="sm"
              className="h-8 text-xs border-border text-gray-700 hover:bg-muted hover:text-foreground"
            >
              View Details
            </Button>
          </CardHeader>
          <CardContent>
            <div className="h-[300px] rounded-lg bg-muted flex items-center justify-center">
              <p className="text-muted-foreground">Activity chart will appear here</p>
            </div>
          </CardContent>
        </Card>

        {/* Recent activity */}
        <Card className="border-border">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-lg font-semibold text-foreground">Recent Activity</CardTitle>
            <Button variant="ghost" size="sm" className="h-8 text-xs text-gray-700 hover:text-foreground">
              View all
              <ArrowRight className="ml-1 h-3 w-3" />
            </Button>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="flex items-start gap-4 border-b border-border pb-4 last:border-0">
                  <div className="h-8 w-8 rounded-full bg-muted"></div>
                  <div>
                    <p className="text-sm font-medium text-foreground">User uploaded a new document</p>
                    <p className="text-xs text-muted-foreground">2 hours ago</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

