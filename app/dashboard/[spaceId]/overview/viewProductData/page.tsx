// app/pdf-uploader/page.tsx
'use client';

import React, { useState, useRef } from 'react';
import { FilePond, registerPlugin } from 'react-filepond';
import 'filepond/dist/filepond.min.css';
import FilePondPluginFileValidateType from 'filepond-plugin-file-validate-type';

// Register FilePond plugins
registerPlugin(FilePondPluginFileValidateType);

export default function PDFUploader() {
  const [parsedText, setParsedText] = useState<string>('');
  const [fileName, setFileName] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const pondRef = useRef<FilePond>(null);

  const handleProcessFile = async (
    fieldName: string,
    file: any,
    metadata: any,
    load: Function,
    error: Function,
    progress: Function,
    abort: Function
  ) => {
    try {
      setIsLoading(true);
      setError(null);
      
      // Create form data
      const formData = new FormData();
      formData.append('filepond', file);
      
      // Send the file to the API
      const response = await fetch('/api/testApi/parse-pdf', {
        method: 'POST',
        body: formData,
      });
      
      if (!response.ok) {
        throw new Error(`Error: ${response.status}`);
      }
      
      const data = await response.json();
      
      if (data.error) {
        setError(data.error);
        error(data.error);
        return;
      }
      
      // Update state with parsed text
      setParsedText(data.parsedText);
      setFileName(data.fileName);
      
      // Complete the upload
      load(data.fileName);
    } catch (err: any) {
      setError(err.message || 'An error occurred during upload');
      error(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const clearResults = () => {
    setParsedText('');
    setFileName('');
    setError(null);
    if (pondRef.current) {
      pondRef.current.removeFiles();
    }
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <h1 className="text-2xl font-bold mb-6">PDF Parser</h1>
      
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <h2 className="text-xl font-semibold mb-4">Upload PDF File</h2>
        
        <FilePond
          ref={pondRef}
          acceptedFileTypes={['application/pdf']}
          labelFileTypeNotAllowed="Only PDF files are allowed"
          fileValidateTypeLabelExpectedTypes="Please upload a PDF file"
          allowMultiple={false}
          maxFiles={1}
          server={{
            process: handleProcessFile,
          }}
          labelIdle='Drag & Drop your PDF file or <span class="filepond--label-action">Browse</span>'
          className="mb-4"
        />
        
        {isLoading && (
          <div className="flex items-center justify-center py-4">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
            <span className="ml-2">Processing...</span>
          </div>
        )}
        
        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            <p>{error}</p>
          </div>
        )}
        
        {parsedText && (
          <button
            onClick={clearResults}
            className="bg-gray-200 hover:bg-gray-300 text-gray-800 font-semibold py-2 px-4 rounded"
          >
            Clear Results
          </button>
        )}
      </div>
      
      {parsedText && (
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold">Parsed Text from {fileName}</h2>
            <button
              onClick={() => {navigator.clipboard.writeText(parsedText)}}
              className="bg-blue-500 hover:bg-blue-600 text-white font-semibold py-1 px-3 rounded text-sm"
            >
              Copy to Clipboard
            </button>
          </div>
          
          <div className="bg-gray-50 p-4 rounded border border-gray-200 h-96 overflow-y-auto whitespace-pre-wrap">
            {parsedText}
          </div>
        </div>
      )}
    </div>
  );
}