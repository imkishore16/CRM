import {use} from "react"

interface DashboardProps {
  params: Promise<{ spaceId: string }>;
}

export default function Dashboard({params}:DashboardProps) {
  const unwrappedParams = use(params)
  const { spaceId } = unwrappedParams

  return (
    <div className="flex">
      <div className="flex-1 p-8">
        <p>Welcome to your dashboard for space ID: {spaceId}</p>
        <div> analytics here </div>
      </div>
    </div>
  );
}

