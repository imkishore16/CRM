import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import useRedirect from "@/hooks/useRedirect";
import { authOptions } from "@/lib/auth-options";
import { getServerSession } from "next-auth";
import Upload from "@/components/upload";
type Props = {
    params: { spaceId: number };
  };
  
export default async function UploadPage({params:{spaceId}}:Props) {
    const session =await  getServerSession(authOptions);
    
    return (
        <Upload spaceId={spaceId} />
    )
  }