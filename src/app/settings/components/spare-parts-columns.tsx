
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

export type SparePartColumn = {
  id: string;
  partNumber?: string;
  name: string;
  compatibleModels: string[];
  defaultCost: number;
};

interface ColumnsProps {
  openEditDialog: (part: SparePartColumn) => void;
  openDeleteDialog: (partId: string) => void;
}

export const columns = ({ openEditDialog, openDeleteDialog }: ColumnsProps): ColumnDef<SparePartColumn>[] => [
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
    header: "اسم القطعة",
  },
  {
    accessorKey: "partNumber",
    header: "رقم القطعة (SKU)",
  },
  {
    accessorKey: "compatibleModels",
    header: "الموديلات المتوافقة",
    cell: ({ row }) => {
      const models = row.original.compatibleModels;
      return (
        <div className="flex flex-wrap gap-1">
          {models.map((model) => (
            <Badge key={model} variant="secondary">
              {model}
            </Badge>
          ))}
        </div>
      );
    },
  },
  {
    accessorKey: "defaultCost",
    header: "التكلفة (السعر)",
    cell: ({ row }) => {
        const amount = parseFloat(row.getValue("defaultCost"))
        const formatted = new Intl.NumberFormat("ar-EG", {
            style: "currency",
            currency: "EGP"
        }).format(amount);

        return <div className="font-medium">{formatted}</div>
    }
  },
  {
    id: "actions",
    cell: ({ row }) => {
      const part = row.original;
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
              onClick={() => navigator.clipboard.writeText(part.id)}
            >
              نسخ معرف القطعة
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => openEditDialog(part)}>تعديل</DropdownMenuItem>
            <DropdownMenuItem onClick={() => openDeleteDialog(part.id)} className="text-destructive">حذف</DropdownMenuItem>