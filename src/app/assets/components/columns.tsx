"use client";

import { ColumnDef } from "@tanstack/react-table";
import { MoreHorizontal } from "lucide-react";

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

export type AssetColumn = {
  id: string;
  name: string;
  type: string;
  location: string;
  status: 'Operational' | 'Under Maintenance' | 'Decommissioned';
  lastMaintenance: string;
};

const statusVariantMap: Record<AssetColumn['status'], 'default' | 'secondary' | 'destructive'> = {
  'Operational': 'default',
  'Under Maintenance': 'secondary',
  'Decommissioned': 'destructive',
};

const statusTextMap: Record<AssetColumn['status'], string> = {
    'Operational': 'يعمل',
    'Under Maintenance': 'تحت الصيانة',
    'Decommissioned': 'خارج الخدمة'
};


export const columns: ColumnDef<AssetColumn>[] = [
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
    accessorKey: "name",
    header: "اسم الأصل",
  },
  {
    accessorKey: "type",
    header: "النوع",
  },
  {
    accessorKey: "location",
    header: "الموقع",
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
    accessorKey: "lastMaintenance",
    header: "آخر صيانة",
  },
  {
    id: "actions",
    cell: ({ row }) => {
      const asset = row.original;
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
              onClick={() => navigator.clipboard.writeText(asset.id)}
            >
              نسخ معرف الأصل
            </DropdownMenuItem>
            <DropdownMenuItem>عرض التفاصيل</DropdownMenuItem>
            <DropdownMenuItem>تعديل الأصل</DropdownMenuItem>
            <DropdownMenuItem>حذف الأصل</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      );
    },
  },
];
