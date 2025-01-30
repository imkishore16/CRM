import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import useRedirect from "@/hooks/useRedirect";
import { authOptions } from "@/lib/auth-options";
import { getServerSession } from "next-auth";
type Props = {
    params: { spaceId: number };
  };
  

export default async function settings({params:{spaceId}}:Props) {
    const session =await  getServerSession(authOptions);
    
    return (
        <div>setting screen</div>
    )
  }