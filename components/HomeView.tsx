"use client"

import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useEffect, useMemo, useState, useCallback } from "react"
import CardSkeleton from "./ui/cardSkeleton"
import SpacesCard from "./SpacesCard"
import { Plus, FolderPlus } from "lucide-react"

interface Space {
  id: number
  isActive: boolean
  name: string
}

export default function HomeView() {
  const [isCreateSpaceOpen, setIsCreateSpaceOpen] = useState(false)
  const [spaceName, setSpaceName] = useState("")
  const [spaces, setSpaces] = useState<Space[] | null>(null)
  const [loading, setIsLoading] = useState(false)

  useEffect(() => {
    const fetchSpaces = async () => {
      setIsLoading(true)
      try {
        const response = await fetch(`${process.env.NEXT_PUBLIC_NEXTAUTH_URL}/api/spaces`, {
          method: "GET",
        })

        const data = await response.json()

        if (!response.ok || !data.success) {
          throw new Error(data.message || "Failed to fetch spaces")
        }

        setSpaces(data.spaces)
      } catch (error) {
        toast.error("Error fetching spaces")
      } finally {
        setIsLoading(false)
      }
    }
    fetchSpaces()
  }, [])

  const handleCreateSpace = async () => {
    if (!spaceName.trim()) {
      toast.error("Please enter a space name")
      return
    }

    setIsCreateSpaceOpen(false)
    try {
      const response = await fetch(`/api/spaces/?spaceName=${encodeURIComponent(spaceName.trim())}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      })
      const data = await response.json()

      if (!response.ok || !data.success) {
        throw new Error(data.message || "Failed to create space")
      }

      setSpaces((prev) => (prev ? [...prev, data.space] : [data.space]))
      toast.success(data.message || "Space created successfully")
      setSpaceName("")
    } catch (error: any) {
      toast.error(error.message || "Error Creating Space")
    }
  }

  const handleDeleteSpace = useCallback(async (spaceId: number) => {
    try {
      const response = await fetch(`/api/spaces/?spaceId=${spaceId}`, {
        method: "DELETE",
      })
      const data = await response.json()

      if (!response.ok || !data.success) {
        throw new Error(data.message || "Failed to delete space")
      }

      setSpaces((prev) => prev?.filter((space) => space.id !== spaceId) || [])
      toast.success(data.message || "Space deleted successfully")
    } catch (error: any) {
      toast.error(error.message || "Error Deleting Space")
    }
  }, [])

  const renderSpaces = useMemo(() => {
    if (loading) {
      return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <CardSkeleton key={i} />
          ))}
        </div>
      )
    }

    if (!spaces || spaces.length === 0) {
      return (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <div className="rounded-full bg-gray-100 p-4 mb-4">
            <FolderPlus className="h-8 w-8 text-muted-foreground/60" />
          </div>
          <h3 className="text-lg font-medium text-foreground mb-2">No spaces found</h3>
          <p className="text-muted-foreground max-w-md mb-6">
            Create your first space to start organizing your data and configurations.
          </p>
          <Button onClick={() => setIsCreateSpaceOpen(true)} className="bg-black text-white hover:bg-gray-800">
            <Plus className="mr-2 h-4 w-4" />
            Create Your First Space
          </Button>
        </div>
      )
    }

    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {spaces.map((space) => (
          <SpacesCard key={space.id} space={space} handleDeleteSpace={handleDeleteSpace} />
        ))}
      </div>
    )
  }, [loading, spaces, handleDeleteSpace])

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-12">
        <div className="mb-8 flex flex-col md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground mb-2">Spaces</h1>
            <p className="text-muted-foreground">Manage your data and configurations in organized spaces.</p>
          </div>
          <Button
            onClick={() => setIsCreateSpaceOpen(true)}
            className="mt-4 md:mt-0 bg-black text-white hover:bg-gray-800"
          >
            <Plus className="mr-2 h-4 w-4" />
            Create New Space
          </Button>
        </div>

        {renderSpaces}
      </div>

      <Dialog open={isCreateSpaceOpen} onOpenChange={setIsCreateSpaceOpen}>
        <DialogContent className="bg-background">
          <DialogHeader>
            <DialogTitle className="text-xl font-semibold text-foreground">Create New Space</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="space-name" className="text-black">
                  Space Name
                </Label>
                <Input
                  id="space-name"
                  placeholder="Enter space name"
                  value={spaceName}
                  onChange={(e) => setSpaceName(e.target.value)}
                  className="border-border/80 bg-background focus:border-black"
                />
              </div>
            </div>
          </div>
          <DialogFooter className="flex flex-col sm:flex-row gap-3">
            <Button
              variant="outline"
              onClick={() => {
                setIsCreateSpaceOpen(false)
                setSpaceName("")
              }}
              className="w-full sm:w-auto border-border/80 text-white"
            >
              Cancel
            </Button>
            <Button
              onClick={handleCreateSpace}
              className="w-full sm:w-auto bg-black text-white hover:bg-gray-800"
              disabled={!spaceName.trim()}
            >
              Create Space
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

