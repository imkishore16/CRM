"use client"
import { useRouter } from "next/navigation"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { ChevronRight,Plus } from "lucide-react"

interface TableItem {
  id: number
  title: string
  href: string
}

interface ClickableTableProps {
  items: TableItem[]
}

export default function ClickableTable({ items }: ClickableTableProps) {
  const router = useRouter()

  const handleRowClick = (href: string) => {
    router.push(href)
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Navigation</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {items.map((item) => (
          <TableRow
            key={item.id}
            onClick={() => handleRowClick(item.href)}
            className="cursor-pointer hover:bg-muted transition-colors"
          >
            <TableCell className="flex justify-between items-center py-4">
              <span>{item.title}</span>
              <Plus className="h-4 w-4 text-muted-foreground" />
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  )
}

