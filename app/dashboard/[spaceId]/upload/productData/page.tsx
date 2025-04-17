"use client"

import type React from "react"
import { useState, use, useRef } from "react"
import { Button } from "@/components/ui/button"
import { useToast } from "@/components/ui/use-toast"
import { Upload, X, FileText, AlertCircle, Loader2 } from "lucide-react"
import { cn } from "@/lib/utils"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

interface ProductDataProps {
  params: Promise<{ spaceId: string }>
}

export default function ProductDataPage({ params }: ProductDataProps) {
  const unwrappedParams = use(params)
  const { spaceId } = unwrappedParams
  const { toast } = useToast()
  const [files, setFiles] = useState<File[]>([])
  const [isDragging, setIsDragging] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = e.target.files
    if (selectedFiles && selectedFiles.length > 0) {
      const newFiles = Array.from(selectedFiles)
      setFiles((prev) => [...prev, ...newFiles])
    }

    // Reset input value to allow selecting the same file again
    if (fileInputRef.current) {
      fileInputRef.current.value = ""
    }
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }

  const handleDragLeave = () => {
    setIsDragging(false)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)

    const droppedFiles = e.dataTransfer.files
    if (droppedFiles && droppedFiles.length > 0) {
      const newFiles = Array.from(droppedFiles)
      setFiles((prev) => [...prev, ...newFiles])
    }
  }

  const removeFile = (index: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== index))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (files.length === 0) {
      toast({
        title: "Error",
        description: "Please upload at least one file",
        variant: "destructive",
      })
      return
    }

    setIsSubmitting(true)

    try {
      const formData = new FormData()

      files.forEach((file) => {
        formData.append("files", file)
      })

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_NEXTAUTH_URL}/api/embed?spaceId=${spaceId}&namespace=productData`,
        {
          method: "POST",
          body: formData,
        },
      )

      if (response.ok) {
        toast({
          title: "Success",
          description: `${files.length} file(s) uploaded successfully`,
        })

        // Reset files
        setFiles([])
      } else {
        throw new Error("Failed to upload product data")
      }
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to upload product data",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="container py-10 px-6 md:px-8 lg:px-10 max-w-5xl mx-auto">
      <h1 className="text-2xl font-bold mb-3 text-gray-900">Product Data Upload</h1>
      <p className="text-gray-600 mb-8">Upload product information files for your campaign.</p>

      <Alert className="mb-8 border-gray-200 bg-gray-50">
        <AlertCircle className="h-4 w-4 text-gray-700" />
        <AlertTitle className="text-gray-900">Important</AlertTitle>
        <AlertDescription className="text-gray-700">
          Upload product information files such as catalogs, specifications, pricing, and feature documents.
        </AlertDescription>
      </Alert>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="md:col-span-2">
          <Card className="border-gray-200">
            <CardHeader className="px-6 py-5">
              <CardTitle className="text-xl font-semibold text-gray-900">Upload Files</CardTitle>
            </CardHeader>
            <CardContent className="px-6 py-5">
              <form onSubmit={handleSubmit} className="space-y-6">
                <div
                  className={cn(
                    "border-2 border-dashed rounded-lg p-10 transition-colors",
                    isDragging ? "border-black bg-gray-50" : "border-gray-200",
                    "cursor-pointer",
                  )}
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                  onClick={() => fileInputRef.current?.click()}
                >
                  <input
                    ref={fileInputRef}
                    id="product-files"
                    type="file"
                    multiple
                    onChange={handleFileChange}
                    className="hidden"
                  />

                  <div className="flex flex-col items-center justify-center py-6">
                    <Upload className="h-14 w-14 text-gray-400 mb-5" />
                    <h3 className="text-lg font-medium mb-2 text-gray-900">Upload Product Data Files</h3>
                    <p className="text-sm text-gray-500 text-center mb-3">
                      Drag and drop your files here or click to browse
                    </p>
                    <p className="text-xs text-gray-400">Accepted file types: PDF, CSV, Excel, Images, Text</p>
                  </div>
                </div>

                <div className="pt-4">
                  <Button
                    type="submit"
                    className="w-full bg-black text-white hover:bg-white hover:text-black hover:border-black border border-transparent transition-colors py-6"
                    disabled={isSubmitting || files.length === 0}
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Uploading...
                      </>
                    ) : (
                      `Upload ${files.length} File(s)`
                    )}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>

        <div className="md:col-span-1">
          <Card className="border-gray-200">
            <CardHeader className="px-6 py-5">
              <CardTitle className="text-lg font-semibold text-gray-900">Selected Files ({files.length})</CardTitle>
            </CardHeader>
            <CardContent className="px-6 py-5">
              {files.length > 0 ? (
                <ul className="space-y-3 max-h-[400px] overflow-y-auto">
                  {files.map((file, index) => (
                    <li key={index} className="flex items-center justify-between bg-gray-50 p-3 rounded">
                      <div className="flex items-center space-x-2 truncate">
                        <FileText className="h-5 w-5 text-gray-600 shrink-0" />
                        <div className="truncate">
                          <p className="text-sm font-medium truncate text-gray-900">{file.name}</p>
                          <p className="text-xs text-gray-500">{(file.size / 1024).toFixed(2)} KB</p>
                        </div>
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => removeFile(index)}
                        className="shrink-0 h-8 w-8 p-0 text-gray-500 hover:text-red-500 hover:bg-gray-100"
                      >
                        <X className="h-4 w-4" />
                        <span className="sr-only">Remove</span>
                      </Button>
                    </li>
                  ))}
                </ul>
              ) : (
                <div className="text-center py-10 text-gray-500 bg-gray-50 rounded-md">
                  <p>No files selected</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
