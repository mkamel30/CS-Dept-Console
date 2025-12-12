
"use client";

import { ColumnDef } from "@tanstack/react-table";
import { MoreHorizontal } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";

export type InventoryColumn = {
  id: string;
  partId: string;
  partName: string;
  partNumber?: string;
  quantity: number;
  minLevel: number;
  location: string;
};

export const columns: ColumnDef<InventoryColumn>[] = [
  {
    accessorKey: "partName",
    header: "اسم القطعة",
  },
  {
    accessorKey: "partNumber",
    header: "رقم القطعة (SKU)",
  },
  {
    accessorKey: "quantity",
    header: "الكمية المتاحة",
    cell: ({ row }) => {
        const quantity = row.original.quantity;
        const minLevel = row.original.minLevel;
        const variant = quantity <= minLevel ? "destructive" : "default";

        return <Badge variant={variant}>{quantity}</Badge>
    }
  },
  {
    accessorKey: "minLevel",
    header: "الحد الأدنى للطلب",
  },
  {
    accessorKey: "location",
    header: "الموقع بالمخزن",
  },
  {
    id: "actions",
    cell: ({ row }) => {
      const item = row.original;
      return (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="h-8 w-8 p-0">
              <span className="sr-only">فتح القائمة</span>
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>إجراءات المخزن</DropdownMenuLabel>
            <DropdownMenuItem>تعديل الكمية</DropdownMenuItem>
            <DropdownMenuItem>تغيير الموقع</DropdownMenuItem>
            <DropdownMenuItem className="text-destructive">حذف من المخزن</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      );
    },
  },
];
