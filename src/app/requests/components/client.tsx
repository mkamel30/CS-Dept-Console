"use client";

import { useState } from "react";
import { PlusCircle, Upload, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DataTable } from "@/components/ui/data-table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

import { columns, type RequestColumn } from "./columns";

interface RequestClientProps {
  data: RequestColumn[];
}

export const RequestClient: React.FC<RequestClientProps> = ({ data }) => {
  return (
    <>
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold tracking-tight">طلبات الصيانة ({data.length})</h2>
        <div className="flex items-center space-x-2">
          <Button>
            <PlusCircle className="ml-2 h-4 w-4" />
            طلب صيانة جديد
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline">
                <Upload className="ml-2 h-4 w-4" />
                استيراد / تصدير
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuLabel>خيارات البيانات</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem>
                <Download className="ml-2 h-4 w-4" />
                تنزيل قالب Excel
              </DropdownMenuItem>
              <DropdownMenuItem>
                <Upload className="ml-2 h-4 w-4" />
                رفع ملف Excel
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem>
                <Download className="ml-2 h-4 w-4" />
                تصدير البيانات الحالية
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
      <DataTable searchKey="issue" columns={columns} data={data} searchPlaceholder="بحث عن مشكلة..." />
    </>
  );
};
