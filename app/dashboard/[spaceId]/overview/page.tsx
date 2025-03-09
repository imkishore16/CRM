import { authOptions } from "@/lib/auth-options";
import { getServerSession } from "next-auth";
import ClickableTable from "@/components/clickable-table";
import { use } from "react";
import { LayoutDashboard, User, Settings, BarChart, FileText, HelpCircle } from "lucide-react";

interface Props {
  params: { spaceId: string };
}

export default async function Overview({ params }: Props) {
  const spaceId = params.spaceId;
  
  const session = await getServerSession(authOptions);
  
  const tableData = [
    { id: 1, title: "Set Target Users", href: `/dashboard/${spaceId}/overview/setTargetCustomers` },
    { id: 2, title: "Product links", href: `/dashboard/${spaceId}/overview/setTargetCustomers` },
    { id: 3, title: "Platforms", href: `/dashboard/${spaceId}/overview/setTargetCustomers` },
    { id: 4, title: "Campaign Details", href: `/dashboard/${spaceId}/overview/setTargetCustomers` },
    { id: 5, title: "Promo Codes", href: `/dashboard/${spaceId}/overview/setTargetCustomers` },
    { id: 6, title: "Something else", href: `/dashboard/${spaceId}/overview/setTargetCustomers` },
  ]
  
  return (
    <div>
      
      <main className="container mx-auto py-10 px-4">
        <div>overview</div>
        <div>This page will consist of the product data and customer data, and allows user to add additional data like promos and links</div>
        <div>It also contains details such as user didn't respond and when clicked on a user it displays their text, need to store it in DB or vecDB?</div>
        
        <h1 className="text-2xl font-bold mb-6">Data Overview Menu</h1>
        <div className="max-w-md">
          <ClickableTable items={tableData} />
        </div>
      </main>
    </div>
  );
}