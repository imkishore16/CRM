"use client";

import { useState } from "react";
import { FilePond, registerPlugin } from "react-filepond";
import "filepond/dist/filepond.min.css";
import { toast, Toaster } from "react-hot-toast";
import Lottie from "react-lottie";
import type { FilePondFile } from "filepond";

// Import FilePond plugins if needed
// import FilePondPluginFileValidateType from 'filepond-plugin-file-validate-type';
// import FilePondPluginImagePreview from 'filepond-plugin-image-preview';
// import 'filepond-plugin-image-preview/dist/filepond-plugin-image-preview.css';

// Register plugins if needed
// registerPlugin(FilePondPluginFileValidateType, FilePondPluginImagePreview);

interface FileResponse {
  parsedText: string;
  [key: string]: any;
}

export default function FileUpload() {
  const [fileResponse, setFileResponse] = useState<FileResponse | null>(null);
  const [files, setFiles] = useState<FilePondFile[]>([]);

  // You would need to import your animation data
  // For now, we'll use a placeholder
  const animationUpload = {
    v: "5.7.8",
    fr: 30,
    ip: 0,
    op: 60,
    w: 260,
    h: 260,
    nm: "Upload Animation",
    ddd: 0,
    assets: [],
    layers: [],
    markers: []
  };

  const uploadOptions = {
    loop: true,
    autoplay: true,
    animationData: animationUpload,
    rendererSettings: {
      preserveAspectRatio: "xMidYMid slice",
    },
  };

  const notify = (status: "success" | "error", message: string) => {
    toast.dismiss();
    if (status === "success") {
      toast.success(message);
    } else {
      toast.error(message);
    }
  };

  return (
    <div>
      {/* <Toaster />
      <FilePond
        files={files}
        onupdatefiles={setFiles}
        allowMultiple={false}
        maxFiles={1}
        name="file"
        labelIdle='Drag & Drop your files or <span class="filepond--label-action">Browse</span>'
        acceptedFileTypes={["application/pdf"]}
        server={{
          process: {
            url: "/api/testApi/upload",
            method: "POST",
            withCredentials: false,
            onload: (response) => {
              try {
                const parsedResponse = JSON.parse(response);
                setFileResponse(parsedResponse);
                notify("success", "File uploaded successfully");
                return response;
              } catch (error) {
                notify("error", "Failed to parse server response");
                return response;
              }
            },
            onerror: (response) => {
              notify("error", "Failed to upload file");
              return response;
            },
          },
          fetch: null,
          revert: null,
        }}
      />

      <div>
        {fileResponse ? (
          <div className="p-5">
            <h1 className="font-black text-xl">Text from the PDF:</h1>
            <pre className="text-wrap p-5 bg-gray-50 rounded-md border mt-2 max-h-[400px] overflow-auto">
              {fileResponse.parsedText}
            </pre>
          </div>
        ) : (
          <div className="flex flex-col gap-2 justify-center items-center">
            <h2 className="font-bold mt-10">Upload a file to chat</h2>
            <p>Supported file types: PDF</p>
            <div
              className="h-[260px] w-[260px]"
              onClick={() => notify("success", "Please upload a PDF file")}
            >
              <Lottie options={uploadOptions} height={260} width={260} />
            </div>
          </div>
        )}
      </div> */}
    </div>
  );
}
