
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
import { Customer } from "@/lib/types";

export type CustomerColumn = Omit<Customer, 'operating_date' | 'papers_date'> & {
    operating_date?: string;
    papers_date?: string;
};

interface ColumnsProps {
  openEditDialog: (customer: CustomerColumn) => void;
  openDeleteDialog: (customerId: string) => void;
}

export const columns = ({ openEditDialog, openDeleteDialog }: ColumnsProps): ColumnDef<CustomerColumn>[] => [
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
    accessorKey: "bkcode",
    header: "رقم العميل",
  },
  {
    accessorKey: "client_name",
    header: "اسم العميل",
  },
  {
    accessorKey: "address",
    header: "العنوان",
  },
  {
    accessorKey: "telephone_1",
    header: "رقم الهاتف",
  },
  {
    id: "actions",
    cell: ({ row }) => {
      const customer = row.original;
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
              onClick={() => navigator.clipboard.writeText(customer.id)}
            >
              نسخ معرف العميل
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => openEditDialog(customer)}>تعديل</DropdownMenuItem>
            <DropdownMenuItem onClick={() => openDeleteDialog(customer.id)} className="text-destructive">حذف</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      );
    },
  },
];

    