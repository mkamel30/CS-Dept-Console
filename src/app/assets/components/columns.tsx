
"use client";

import { ColumnDef } from "@tanstack/react-table";
import { MoreHorizontal } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";

export type PosMachineColumn = {
  id: string;
  serialNumber: string;
  posId: string;
  model: string;
  manufacturer: string;
  customerId: string;
  isMain?: boolean;
};

interface ColumnsProps {
  openEditDialog: (machine: PosMachineColumn) => void;
  openDeleteDialog: (machineId: string) => void;
}

export const columns = ({ openEditDialog, openDeleteDialog }: ColumnsProps): ColumnDef<PosMachineColumn>[] => [
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
    accessorKey: "serialNumber",
    header: "الرقم التسلسلي",
  },
  {
    accessorKey: "posId",
    header: "معرف النظام (POS ID)",
  },
  {
    accessorKey: "model",
    header: "الموديل",
  },
  {
    accessorKey: "manufacturer",
    header: "المصنع",
  },
  {
    accessorKey: "customerId",
    header: "رقم العميل",
  },
  {
    accessorKey: "isMain",
    header: "رئيسية",
    cell: ({ row }) => {
      return row.original.isMain ? <Badge>نعم</Badge> : <Badge variant="outline">لا</Badge>;
    },
  },
  {
    id: "actions",
    cell: ({ row }) => {
      const machine = row.original;
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
              onClick={() => navigator.clipboard.writeText(machine.id)}
            >
              نسخ معرف الماكينة
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => openEditDialog(machine)}>تعديل</DropdownMenuItem>
            <DropdownMenuItem onClick={() => openDeleteDialog(machine.id)} className="text-destructive">حذف</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      );
    },
  },
];

    