
type Props = {
  params: { spaceId: number };
};

export default function Dashboard({params}:Props) {
  const { spaceId } = params; 

  return (
    <div className="flex">
      <div className="flex-1 p-8">
        <p>Welcome to your dashboard for space ID: {spaceId}</p>
        <div> analytics here </div>
      </div>
    </div>
  );
}

