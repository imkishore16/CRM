import { authOptions } from "@/lib/auth-options";
import { getServerSession } from "next-auth";
import ClickableTable from "@/components/clickable-table";
import { use } from "react";
import { LayoutDashboard, User, Settings, BarChart, FileText, HelpCircle } from "lucide-react";

type Props = {
  params: {
    spaceId: string;
  };
};

export default async function Overview({ params }: Props) {
  const { spaceId } = params;
  console.log(spaceId);
  
  const session = await getServerSession(authOptions);
  
  const tableData = [
    { id: 1, title: "Add Customer Data", href: `/dashboard/${spaceId}/overview/addCustomer` },
  ]
  
  return (
    <div>
      <div>overview</div>
      <div>This page will consist of the product data and customer data, and allows user to add additional data like promos and links</div>
      <div>It also contains details such as user didn't respond and when clicked on a user it displays their text, need to store it in DB or vecDB?</div>
      {/* <main className="container mx-auto py-10 px-4">
        <h1 className="text-2xl font-bold mb-6">Data Overview Menu</h1>
        <div className="max-w-md">
          <ClickableTable items={tableData} />
        </div>
      </main> */}
    </div>
  );
}