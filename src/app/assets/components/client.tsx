
"use client";

import { useRef, useState } from "react";
import { PlusCircle, Upload, Download, Loader2 } from "lucide-react";
import { collection, getDocs, query, where } from "firebase/firestore";

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
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import { useFirestore, addDocumentNonBlocking, useUser } from "@/firebase";
import { machineParameters } from "@/lib/data";

import { columns, type PosMachineColumn } from "./columns";

interface PosMachineClientProps {
  data: PosMachineColumn[];
  isLoading: boolean;
}

export const PosMachineClient: React.FC<PosMachineClientProps> = ({ data, isLoading }) => {
  const { toast } = useToast();
  const firestore = useFirestore();
  const { user } = useUser();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);

  const getMachineDetailsFromSerial = (serial: string) => {
    const matchingParam = machineParameters.find(p => serial.startsWith(p.prefix));
    return matchingParam || { model: 'غير معروف', manufacturer: 'غير معروف' };
  }

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!firestore || !user) {
        toast({
          variant: "destructive",
          title: "خطأ",
          description: "يجب تسجيل الدخول أولاً. لا يمكن الاتصال بقاعدة البيانات.",
        });
        return;
    }

    setIsProcessing(true);
    setProgress(0);

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

        // Fetch existing serial numbers for duplicate checking
        const machinesCollection = collection(firestore, 'posMachines');
        const existingMachinesSnapshot = await getDocs(machinesCollection);
        const existingSerials = new Set(existingMachinesSnapshot.docs.map(doc => doc.data().serialNumber));

        let successCount = 0;
        let duplicateCount = 0;
        let missingDataCount = 0;

        for (let i = 0; i < json.length; i++) {
          const item = json[i];
          const serial = item.serialNumber || item.POS;

          if (!serial || !item.posId || !item.customerId) {
            missingDataCount++;
          } else if (existingSerials.has(serial.toString())) {
            duplicateCount++;
          } else {
            const details = getMachineDetailsFromSerial(serial.toString());

            const newMachine = {
              serialNumber: serial.toString(),
              posId: item.posId.toString(),
              customerId: item.customerId.toString(),
              model: details.model,
              manufacturer: details.manufacturer,
              isMain: item.isMain === 'yes' || item.isMain === true,
            };
            
            addDocumentNonBlocking(machinesCollection, newMachine);
            successCount++;
            existingSerials.add(serial.toString()); // Add to set to prevent duplicates within the same file
          }
          
          setProgress(((i + 1) / json.length) * 100);
        }

        toast({
          title: "اكتمل الرفع بنجاح",
          description: `المجموع: ${json.length}. | نجح: ${successCount} | مكرر: ${duplicateCount} | ناقص: ${missingDataCount}`,
          duration: 7000,
        });

      } catch (error) {
        console.error("Error processing file:", error);
        toast({
          variant: "destructive",
          title: "حدث خطأ",
          description: "فشلت معالجة الملف. يرجى التأكد من أن الملف بالتنسيق الصحيح.",
        });
      } finally {
        setIsProcessing(false);
        setProgress(0);
        // Reset file input
        if(fileInputRef.current) {
            fileInputRef.current.value = "";
        }
      }
    };
    reader.readAsArrayBuffer(file);
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
          <Button disabled={isLoading || isProcessing}>
            <PlusCircle className="ml-2 h-4 w-4" />
            إضافة ماكينة يدوياً
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" disabled={isLoading || isProcessing}>
                {isProcessing ? <Loader2 className="ml-2 h-4 w-4 animate-spin" /> : <Upload className="ml-2 h-4 w-4" />}
                استيراد / تصدير
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuLabel>خيارات البيانات</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleDownloadTemplate} disabled={isProcessing}>
                <Download className="ml-2 h-4 w-4" />
                تنزيل قالب Excel
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => fileInputRef.current?.click()} disabled={isProcessing}>
                <Upload className="ml-2 h-4 w-4" />
                رفع ملف Excel
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleExportData} disabled={data.length === 0 || isProcessing}>
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
            disabled={isProcessing}
          />
        </div>
      </div>
      
      {isProcessing && (
          <div className="w-full space-y-2 pt-4">
              <p className="text-sm text-muted-foreground">جاري معالجة الملف... {Math.round(progress)}%</p>
              <Progress value={progress} className="w-full" />
          </div>
      )}

      {isLoading && !isProcessing ? (
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
