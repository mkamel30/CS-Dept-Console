
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


export type TechnicianColumn = {
  id: string;
  displayName: string;
  email: string;
  role: string;
};

interface ColumnsProps {
  openEditDialog: (technician: TechnicianColumn) => void;
  openDeleteDialog: (technicianId: string) => void;
}

const roleVariantMap: Record<string, 'default' | 'secondary' | 'destructive'> = {
  'Technician': 'secondary',
  'CustomerService': 'default',
  'Manager': 'default',
  'Admin': 'destructive',
};

const roleTextMap: Record<string, string> = {
    'Technician': 'فني',
    'CustomerService': 'خدمة عملاء',
    'Manager': 'مدير',
    'Admin': 'مسؤول'
};


export const columns = ({ openEditDialog, openDeleteDialog }: ColumnsProps): ColumnDef<TechnicianColumn>[] => [
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
    accessorKey: "displayName",
    header: "الاسم",
  },
  {
    accessorKey: "email",
    header: "البريد الإلكتروني",
     cell: ({ row }) => {
        return row.original.email || <span className="text-muted-foreground">غير مسجل</span>
    }
  },
  {
    accessorKey: "role",
    header: "الدور",
    cell: ({ row }) => {
        const role = row.original.role;
        return <Badge variant={roleVariantMap[role] || 'outline'}>{roleTextMap[role] || role}</Badge>
    }
  },
  {
    id: "actions",
    cell: ({ row }) => {
      const technician = row.original;
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
              onClick={() => navigator.clipboard.writeText(technician.id)}
            >
              نسخ معرف الفني
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => openEditDialog(technician)}>تعديل الدور</DropdownMenuItem>
            <DropdownMenuItem onClick={() => openDeleteDialog(technician.id)} className="text-destructive">حذف الفني</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      );
    },
  },
];

    