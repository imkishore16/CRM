"use client";
import { useEffect, useState } from "react";
import { toast } from "sonner";


import { useSession } from "next-auth/react";
import { Appbar } from "../Appbar";
import UploadDataForm from "./UploadData";

export default function SpaceView({
  spaceId,
}: {
  spaceId: Number;
}) {
  const [loading, setLoading] = useState(false);
  const [spaceName, setSpaceName] = useState("");

  const user = useSession().data?.user;

  const enqueueToast = (type: "error" | "success", message: string) => {
    const toastFn = type === "error" ? toast.error : toast.success;
  }
  
  return (
    <div className="flex min-h-screen flex-col">
      <Appbar/>
      <div className="mx-auto rounded-lg p-2 bg-gradient-to-r from-indigo-600 to-violet-800 text-2xl font-bold">
        {spaceName}
      </div>
      <div className="flex justify-center">
        <div className="grid w-screen max-w-screen-xl grid-cols-1 gap-4 pt-8 md:grid-cols-5">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-xl font-bold">Upload Product Files</h1>
      </div>
        <div className="mx-auto w-full max-w-4xl space-y-6 p-4">
              <UploadDataForm
                enqueueToast={enqueueToast}
                loading={loading}
                setLoading={setLoading}
                spaceId={spaceId}
                subFolder="ProductData"
              />
        </div>
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-xl font-bold">Upload Customer Data Files</h1>
      </div>
        <div className="mx-auto w-full max-w-4xl space-y-6 p-4">
              <UploadDataForm
                enqueueToast={enqueueToast}
                loading={loading}
                setLoading={setLoading}
                spaceId={spaceId}
                subFolder="CustomerData"
              />
        </div>
        </div>
      </div>
    </div>
  );
}
