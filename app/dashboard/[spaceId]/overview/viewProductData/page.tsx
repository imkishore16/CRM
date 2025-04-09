"use client"

import { useState, useRef } from "react"
import { FilePond, registerPlugin } from "react-filepond"
import "filepond/dist/filepond.min.css"
import FilePondPluginFileValidateType from "filepond-plugin-file-validate-type"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Clipboard, AlertCircle, FileText, Loader2 } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { useToast } from "@/components/ui/use-toast"

// Register FilePond plugins
registerPlugin(FilePondPluginFileValidateType)

export default function PDFUploader() {
  const [parsedText, setParsedText] = useState<string>("")
  const [fileName, setFileName] = useState<string>("")
  const [isLoading, setIsLoading] = useState<boolean>(false)
  const [error, setError] = useState<string | null>(null)
  const pondRef = useRef<FilePond>(null)
  const { toast } = useToast()

  const handleProcessFile = async (
    fieldName: string,
    file: any,
    metadata: any,
    load: Function,
    error: Function,
    progress: Function,
    abort: Function,
  ) => {
    try {
      setIsLoading(true)
      setError(null)

      // Create form data
      const formData = new FormData()
      formData.append("filepond", file)

      // Send the file to the API
      const response = await fetch("/api/testApi/parse-pdf", {
        method: "POST",
        body: formData,
      })

      if (!response.ok) {
        throw new Error(`Error: ${response.status}`)
      }

      const data = await response.json()

      if (data.error) {
        setError(data.error)
        error(data.error)
        return
      }

      // Update state with parsed text
      setParsedText(data.parsedText)
      setFileName(data.fileName)

      // Complete the upload
      load(data.fileName)

      toast({
        title: "Success",
        description: "PDF parsed successfully",
      })
    } catch (err: any) {
      setError(err.message || "An error occurred during upload")
      error(err.message)

      toast({
        title: "Error",
        description: err.message || "An error occurred during upload",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const clearResults = () => {
    setParsedText("")
    setFileName("")
    setError(null)
    if (pondRef.current) {
      pondRef.current.removeFiles()
    }
  }

  const copyToClipboard = () => {
    navigator.clipboard.writeText(parsedText)
    toast({
      title: "Copied",
      description: "Text copied to clipboard",
    })
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <h1 className="text-2xl font-bold mb-6 text-gray-900">PDF Parser</h1>

      <div className="grid gap-6">
        <Card className="border-gray-200">
          <CardHeader>
            <CardTitle className="text-xl font-semibold text-gray-900">Upload PDF File</CardTitle>
          </CardHeader>
          <CardContent>
            <FilePond
              ref={pondRef}
              acceptedFileTypes={["application/pdf"]}
              labelFileTypeNotAllowed="Only PDF files are allowed"
              fileValidateTypeLabelExpectedTypes="Please upload a PDF file"
              allowMultiple={false}
              maxFiles={1}
              server={{
                process: handleProcessFile,
              }}
              labelIdle='Drag & Drop your PDF file or <span class="filepond--label-action">Browse</span>'
              className="mb-4"
              credits={false}
              stylePanelLayout="compact"
              styleButtonRemoveItemPosition="right"
              styleButtonProcessItemPosition="right"
              styleLoadIndicatorPosition="center"
              styleProgressIndicatorPosition="center"
            />

            {isLoading && (
              <div className="flex items-center justify-center py-4">
                <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
                <span className="ml-2 text-gray-600">Processing PDF...</span>
              </div>
            )}

            {error && (
              <Alert variant="destructive" className="mt-4">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {parsedText && (
              <Button
                onClick={clearResults}
                variant="outline"
                className="mt-4 border-gray-200 text-gray-700 hover:bg-gray-50 hover:text-gray-900"
              >
                Clear Results
              </Button>
            )}
          </CardContent>
        </Card>

        {parsedText && (
          <Card className="border-gray-200">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-xl font-semibold text-gray-900">
                <div className="flex items-center">
                  <FileText className="mr-2 h-5 w-5 text-gray-600" />
                  Parsed Text from {fileName}
                </div>
              </CardTitle>
              <Button
                onClick={copyToClipboard}
                variant="outline"
                size="sm"
                className="h-8 border-gray-200 text-gray-700 hover:bg-gray-50 hover:text-gray-900"
              >
                <Clipboard className="mr-2 h-4 w-4" />
                Copy
              </Button>
            </CardHeader>
            <CardContent>
              <div className="bg-gray-50 p-4 rounded-md border border-gray-200 h-96 overflow-y-auto whitespace-pre-wrap text-gray-800 text-sm">
                {parsedText}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}

