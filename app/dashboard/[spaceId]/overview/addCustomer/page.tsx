"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { PlusCircle } from "lucide-react"
import { useToast } from "@/components/ui/use-toast"

interface FormRow {
  id: string
  mobile: string
  text: string
}

export default function DynamicForm() {
  const { toast } = useToast()
  const [rows, setRows] = useState<FormRow[]>([{ id: crypto.randomUUID(), mobile: "", text: "" }])
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Store data in a Map
  const formDataMap = new Map<string, { mobile: string; text: string }>()

  // Update the map with current form data
  rows.forEach((row) => {
    formDataMap.set(row.id, { mobile: row.mobile, text: row.text })
  })

  const addNewRow = () => {
    setRows([...rows, { id: crypto.randomUUID(), mobile: "", text: "" }])
  }

  const updateRow = (id: string, field: keyof Omit<FormRow, "id">, value: string) => {
    setRows(rows.map((row) => (row.id === id ? { ...row, [field]: value } : row)))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    // Validate form
    const isValid = rows.every((row) => row.mobile.trim() && row.text.trim())

    if (!isValid) {
      toast({
        title: "Validation Error",
        description: "Please fill in all fields",
        variant: "destructive",
      })
      return
    }

    setIsSubmitting(true)

    try {
      // Convert Map to an array for API submission
      const formData = Array.from(formDataMap.entries()).map(([id, data]) => ({
        id,
        ...data,
      }))

      // Call your API here
      const response = await mockApiCall(formData)

      if (response.success) {
        toast({
          title: "Success",
          description: "Your data has been submitted successfully",
        })

        // Reset form after successful submission
        setRows([{ id: crypto.randomUUID(), mobile: "", text: "" }])
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to submit the form. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  // Mock API call - replace with your actual API
  const mockApiCall = async (data: any) => {
    return new Promise<{ success: boolean }>((resolve) => {
      setTimeout(() => {
        console.log("Submitted data:", data)
        resolve({ success: true })
      }, 1500)
    })
  }

  return (
    <div className="container max-w-3xl py-10">
      <h1 className="text-2xl font-bold mb-6">Dynamic Form</h1>

      <form onSubmit={handleSubmit} className="space-y-6">
        {rows.map((row, index) => (
          <div key={row.id} className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label htmlFor={`mobile-${row.id}`} className="text-sm font-medium">
                Mobile Number {index + 1}
              </label>
              <Input
                id={`mobile-${row.id}`}
                type="tel"
                placeholder="Enter mobile number"
                value={row.mobile}
                onChange={(e) => updateRow(row.id, "mobile", e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <label htmlFor={`text-${row.id}`} className="text-sm font-medium">
                Text {index + 1}
              </label>
              <Textarea
                id={`text-${row.id}`}
                placeholder="Enter your text here"
                value={row.text}
                onChange={(e) => updateRow(row.id, "text", e.target.value)}
                className="min-h-[100px]"
              />
            </div>
          </div>
        ))}

        <div className="flex justify-between">
          <Button type="button" variant="outline" onClick={addNewRow} className="flex items-center gap-2">
            <PlusCircle className="h-4 w-4" />
            Add Row
          </Button>

          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? "Submitting..." : "Submit"}
          </Button>
        </div>
      </form>
    </div>
  )
}

