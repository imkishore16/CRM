import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import { useSession } from "next-auth/react";
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth-options";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function sendError(ws: WebSocket, message: string) {
  ws.send(JSON.stringify({ type: "error", data: { message } }));
}




