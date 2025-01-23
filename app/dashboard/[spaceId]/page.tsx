"use client";
import { useEffect, useState } from "react";
import jwt from "jsonwebtoken";
import SpaceView from "@/components/SpaceView";
import ErrorScreen from "@/components/ErrorScreen";
import LoadingScreen from "@/components/LoadingScreen";



export default function Component({params:{spaceId}}:{params:{spaceId:Number}}) {


  const [creatorId,setCreatorId]=useState<Number | null>(null);
  const [loading, setLoading1] = useState(true);
  
  // useEffect(()=>{
  //   async function fetchHostId(){
  //     try {
  //       const response = await fetch(`/api/spaces/?spaceId=${spaceId}`,{
  //         method:"GET"
  //       });
  //       const data = await response.json()
  //       if (!response.ok || !data.success) {
  //         throw new Error(data.message || "Failed to retreive space's host id");
  //       }
  //       setCreatorId(data.hostId)
       

  //     } catch (error) {
        
  //     }
  //     finally{
  //       setLoading1(false)
  //     }
  //   }
  //   fetchHostId();
  // },[spaceId])

 

  

  // if (connectionError) {
  //   return <ErrorScreen>Cannot connect to socket server</ErrorScreen>;
  // }

  // if (loading) {
  //   return <LoadingScreen />;
  // }

  // if (!user) {
  //   return <ErrorScreen>Please Log in....</ErrorScreen>;
  // }
  // if(loading1){
  // return <LoadingScreen></LoadingScreen>
  // }


  // if(user.id!=creatorId){
  //   return <ErrorScreen>You are not the creator of this space</ErrorScreen>
  // }

  
  return <SpaceView spaceId={spaceId}/>
}

export const dynamic = "auto";
