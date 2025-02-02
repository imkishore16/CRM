"use client";
import { useEffect, useState } from "react";
import jwt from "jsonwebtoken";
import Upload from "@/components/upload";
import ErrorScreen from "@/components/ErrorScreen";
import LoadingScreen from "@/components/LoadingScreen";
import { useRouter } from "next/navigation";



// in this coponents the first page is the dashboard 
// and the sidepanel will contain the other pages to upload data / view contents uploaded , chat histories etc etc...

type Props = {
  params: { spaceId: number };
};

export default async function Component({params}:Props) {
  const spaceId = await params.spaceId;
  const router = useRouter(); 
  const [creatorId,setCreatorId]=useState<Number | null>(null);
  const [loading, setLoading] = useState(true);
  
  const handleNavigation = (path: string) => {
    router.push(path); 
  };
  
  return (
    <div className="flex">
      {/* Side Navbar */}
      <div className="w-64 bg-gray-800 text-white h-screen p-4">
        <h2 className="text-xl font-bold mb-4">Dashboard</h2>
        <ul className="space-y-4">
          <li>
            <button
              onClick={() => handleNavigation(`/dashboard/${spaceId}/overview`)} 
              className="w-full text-left px-4 py-2 rounded hover:bg-gray-700"
            >
              Overview
            </button>
          </li>
          <li>
            <button
              onClick={() => handleNavigation(`/dashboard/${spaceId}/upload`)} 
              className="w-full text-left px-4 py-2 rounded hover:bg-gray-700"
            >
              Upload Data
            </button>
          </li>
          <li>
            <button
              onClick={() => handleNavigation(`/dashboard/${spaceId}/settings`)} 
              className="w-full text-left px-4 py-2 rounded hover:bg-gray-700"
            >
              Settings
            </button>
          </li>
          
        </ul>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 p-8">
        {/* Render your analytics or based on the route */}
        <div> analytics here </div>
      </div>
    </div>
  );
  
}

export const dynamic = "auto";
