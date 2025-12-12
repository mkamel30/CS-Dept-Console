
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
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";

export type RequestColumn = {
  id: string;
  customerId: string;
  posMachineId: string;
  machineModel: string;
  machineManufacturer: string;
  serialNumber: string;
  customerName: string;
  status: 'Open' | 'In Progress' | 'Closed' | 'Cancelled';
  priority: 'Low' | 'Medium' | 'High';
  technician: string;
  createdAt: string;
  complaint: string;
  actionTaken?: string;
  closingTimestamp?: string;
  usedParts?: { partId: string, partName: string, cost: number, withCost: boolean }[];
  receiptNumber?: string;
};

interface ColumnsProps {
  openDetailsDialog: (request: RequestColumn) => void;
  openAssignDialog: (request: RequestColumn) => void;
  openCloseDialog: (request: RequestColumn) => void;
  openCancelDialog: (requestId: string) => void;
  handlePrintReport: (request: RequestColumn) => void;
}

const statusVariantMap: Record<RequestColumn['status'], 'default' | 'secondary' | 'destructive' | 'outline'> = {
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


export const columns = ({ openDetailsDialog, openAssignDialog, openCloseDialog, openCancelDialog, handlePrintReport }: ColumnsProps): ColumnDef<RequestColumn>[] => [
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
    accessorKey: "id",
    header: "رقم الطلب",
  },
  {
    accessorKey: "customerName",
    header: "اسم العميل",
  },
  {
    accessorKey: "machineModel",
    header: "الموديل",
  },
    {
    accessorKey: "complaint",
    header: "الشكوى",
    cell: ({ row }) => {
        const complaint = row.original.complaint;
        return <div className="truncate max-w-xs">{complaint}</div>
    }
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
    accessorKey: "createdAt",
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
            <DropdownMenuItem onClick={() => openDetailsDialog(request)}>عرض التفاصيل</DropdownMenuItem>
            <DropdownMenuItem onClick={() => handlePrintReport(request)}>طباعة التقرير</DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => openAssignDialog(request)} disabled={request.status !== 'Open'}>تعيين فني</DropdownMenuItem>
            <DropdownMenuItem onClick={() => openCloseDialog(request)} disabled={request.status !== 'In Progress'}>إغلاق الطلب</DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => openCancelDialog(request.id)} className="text-destructive" disabled={request.status === 'Closed' || request.status === 'Cancelled'}>إلغاء الطلب</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      );
    },
  },
];

    