interface LoadingScreenProps {
  message?: string
}

export default function LoadingScreen({ message = "Loading..." }: LoadingScreenProps) {
  return (
    <div className="min-h-screen w-full flex flex-col items-center justify-center bg-background">
      <div className="flex flex-col items-center">
        <div className="flex space-x-2 mb-4">
          <div className="h-3 w-3 rounded-full bg-black animate-bounce [animation-delay:-0.3s]"></div>
          <div className="h-3 w-3 rounded-full bg-black animate-bounce [animation-delay:-0.15s]"></div>
          <div className="h-3 w-3 rounded-full bg-black animate-bounce"></div>
        </div>
        <p className="text-sm text-muted-foreground">{message}</p>
      </div>
    </div>
  )
}
