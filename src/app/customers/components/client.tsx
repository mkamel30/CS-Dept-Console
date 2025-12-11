
"use client";

import { useRef, useState } from "react";
import { PlusCircle, Upload, Download, Loader2 } from "lucide-react";
import { collection, getDocs } from "firebase/firestore";

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

import { columns, type CustomerColumn } from "./columns";

interface CustomerClientProps {
  data: CustomerColumn[];
  isLoading: boolean;
}

export const CustomerClient: React.FC<CustomerClientProps> = ({ data, isLoading }) => {
  const { toast } = useToast();
  const firestore = useFirestore();
  const { user } = useUser();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);

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

        const customersCollection = collection(firestore, 'customers');
        const existingCustomersSnapshot = await getDocs(customersCollection);
        const existingBkCodes = new Set(existingCustomersSnapshot.docs.map(doc => doc.data().bkcode));

        let successCount = 0;
        let duplicateCount = 0;
        let missingRequiredDataCount = 0;
        
        for (let i = 0; i < json.length; i++) {
          const item = json[i];
          const bkcode = item.bkcode?.toString();

          if (!bkcode || !item.client_name || !item.address || !item.national_id) {
            missingRequiredDataCount++;
          } else if (existingBkCodes.has(bkcode)) {
            duplicateCount++;
          } else {
            const newCustomer = {
              bkcode: bkcode,
              client_name: item.client_name.toString(),
              address: item.address.toString(),
              national_id: item.national_id.toString(),
              supply_office: item.supply_office?.toString() || '',
              contact_person: item.contact_person?.toString() || '',
              telephone_1: item.telephone_1?.toString() || '',
              telephone_2: item.telephone_2?.toString() || '',
              notes: item.notes?.toString() || '',
            };
            
            addDocumentNonBlocking(customersCollection, newCustomer);
            successCount++;
            existingBkCodes.add(bkcode);
          }
          
          setProgress(((i + 1) / json.length) * 100);
        }

        toast({
          title: "اكتمل الرفع بنجاح",
          description: `المجموع: ${json.length}. | نجح: ${successCount} | مكرر: ${duplicateCount} | ناقص: ${missingRequiredDataCount}`,
          duration: 9000,
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
      { bkcode: "", client_name: "", address: "", national_id: "", supply_office: "", contact_person: "", telephone_1: "", telephone_2: "", notes: ""},
    ]);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Customers");
    XLSX.writeFile(wb, "Customers_Template.xlsx");
  };

  const handleExportData = async () => {
     const XLSX = await import("xlsx");
     const ws = XLSX.utils.json_to_sheet(data);
     const wb = XLSX.utils.book_new();
     XLSX.utils.book_append_sheet(wb, ws, "Current Customers");
     XLSX.writeFile(wb, "Current_Customers_Data.xlsx");
  };

  return (
    <>
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold tracking-tight">العملاء ({data.length})</h2>
        <div className="flex items-center space-x-2">
          <Button disabled={isLoading || isProcessing}>
            <PlusCircle className="ml-2 h-4 w-4" />
            إضافة عميل يدوياً
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
        <DataTable 
          searchKeys={["bkcode", "client_name"]} 
          columns={columns} 
          data={data} 
          searchPlaceholder="بحث بالـ BKCODE أو اسم العميل..." 
        />
      )}
    </>
  );
};
