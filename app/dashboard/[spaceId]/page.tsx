"use client";

import { useRouter } from "next/navigation";

type Props = {
  params: { spaceId: number };
};

export default function Dashboard({ params }: Props) {
  const router = useRouter(); 

  // Directly access spaceId without useState/useEffect
  const { spaceId } = params;  

  const handleNavigation = (path: string) => {
    router.push(path); 
  };

  return (
    <div className="flex">
      <div className="flex-1 p-8">
        <p>Welcome to your dashboard for space ID: {spaceId}</p>
        <div> analytics here </div>
      </div>
    </div>
  );
}

export const dynamic = "auto";
