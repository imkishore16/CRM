import HomeView from "@/components/HomeView";
import useRedirect from "@/hooks/useRedirect";
import { authOptions } from "@/lib/auth-options";
import { getServerSession } from "next-auth";



export default async function Home(){
  const session =await  getServerSession(authOptions);

  if (!session?.user.id) {
    // console.log(session)
    // console.log(session?.user.email)
    return <h1>Please Log in....</h1>;
  }
 return <HomeView></HomeView>

}