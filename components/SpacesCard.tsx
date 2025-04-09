"use client"

import type React from "react"

import { Card, CardContent, CardFooter } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import Image from "next/image"
import { motion } from "framer-motion"
import { useRouter } from "next/navigation"
import { ArrowRight, Trash2, FolderOpen } from "lucide-react"
import { useState } from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"

interface SpaceCardProps {
  space: {
    id: number
    name: string
  }
  handleDeleteSpace: (id: number) => void
}

export default function SpacesCard({ space, handleDeleteSpace }: SpaceCardProps) {
  const router = useRouter()
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [spaceToDelete, setSpaceToDelete] = useState<number | null>(null)

  const handleDeleteClick = (e: React.MouseEvent) => {
    e.stopPropagation() // Prevent card click from triggering
    e.preventDefault() // Prevent default behavior
    setSpaceToDelete(space.id)
    setIsDialogOpen(true)
  }

  const confirmDelete = () => {
    if (spaceToDelete) {
      handleDeleteSpace(spaceToDelete)
      setSpaceToDelete(null)
      setIsDialogOpen(false)
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="p-4"
    >
      <Card className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm hover:shadow-md transition-shadow duration-300">
        <CardContent className="p-0">
          <div className="relative h-48 overflow-hidden">
            <Image
              src="https://images.unsplash.com/photo-1533174072545-7a4b6ad7a6c3?q=80&w=2940&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D"
              alt={`${space.name} space`}
              layout="fill"
              objectFit="cover"
              className="transition-transform duration-500 hover:scale-105"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />
          </div>

          <div className="p-5">
            <div className="flex items-center gap-3 mb-2">
              <div className="rounded-full bg-gray-100 p-2">
                <FolderOpen className="h-5 w-5 text-gray-700" />
              </div>
              <h2 className="text-xl font-bold text-gray-900 truncate">{space.name}</h2>
            </div>
            <p className="text-sm text-gray-600">Manage your data and configurations in this space.</p>
          </div>
        </CardContent>

        <CardFooter className="flex flex-col sm:flex-row gap-3 border-t border-gray-100 bg-gray-50 p-4">
          <Button
            className="w-full sm:flex-1 bg-black text-white hover:bg-white hover:text-black transition-colors"
            onClick={() => router.push(`/dashboard/${space.id}`)}
          >
            <ArrowRight className="mr-2 h-4 w-4" />
            View Space
          </Button>

          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button
                variant="outline"
                className="w-full sm:flex-1 bg-black text-white hover:bg-white hover:text-black transition-colors"
                onClick={handleDeleteClick}
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Delete
              </Button>
            </DialogTrigger>
            <DialogContent className="bg-white">
              <DialogHeader>
                <DialogTitle className="text-gray-900">Confirm Deletion</DialogTitle>
                <DialogDescription className="text-gray-600">
                  Are you sure you want to delete "{space.name}"? This action cannot be undone.
                </DialogDescription>
              </DialogHeader>
              <DialogFooter className="flex flex-col sm:flex-row gap-3 sm:gap-2">
                <Button
                  variant="outline"
                  onClick={() => setIsDialogOpen(false)}
                  className="w-full sm:w-auto border-gray-300 text-gray-700"
                >
                  Cancel
                </Button>
                <Button onClick={confirmDelete} className="w-full sm:w-auto bg-red-600 text-white hover:bg-red-700">
                  Delete
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </CardFooter>
      </Card>
    </motion.div>
  )
}

