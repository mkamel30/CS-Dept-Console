
"use client";

import { useRef } from "react";
import { PlusCircle, Upload, Download, Loader2 } from "lucide-react";
import { collection } from "firebase/firestore";

import { Button } from "@/components/ui/button";
import { DataTable } from "@/components/ui/data-table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useToast } from "@/hooks/use-toast";
import { useFirestore, addDocumentNonBlocking } from "@/firebase";
import { machineParameters } from "@/lib/data";

import { columns, type PosMachineColumn } from "./columns";

interface PosMachineClientProps {
  data: PosMachineColumn[];
  isLoading: boolean;
}

export const PosMachineClient: React.FC<PosMachineClientProps> = ({ data, isLoading }) => {
  const { toast } = useToast();
  const firestore = useFirestore();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const getMachineDetailsFromSerial = (serial: string) => {
    const matchingParam = machineParameters.find(p => serial.startsWith(p.prefix));
    return matchingParam || { model: 'غير معروف', manufacturer: 'غير معروف' };
  }

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !firestore) {
        toast({
          variant: "destructive",
          title: "خطأ",
          description: "لا يمكن الاتصال بقاعدة البيانات. الرجاء المحاولة مرة أخرى.",
        });
        return;
    }

    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const XLSX = await import("xlsx");
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: "array" });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const json = XLSX.utils.sheet_to_json(worksheet) as any[];

        toast({
          title: "بدء المعالجة...",
          description: `تم العثور على ${json.length} سجل. جاري الحفظ في قاعدة البيانات.`,
        });

        const machinesCollection = collection(firestore, 'posMachines');
        let successCount = 0;

        for (const item of json) {
          const serial = item.serialNumber || item.POS;
          if (!serial || !item.posId || !item.customerId) {
            console.warn("Skipping row due to missing data:", item);
            continue;
          }
          
          const details = getMachineDetailsFromSerial(serial.toString());

          const newMachine = {
            serialNumber: serial.toString(),
            posId: item.posId.toString(),
            customerId: item.customerId.toString(),
            model: details.model,
            manufacturer: details.manufacturer,
            isMain: item.isMain === 'yes' || item.isMain === true,
          };
          
          await addDocumentNonBlocking(machinesCollection, newMachine);
          successCount++;
        }

        toast({
          title: "اكتمل الرفع بنجاح",
          description: `تم حفظ ${successCount} من أصل ${json.length} ماكينة.`,
        });

      } catch (error) {
        console.error("Error processing file:", error);
        toast({
          variant: "destructive",
          title: "حدث خطأ",
          description: "فشلت معالجة الملف. يرجى التأكد من أن الملف بالتنسيق الصحيح.",
        });
      }
    };
    reader.readAsArrayBuffer(file);
    
    // Reset file input
    if(fileInputRef.current) {
        fileInputRef.current.value = "";
    }
  };

  const handleDownloadTemplate = async () => {
    const XLSX = await import("xlsx");
    const ws = XLSX.utils.json_to_sheet([
      { serialNumber: "", posId: "", customerId: "", isMain: "no" },
    ]);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Machines");
    XLSX.writeFile(wb, "PosMachines_Template.xlsx");
  };

  const handleExportData = async () => {
     const XLSX = await import("xlsx");
     const ws = XLSX.utils.json_to_sheet(data);
     const wb = XLSX.utils.book_new();
     XLSX.utils.book_append_sheet(wb, ws, "Current Machines");
     XLSX.writeFile(wb, "Current_PosMachines_Data.xlsx");
  };

  return (
    <>
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold tracking-tight">ماكينات نقاط البيع ({data.length})</h2>
        <div className="flex items-center space-x-2">
          <Button disabled={isLoading}>
            <PlusCircle className="ml-2 h-4 w-4" />
            إضافة ماكينة يدوياً
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" disabled={isLoading}>
                <Upload className="ml-2 h-4 w-4" />
                استيراد / تصدير
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuLabel>خيارات البيانات</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleDownloadTemplate}>
                <Download className="ml-2 h-4 w-4" />
                تنزيل قالب Excel
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => fileInputRef.current?.click()}>
                <Upload className="ml-2 h-4 w-4" />
                رفع ملف Excel
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleExportData} disabled={data.length === 0}>
                <Download className="ml-2 h-4 w-4" />
                تصدير البيانات الحالية
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileUpload}
            className="hidden"
            accept=".xlsx, .xls, .csv"
          />
        </div>
      </div>
      {isLoading ? (
          <div className="flex items-center justify-center p-10">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <p className="mr-4 text-muted-foreground">...جاري تحميل البيانات</p>
          </div>
      ) : (
        <DataTable searchKey="serialNumber" columns={columns} data={data} searchPlaceholder="بحث بالرقم التسلسلي..." />
      )}
    </>
  );
};
