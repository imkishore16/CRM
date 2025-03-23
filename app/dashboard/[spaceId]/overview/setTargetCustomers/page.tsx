"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { PlusCircle } from "lucide-react"
import { useToast } from "@/components/ui/use-toast"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { useParams } from "next/navigation"

interface FormRow {
  id: string
  mobile: string
  text: string
}

interface CustomerData {
  id: number
  mobileNumber: string
  information: string
}

type Props = {
  params: { spaceId: number }
}

export default function SetTargetCustomersForm() {
  const params = useParams();
  const spaceId = params.spaceId;

  console.log(spaceId)
  const { toast } = useToast()
  const [rows, setRows] = useState<FormRow[]>([{ id: crypto.randomUUID(), mobile: "", text: "" }])
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [customers, setCustomers] = useState<CustomerData[]>([])

  useEffect(() => {
    const fetchCustomers = async () => {
      try {
        const res = await fetch(`${process.env.NEXTAUTH_URL}/api/customers?spaceId=${spaceId}`, {
          method: "GET",
          headers: { "Content-Type": "application/json" },
        })

        if (res.ok) {
          const data = await res.json()
          setCustomers(data.customers)
        } else {
          toast({ description: "Failed to fetch customers." })
        }
      } catch (error) {
        console.error("Error fetching customers:", error)
        toast({ description: "An error occurred while fetching customers." })
      }
    }

    fetchCustomers()
  }, [spaceId, toast])

  const formDataMap = new Map<string, { mobile: string; text: string }>()
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
      const formData = new FormData()
      rows.forEach((row) => {
        const data = { mobile: row.mobile, text: row.text }
        Object.entries(data).forEach(([key, value]) => {
          formData.append(`${row.id}[${key}]`, value)
        })
      })

      const namespace="customerdata"
      const response = await fetch(`/api/embed?spaceId=${spaceId}&namespace=${namespace}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: formData,
      })

      if (response.ok) {
        toast({
          title: "Success",
          description: "Your data has been submitted successfully",
        })

        setRows([{ id: crypto.randomUUID(), mobile: "", text: "" }])

        // Refresh customer data after successful submission
        const res = await fetch(`${process.env.NEXTAUTH_URL}/api/customers?spaceId=${spaceId}`, {
          method: "GET",
          headers: { "Content-Type": "application/json" },
        })

        if (res.ok) {
          const data = await res.json()
          setCustomers(data)
        }
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

      {/* Customer Data Table */}
      <div className="mt-12">
        <h2 className="text-xl font-bold mb-4">Customer Data</h2>

        {customers.length > 0 ? (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>ID</TableHead>
                <TableHead>Mobile Number</TableHead>
                <TableHead>Information</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {customers.map((customer,index) => (
                <TableRow key={index}>
                  <TableCell>{index+1}</TableCell>
                  <TableCell>{customer.mobileNumber}</TableCell>
                  <TableCell>{customer.information}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        ) : (
          <div className="text-center py-6 bg-gray-50 rounded-md">
            <p className="text-gray-500">No customer data available</p>
          </div>
        )}
      </div>
    </div>
  )
}

