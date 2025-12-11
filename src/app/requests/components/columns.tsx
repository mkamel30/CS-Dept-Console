"use client";

import { ColumnDef } from "@tanstack/react-table";
import { MoreHorizontal, ArrowUpDown } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export type RequestColumn = {
  id: string;
  issue: string;
  asset: string;
  status: 'Open' | 'In Progress' | 'Closed' | 'Cancelled';
  priority: 'Low' | 'Medium' | 'High';
  technician: string;
  createdDate: string;
};

const statusVariantMap: Record<RequestColumn['status'], 'default' | 'secondary' | 'destructive'> = {
  'Open': 'default',
  'In Progress': 'secondary',
  'Closed': 'outline',
  'Cancelled': 'destructive',
};
const statusTextMap: Record<RequestColumn['status'], string> = {
    'Open': 'مفتوح',
    'In Progress': 'قيد التنفيذ',
    'Closed': 'مغلق',
    'Cancelled': 'ملغى'
};


const priorityVariantMap: Record<RequestColumn['priority'], 'default' | 'secondary' | 'destructive'> = {
  'Low': 'secondary',
  'Medium': 'default',
  'High': 'destructive',
};

const priorityTextMap: Record<RequestColumn['priority'], string> = {
    'Low': 'منخفضة',
    'Medium': 'متوسطة',
    'High': 'عالية'
};


export const columns: ColumnDef<RequestColumn>[] = [
  {
    id: "select",
    header: ({ table }) => (
      <Checkbox
        checked={table.getIsAllPageRowsSelected()}
        onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
        aria-label="تحديد الكل"
      />
    ),
    cell: ({ row }) => (
      <Checkbox
        checked={row.getIsSelected()}
        onCheckedChange={(value) => row.toggleSelected(!!value)}
        aria-label="تحديد الصف"
      />
    ),
    enableSorting: false,
    enableHiding: false,
  },
  {
    accessorKey: "issue",
    header: "المشكلة",
  },
  {
    accessorKey: "asset",
    header: "الأصل",
  },
  {
    accessorKey: "status",
    header: "الحالة",
    cell: ({ row }) => {
      const status = row.original.status;
      return <Badge variant={statusVariantMap[status]}>{statusTextMap[status]}</Badge>;
    },
  },
  {
    accessorKey: "priority",
    header: "الأولوية",
    cell: ({ row }) => {
      const priority = row.original.priority;
      return <Badge variant={priorityVariantMap[priority]}>{priorityTextMap[priority]}</Badge>;
    },
  },
  {
    accessorKey: "technician",
    header: "الفني",
  },
  {
    accessorKey: "createdDate",
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          تاريخ الإنشاء
          <ArrowUpDown className="mr-2 h-4 w-4" />
        </Button>
      )
    },
  },
  {
    id: "actions",
    cell: ({ row }) => {
      const request = row.original;
      return (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="h-8 w-8 p-0">
              <span className="sr-only">فتح القائمة</span>
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>إجراءات</DropdownMenuLabel>
            <DropdownMenuItem
              onClick={() => navigator.clipboard.writeText(request.id)}
            >
              نسخ معرف الطلب
            </DropdownMenuItem>
            <DropdownMenuItem>عرض التفاصيل</DropdownMenuItem>
            <DropdownMenuItem>تعيين فني</DropdownMenuItem>
            <DropdownMenuItem>إغلاق الطلب</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      );
    },
  },
];
