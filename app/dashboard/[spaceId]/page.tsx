"use client";
import { useEffect, useState } from "react";
import jwt from "jsonwebtoken";
import Upload from "@/components/upload";
import ErrorScreen from "@/components/ErrorScreen";
import LoadingScreen from "@/components/LoadingScreen";
import { useRouter } from "next/navigation";


type Props = {
  params: { spaceId: number };
};

export default function Component({params}:Props) {
  const [spaceId, setSpaceId] = useState(-1);
  useEffect(() => {
    async function getParams() {
      const unwrappedParams = await params;
      setSpaceId(unwrappedParams.spaceId);
    }
    getParams();
  }, [params]);
  const router = useRouter(); 
  const [loading, setLoading] = useState(true);
  
  const handleNavigation = (path: string) => {
    router.push(path); 
  };
  
  return (
    <div className="flex">

      <div className="flex-1 p-8">
        <p>Welcome to your dashboard. Here's an overview of your account.</p>
        <div> analytics here </div>
      </div>
    </div>
  );
  
}

export const dynamic = "auto";
