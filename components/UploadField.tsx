"use client"

import type React from "react"

import { useState, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Upload, X } from "lucide-react"
import { cn } from "@/lib/utils"

interface UploadFieldProps {
  id: string
  title: string
  accept?: string
  required?: boolean
  value: File | null
  onChange: (file: File | null) => void
  error?: boolean
  helperText?: string
}

export default function UploadField({
  id,
  title,
  accept = "application/pdf,image/*",
  required = false,
  value,
  onChange,
  error = false,
  helperText,
}: UploadFieldProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [isDragging, setIsDragging] = useState(false)

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (files && files.length > 0) {
      onChange(files[0])
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

    const files = e.dataTransfer.files
    if (files && files.length > 0) {
      onChange(files[0])
    }
  }

  const handleRemoveFile = () => {
    onChange(null)
    if (inputRef.current) {
      inputRef.current.value = ""
    }
  }

  const triggerFileInput = () => {
    inputRef.current?.click()
  }

  return (
    <div className="space-y-2">
      <Label htmlFor={id} className="flex items-center">
        {title}
        {required && <span className="text-red-500 ml-1">*</span>}
      </Label>

      <div
        className={cn(
          "border-2 border-dashed rounded-lg p-4 transition-colors",
          isDragging ? "border-primary bg-primary/5" : "border-border",
          error ? "border-red-500" : "",
          "cursor-pointer",
        )}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={triggerFileInput}
      >
        <Input id={id} ref={inputRef} type="file" accept={accept} onChange={handleFileChange} className="hidden" />

        {value ? (
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2 truncate">
              <div className="w-10 h-10 rounded bg-primary/10 flex items-center justify-center">
                <Upload className="h-5 w-5 text-primary" />
              </div>
              <div className="truncate">
                <p className="text-sm font-medium truncate">{value.name}</p>
                <p className="text-xs text-muted-foreground">{(value.size / 1024).toFixed(2)} KB</p>
              </div>
            </div>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={(e) => {
                e.stopPropagation()
                handleRemoveFile()
              }}
            >
              <X className="h-4 w-4" />
              <span className="sr-only">Remove file</span>
            </Button>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-4">
            <Upload className="h-8 w-8 text-muted-foreground/60 mb-2" />
            <p className="text-sm text-muted-foreground text-center">Drag and drop your file here or click to browse</p>
            <p className="text-xs text-muted-foreground/60 mt-1">Accepted file types: {accept.split(",").join(", ")}</p>
          </div>
        )}
      </div>

      {helperText && <p className={cn("text-xs", error ? "text-red-500" : "text-muted-foreground")}>{helperText}</p>}
    </div>
  )
}

