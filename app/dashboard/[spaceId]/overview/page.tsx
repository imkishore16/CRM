import { authOptions } from "@/lib/auth-options";
import { getServerSession } from "next-auth";
import ClickableTable from "@/components/clickable-table";
import { use } from "react";
import { LayoutDashboard, User, Settings, BarChart, FileText, HelpCircle } from "lucide-react";

interface Props {
  params: Promise<{
    spaceId: string
  }>
}
export default async function Overview({ params }: Props) {
  
  const unwrappedParams = use(params)
  const { spaceId } = unwrappedParams
  const tableData = [
    { id: 1, title: "Set Target Users", href: `/dashboard/${spaceId}/overview/setTargetCustomers` },
    { id: 2, title: "Product links", href: `/dashboard/${spaceId}/overview/setTargetCustomers` },
    { id: 3, title: "Platforms", href: `/dashboard/${spaceId}/overview/setTargetCustomers` },
    { id: 4, title: "Campaign Details", href: `/dashboard/${spaceId}/overview/setTargetCustomers` },
    { id: 5, title: "Promo Codes", href: `/dashboard/${spaceId}/overview/setTargetCustomers` },
    { id: 6, title: "View product data", href: `/dashboard/${spaceId}/overview/viewProductData`},
  ]
  
  return (
    <div>
      
      <main className="container mx-auto py-10 px-4">
        <div>overview</div>
        <div>This page will consist of the product data and customer data, and allows user to add additional data like promos and links</div>
        <div>It also contains details such as user didnt respond and when clicked on a user it displays their text, need to store it in DB or vecDB?</div>
        
        <h1 className="text-2xl font-bold mb-6">Data Overview Menu</h1>
        <div className="max-w-md">
          <ClickableTable items={tableData} />
        </div>
      </main>
    </div>
  );
}