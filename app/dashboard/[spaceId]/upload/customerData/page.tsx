// // "use client"

// import type React from "react"

// import { useState,use } from "react"
// import { Button } from "@/components/ui/button"
// import { useToast } from "@/components/ui/use-toast"
// import { Upload, X, FileText } from "lucide-react"
// import { cn } from "@/lib/utils"

// interface CustomerDataProps {
//   params: Promise<{ spaceId: string }>
// }

// export default function CustomerDataPage({ params }: CustomerDataProps) {
//   const unwrappedParams = use(params)
//   const { spaceId } = unwrappedParams
//   const { toast } = useToast()
//   const [files, setFiles] = useState<File[]>([])
//   const [isDragging, setIsDragging] = useState(false)
//   const [isSubmitting, setIsSubmitting] = useState(false)

//   const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
//     const selectedFiles = e.target.files
//     if (selectedFiles && selectedFiles.length > 0) {
//       const newFiles = Array.from(selectedFiles)
//       setFiles((prev) => [...prev, ...newFiles])
//     }

//     // Reset input value to allow selecting the same file again
//     e.target.value = ""
//   }

//   const handleDragOver = (e: React.DragEvent) => {
//     e.preventDefault()
//     setIsDragging(true)
//   }

//   const handleDragLeave = () => {
//     setIsDragging(false)
//   }

//   const handleDrop = (e: React.DragEvent) => {
//     e.preventDefault()
//     setIsDragging(false)

//     const droppedFiles = e.dataTransfer.files
//     if (droppedFiles && droppedFiles.length > 0) {
//       const newFiles = Array.from(droppedFiles)
//       setFiles((prev) => [...prev, ...newFiles])
//     }
//   }

//   const removeFile = (index: number) => {
//     setFiles((prev) => prev.filter((_, i) => i !== index))
//   }

//   const handleSubmit = async (e: React.FormEvent) => {
//     e.preventDefault()

//     if (files.length === 0) {
//       toast({
//         title: "Error",
//         description: "Please upload at least one file",
//         variant: "destructive",
//       })
//       return
//     }

//     setIsSubmitting(true)

//     try {
//       const formData = new FormData()

//       files.forEach((file) => {
//         formData.append('files', file)
//       })

//       const response = await fetch(`${process.env.NEXT_PUBLIC_NEXTAUTH_URL}/api/embed?spaceId=${spaceId}&namespace=customerData`, {
//         method: "POST",
//         body: formData,
//       })

//       if (response.ok) {
//         toast({
//           title: "Success",
//           description: `${files.length} file(s) uploaded successfully`,
//         })

//         // Reset files
//         setFiles([])
//       } else {
//         throw new Error("Failed to upload customer data")
//       }
//     } catch (error) {
//       toast({
//         title: "Error",
//         description: error instanceof Error ? error.message : "Failed to upload customer data",
//         variant: "destructive",
//       })
//     } finally {
//       setIsSubmitting(false)
//     }
//   }

//   return (
//     <div className="container max-w-4xl py-10">
//       <h1 className="text-2xl font-bold mb-6">Customer Data Upload</h1>

//       <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
//         <div className="md:col-span-2">
//           <form onSubmit={handleSubmit} className="space-y-6">
//             <div
//               className={cn(
//                 "border-2 border-dashed rounded-lg p-8 transition-colors",
//                 isDragging ? "border-primary bg-primary/5" : "border-gray-200",
//                 "cursor-pointer",
//               )}
//               onDragOver={handleDragOver}
//               onDragLeave={handleDragLeave}
//               onDrop={handleDrop}
//               onClick={() => document.getElementById("customer-files")?.click()}
//             >
//               <input id="customer-files" type="file" multiple onChange={handleFileChange} className="hidden" />

//               <div className="flex flex-col items-center justify-center py-4">
//                 <Upload className="h-12 w-12 text-gray-400 mb-4" />
//                 <h3 className="text-lg font-medium mb-1">Upload Customer Data Files</h3>
//                 <p className="text-sm text-gray-500 text-center mb-2">
//                   Drag and drop your files here or click to browse
//                 </p>
//                 <p className="text-xs text-gray-400">Accepted file types: CSV, Excel, PDF, Text</p>
//               </div>
//             </div>

//             <div className="pt-4">
//               <Button type="submit" className="w-full" disabled={isSubmitting || files.length === 0}>
//                 {isSubmitting ? "Uploading..." : `Upload ${files.length} File(s)`}
//               </Button>
//             </div>
//           </form>
//         </div>

//         <div className="md:col-span-1">
//           <div className="border rounded-lg p-4">
//             <h3 className="font-medium mb-4">Selected Files ({files.length})</h3>

//             {files.length > 0 ? (
//               <ul className="space-y-3 max-h-[400px] overflow-y-auto">
//                 {files.map((file, index) => (
//                   <li key={index} className="flex items-center justify-between bg-gray-50 p-2 rounded">
//                     <div className="flex items-center space-x-2 truncate">
//                       <FileText className="h-5 w-5 text-blue-500 shrink-0" />
//                       <div className="truncate">
//                         <p className="text-sm font-medium truncate">{file.name}</p>
//                         <p className="text-xs text-gray-500">{(file.size / 1024).toFixed(2)} KB</p>
//                       </div>
//                     </div>
//                     <Button
//                       type="button"
//                       variant="ghost"
//                       size="sm"
//                       onClick={() => removeFile(index)}
//                       className="shrink-0"
//                     >
//                       <X className="h-4 w-4" />
//                       <span className="sr-only">Remove</span>
//                     </Button>
//                   </li>
//                 ))}
//               </ul>
//             ) : (
//               <div className="text-center py-8 text-gray-500">
//                 <p>No files selected</p>
//               </div>
//             )}
//           </div>
//         </div>
//       </div>
//     </div>
//   )
// }

"use client"

import type React from "react"
import { useState, use, useRef } from "react"
import { Button } from "@/components/ui/button"
import { useToast } from "@/components/ui/use-toast"
import { Upload, X, FileText, Info, Loader2 } from "lucide-react"
import { cn } from "@/lib/utils"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"

interface CustomerDataProps {
  params: Promise<{ spaceId: string }>
}

export default function CustomerDataPage({ params }: CustomerDataProps) {
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
        `${process.env.NEXT_PUBLIC_NEXTAUTH_URL}/api/embed?spaceId=${spaceId}&namespace=customerData`,
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
        throw new Error("Failed to upload customer data")
      }
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to upload customer data",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="container py-10 px-6 md:px-8 lg:px-10 max-w-5xl mx-auto">
      <h1 className="text-2xl font-bold mb-3 text-gray-900">Customer Data Upload</h1>
      <p className="text-gray-600 mb-8">Upload customer information files for your campaign.</p>

      <Alert className="mb-8 border-gray-200 bg-gray-50">
        <Info className="h-4 w-4 text-gray-700" />
        <AlertDescription className="text-gray-700">
          Upload files containing customer information such as contact details, preferences, and demographics.
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
                    id="customer-files"
                    type="file"
                    multiple
                    onChange={handleFileChange}
                    className="hidden"
                  />

                  <div className="flex flex-col items-center justify-center py-6">
                    <Upload className="h-14 w-14 text-gray-400 mb-5" />
                    <h3 className="text-lg font-medium mb-2 text-gray-900">Upload Customer Data Files</h3>
                    <p className="text-sm text-gray-500 text-center mb-3">
                      Drag and drop your files here or click to browse
                    </p>
                    <p className="text-xs text-gray-400">Accepted file types: CSV, Excel, PDF, Text</p>
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
