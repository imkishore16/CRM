import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { useSession } from "next-auth/react";
import { Asul } from "next/font/google";

type Props = {
  setLoading: (value: boolean) => void;
  loading: boolean;
  enqueueToast: (type: "error" | "success", message: string) => void;
  spaceId : Number;
  index :string
};

export default function UploadDataForm({
  enqueueToast,
  setLoading,
  loading,
  spaceId,
  index
}: Props) {
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const user = useSession().data?.user;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files) {
      const fileArray = Array.from(files);
      const validExtensions = ["pdf", "csv", "xlsx", "xls"];
      const validFiles = fileArray.filter((file) =>
        validExtensions.includes(file.name.split(".").pop()?.toLowerCase() || "")
      );

      if (validFiles.length === 0) {
        enqueueToast(
          "error",
          "Invalid file format. Please upload PDF, CSV, XLSX, or XLS files."
        );
      } else {
        setSelectedFiles((prevFiles) => [...prevFiles, ...validFiles]);
      }
    }
    e.target.value = ""; // Reset the input
  };

  const handleDeleteFile = (fileName: string) => {
    setSelectedFiles((prevFiles) =>
      prevFiles.filter((file) => file.name !== fileName)
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {

    e.preventDefault();

    if (selectedFiles.length === 0) {
      enqueueToast("error", "Please upload at least one file.");
      return;
    }

    if ( !user?.id) {
      enqueueToast("error", "Missing product data or user ID.");
      return;
    }

    setLoading(true);

    try {
      const formData = new FormData();
      selectedFiles.forEach((file) => formData.append("files", file));
      formData.append("userId", user.id);
      formData.append("subFolder", index);
      console.log("Called upload api")
      const response = await fetch(`/api/embed`, {
        method: "POST",
        body: formData,
      });
      
      if (response.ok) {
        enqueueToast("success", "Files uploaded successfully!");
        setSelectedFiles([]); 
      } else {
        const errorData = await response.json();
        enqueueToast("error", errorData.message || "Failed to upload files.");
      }



    } catch (error) {
      enqueueToast("error", "An unexpected error occurred.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        {/* <h1 className="text-xl font-bold">Upload Files</h1> */}
      </div>

      {/* List of Uploaded Files */}
      <div className="space-y-2 mb-4">
        {selectedFiles.map((file) => (
          <div
            key={file.name}
            className="flex items-center justify-between p-2 bg-gray-400 rounded"
          >
            <span>{file.name}</span>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleDeleteFile(file.name)}
            >
              Delete
            </Button>
          </div>
        ))}
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <input
          type="file"
          accept=".pdf,.csv,.xlsx,.xls"
          multiple
          onChange={handleFileChange}
          className="w-full p-2 border rounded"
        />
        <Button
          disabled={loading || selectedFiles.length === 0}
          type="submit"
          className="w-full"
        >
          {loading ? "Uploading..." : "Upload"}
        </Button>
      </form>
    </div>
  );
}
