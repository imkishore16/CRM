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
        <h1 className="text-2xl font-bold text-gray-900 md:text-3xl">Dashboard</h1>
        <p className="text-gray-600">Welcome to your space overview</p>
      </div>

      {/* Stats cards */}
      <div className="mb-8 grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
        <Card className="border-gray-200">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">Total Users</CardTitle>
            <Users className="h-4 w-4 text-gray-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">1,234</div>
            <div className="flex items-center text-xs text-green-600">
              <ArrowUpRight className="mr-1 h-3 w-3" />
              <span>12% from last month</span>
            </div>
          </CardContent>
        </Card>

        <Card className="border-gray-200">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">Conversations</CardTitle>
            <MessageSquare className="h-4 w-4 text-gray-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">854</div>
            <div className="flex items-center text-xs text-green-600">
              <ArrowUpRight className="mr-1 h-3 w-3" />
              <span>18% from last month</span>
            </div>
          </CardContent>
        </Card>

        <Card className="border-gray-200">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">Documents</CardTitle>
            <FileText className="h-4 w-4 text-gray-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">32</div>
            <div className="flex items-center text-xs text-green-600">
              <ArrowUpRight className="mr-1 h-3 w-3" />
              <span>4% from last month</span>
            </div>
          </CardContent>
        </Card>

        <Card className="border-gray-200">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">Engagement</CardTitle>
            <BarChart className="h-4 w-4 text-gray-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">76%</div>
            <div className="flex items-center text-xs text-green-600">
              <ArrowUpRight className="mr-1 h-3 w-3" />
              <span>7% from last month</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick actions */}
      <div className="mb-8">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="border-gray-200 hover:border-gray-300 hover:shadow-sm transition-all">
            <CardContent className="p-0">
              <Link href={`/dashboard/${spaceId}/upload`} className="block p-4">
                <div className="flex items-center gap-4">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gray-100">
                    <Upload className="h-5 w-5 text-gray-600" />
                  </div>
                  <div>
                    <h3 className="font-medium text-gray-900">Upload Data</h3>
                    <p className="text-sm text-gray-500">Add new content to your space</p>
                  </div>
                </div>
              </Link>
            </CardContent>
          </Card>

          <Card className="border-gray-200 hover:border-gray-300 hover:shadow-sm transition-all">
            <CardContent className="p-0">
              <Link href={`/dashboard/${spaceId}/campaign`} className="block p-4">
                <div className="flex items-center gap-4">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gray-100">
                    <Send className="h-5 w-5 text-gray-600" />
                  </div>
                  <div>
                    <h3 className="font-medium text-gray-900">Start Campaign</h3>
                    <p className="text-sm text-gray-500">Launch your outreach campaign</p>
                  </div>
                </div>
              </Link>
            </CardContent>
          </Card>

          <Card className="border-gray-200 hover:border-gray-300 hover:shadow-sm transition-all">
            <CardContent className="p-0">
              <Link href={`/dashboard/${spaceId}/chat`} className="block p-4">
                <div className="flex items-center gap-4">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gray-100">
                    <MessageSquare className="h-5 w-5 text-gray-600" />
                  </div>
                  <div>
                    <h3 className="font-medium text-gray-900">Chat</h3>
                    <p className="text-sm text-gray-500">Interact with your AI assistant</p>
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
        <Card className="col-span-2 border-gray-200">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-lg font-semibold text-gray-900">Activity Overview</CardTitle>
            <Button
              variant="outline"
              size="sm"
              className="h-8 text-xs border-gray-200 text-gray-700 hover:bg-gray-50 hover:text-gray-900"
            >
              View Details
            </Button>
          </CardHeader>
          <CardContent>
            <div className="h-[300px] rounded-lg bg-gray-50 flex items-center justify-center">
              <p className="text-gray-500">Activity chart will appear here</p>
            </div>
          </CardContent>
        </Card>

        {/* Recent activity */}
        <Card className="border-gray-200">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-lg font-semibold text-gray-900">Recent Activity</CardTitle>
            <Button variant="ghost" size="sm" className="h-8 text-xs text-gray-700 hover:text-gray-900">
              View all
              <ArrowRight className="ml-1 h-3 w-3" />
            </Button>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="flex items-start gap-4 border-b border-gray-100 pb-4 last:border-0">
                  <div className="h-8 w-8 rounded-full bg-gray-100"></div>
                  <div>
                    <p className="text-sm font-medium text-gray-900">User uploaded a new document</p>
                    <p className="text-xs text-gray-500">2 hours ago</p>
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

