"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { PlusCircle, Loader2, Trash2 } from "lucide-react"
import { useToast } from "@/components/ui/use-toast"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { useParams } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"

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

export default function SetTargetCustomersForm() {
  const params = useParams()
  const spaceId = params.spaceId
  const { toast } = useToast()
  const [rows, setRows] = useState<FormRow[]>([{ id: crypto.randomUUID(), mobile: "", text: "" }])
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [customers, setCustomers] = useState<CustomerData[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const fetchCustomers = async () => {
      setIsLoading(true)
      try {
        const res = await fetch(`${process.env.NEXTAUTH_URL}/api/customers?spaceId=${spaceId}`, {
          method: "GET",
          headers: { "Content-Type": "application/json" },
        })

        if (res.ok) {
          const data = await res.json()
          setCustomers(data.customers || [])
        } else {
          toast({
            title: "Error",
            description: "Failed to fetch customers.",
            variant: "destructive",
          })
        }
      } catch (error) {
        console.error("Error fetching customers:", error)
        toast({
          title: "Error",
          description: "An error occurred while fetching customers.",
          variant: "destructive",
        })
      } finally {
        setIsLoading(false)
      }
    }

    fetchCustomers()
  }, [spaceId, toast])

  const addNewRow = () => {
    setRows([...rows, { id: crypto.randomUUID(), mobile: "", text: "" }])
  }

  const updateRow = (id: string, field: keyof Omit<FormRow, "id">, value: string) => {
    setRows(rows.map((row) => (row.id === id ? { ...row, [field]: value } : row)))
  }

  const removeRow = (id: string) => {
    if (rows.length > 1) {
      setRows(rows.filter((row) => row.id !== id))
    } else {
      toast({
        title: "Cannot Remove",
        description: "You must have at least one row",
        variant: "destructive",
      })
    }
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

      const namespace = "customerdata"
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
          setCustomers(data.customers || [])
        }
      } else {
        throw new Error("Failed to submit the form")
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
    <div className="container max-w-4xl py-8 px-4">
      <h1 className="text-2xl font-bold mb-6 text-gray-900">Set Target Customers</h1>

      <Card className="mb-8 border-gray-200">
        <CardHeader>
          <CardTitle className="text-xl font-semibold text-gray-900">Add Customer Information</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {rows.map((row, index) => (
              <div key={row.id} className="p-4 border border-gray-200 rounded-lg bg-gray-50">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="font-medium text-gray-900">Customer {index + 1}</h3>
                  {rows.length > 1 && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => removeRow(row.id)}
                      className="h-8 w-8 p-0 text-gray-500 hover:text-red-500"
                    >
                      <Trash2 className="h-4 w-4" />
                      <span className="sr-only">Remove</span>
                    </Button>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor={`mobile-${row.id}`} className="text-gray-700">
                      Mobile Number
                    </Label>
                    <Input
                      id={`mobile-${row.id}`}
                      type="tel"
                      placeholder="Enter mobile number"
                      value={row.mobile}
                      onChange={(e) => updateRow(row.id, "mobile", e.target.value)}
                      className="border-gray-500 white bg-white"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor={`text-${row.id}`} className="text-gray-700">
                      Customer Information
                    </Label>
                    <Textarea
                      id={`text-${row.id}`}
                      placeholder="Enter customer details"
                      value={row.text}
                      onChange={(e) => updateRow(row.id, "text", e.target.value)}
                      className="min-h-[100px] border-gray-500  bg-white"
                    />
                  </div>
                </div>
              </div>
            ))}

            <div className="flex justify-between">
              <Button
                type="button"
                variant="outline"
                onClick={addNewRow}
                className="flex items-center gap-2 border-gray-200 text-white hover:bg-gray-50 hover:text-gray-900"
              >
                <PlusCircle className="h-4 w-4" />
                Add Customer
              </Button>

              <Button
                type="submit"
                disabled={isSubmitting}
                className="bg-black text-white hover:bg-white hover:text-black hover:border-black border border-transparent transition-colors"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Submitting...
                  </>
                ) : (
                  "Submit"
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Customer Data Table */}
      <Card className="border-gray-200">
        <CardHeader>
          <CardTitle className="text-xl font-semibold text-gray-900">Customer Data</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center items-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
            </div>
          ) : customers.length > 0 ? (
            <div className="rounded-md border border-gray-200 overflow-hidden">
              <Table>
                <TableHeader className="bg-gray-50">
                  <TableRow>
                    <TableHead className="font-medium text-gray-700">ID</TableHead>
                    <TableHead className="font-medium text-gray-700">Mobile Number</TableHead>
                    <TableHead className="font-medium text-gray-700">Information</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {customers.map((customer, index) => (
                    <TableRow key={index} className="hover:bg-gray-50">
                      <TableCell className="font-medium">{index + 1}</TableCell>
                      <TableCell>{customer.mobileNumber}</TableCell>
                      <TableCell className="max-w-md truncate">{customer.information}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <div className="text-center py-8 bg-gray-50 rounded-md">
              <p className="text-gray-500">No customer data available</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

