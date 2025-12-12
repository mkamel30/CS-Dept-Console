
"use client";

import { useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogClose,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

import { columns, type CustomerColumn } from "./columns";

interface CustomerClientProps {
  data: CustomerColumn[];
  isLoading: boolean;
}

const formSchema = z.object({
  bkcode: z.string().min(1, { message: "رقم العميل مطلوب." }),
  client_name: z.string().min(1, { message: "اسم العميل مطلوب." }),
  address: z.string().min(1, { message: "العنوان مطلوب." }),
  national_id: z.string().optional(),
  supply_office: z.string().optional(),
  dept: z.string().optional(),
  contact_person: z.string().optional(),
  telephone_1: z.string().optional(),
  telephone_2: z.string().optional(),
  notes: z.string().optional(),
});

export const CustomerClient: React.FC<CustomerClientProps> = ({ data, isLoading }) => {
  const { toast } = useToast();
  const firestore = useFirestore();
  const { user } = useUser();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [isAddCustomerOpen, setAddCustomerOpen] = useState(false);
  const [isConfirming, setIsConfirming] = useState(false);
  const [importData, setImportData] = useState<any[]>([]);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      bkcode: "",
      client_name: "",
      address: "",
      national_id: "",
      supply_office: "",
      dept: "",
      contact_person: "",
      telephone_1: "",
      telephone_2: "",
      notes: "",
    },
  });

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const XLSX = await import("xlsx");
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: "array" });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const json = XLSX.utils.sheet_to_json(worksheet) as any[];
        
        if (json.length === 0) {
            toast({ variant: "destructive", title: "ملف فارغ", description: "الملف الذي تم رفعه لا يحتوي على أي بيانات."});
            return;
        }

        setImportData(json);
        setIsConfirming(true);
      } catch (error) {
        console.error("Error reading file:", error);
        toast({
          variant: "destructive",
          title: "حدث خطأ",
          description: "فشلت قراءة الملف. يرجى التأكد من أن الملف بالتنسيق الصحيح.",
        });
      } finally {
         if(fileInputRef.current) {
            fileInputRef.current.value = "";
        }
      }
    };
    reader.readAsArrayBuffer(file);
  };
  
  const handleConfirmImport = async () => {
    setIsConfirming(false);
    if (!firestore || !user || !importData.length) {
        toast({
          variant: "destructive",
          title: "خطأ",
          description: "لا يمكن إتمام عملية الاستيراد.",
        });
        return;
    }

    setIsProcessing(true);
    setProgress(0);

    try {
      toast({
        title: "بدء المعالجة...",
        description: `جاري حفظ ${importData.length} سجل في قاعدة البيانات.`,
      });

      const customersCollection = collection(firestore, 'customers');
      const existingCustomersSnapshot = await getDocs(customersCollection);
      const existingBkCodes = new Set(existingCustomersSnapshot.docs.map(doc => doc.data().bkcode));

      let successCount = 0;
      let duplicateCount = 0;
      let missingRequiredDataCount = 0;
      
      for (let i = 0; i < importData.length; i++) {
        const item = importData[i];
        const bkcode = item["رقم العميل"]?.toString();

        if (!bkcode || !item["اسم العميل"] || !item["العنوان"]) {
          missingRequiredDataCount++;
        } else if (existingBkCodes.has(bkcode)) {
          duplicateCount++;
        } else {
          const newCustomer = {
            bkcode: bkcode,
            client_name: item["اسم العميل"].toString(),
            address: item["العنوان"].toString(),
            national_id: item["الرقم القومي"]?.toString() || '',
            supply_office: item["مكتب التموين"]?.toString() || '',
            dept: item["إدارة التموين"]?.toString() || '',
            contact_person: item["الشخص المسؤول"]?.toString() || '',
            telephone_1: item["رقم الهاتف 1"]?.toString() || '',
            telephone_2: item["رقم الهاتف 2"]?.toString() || '',
            notes: item["ملاحظات"]?.toString() || '',
          };
          
          addDocumentNonBlocking(customersCollection, newCustomer);
          successCount++;
          existingBkCodes.add(bkcode);
        }
        
        setProgress(((i + 1) / importData.length) * 100);
      }

      toast({
        title: "اكتمل الرفع بنجاح",
        description: `المجموع: ${importData.length}. | نجح: ${successCount} | مكرر: ${duplicateCount} | ناقص: ${missingRequiredDataCount}`,
        duration: 9000,
      });

    } catch (error) {
      console.error("Error processing file:", error);
      toast({
        variant: "destructive",
        title: "حدث خطأ",
        description: "فشلت معالجة الملف.",
      });
    } finally {
      setIsProcessing(false);
      setProgress(0);
      setImportData([]);
    }
  };

  const handleDownloadTemplate = async () => {
    const XLSX = await import("xlsx");
    const ws_data = [
      ["رقم العميل", "اسم العميل", "العنوان", "الرقم القومي", "مكتب التموين", "إدارة التموين", "الشخص المسؤول", "رقم الهاتف 1", "رقم الهاتف 2", "ملاحظات"]
    ];
    const ws = XLSX.utils.aoa_to_sheet(ws_data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Customers");
    XLSX.writeFile(wb, "Customers_Template.xlsx");
  };

  const handleExportData = async () => {
     const XLSX = await import("xlsx");
     const exportData = data.map(d => ({
        "رقم العميل": d.bkcode,
        "اسم العميل": d.client_name,
        "العنوان": d.address,
        "رقم الهاتف": d.telephone_1
     }));
     const ws = XLSX.utils.json_to_sheet(exportData);
     const wb = XLSX.utils.book_new();
     XLSX.utils.book_append_sheet(wb, ws, "Current Customers");
     XLSX.writeFile(wb, "Current_Customers_Data.xlsx");
  };

  const onAddCustomerSubmit = async (values: z.infer<typeof formSchema>) => {
    if (!firestore) return;
    try {
      const customersCollection = collection(firestore, 'customers');
      // Check for duplicates
      const existingQuery = await getDocs(query(collection(firestore, "customers"), where("bkcode", "==", values.bkcode)));
      if (!existingQuery.empty) {
        toast({
          variant: "destructive",
          title: "رقم العميل موجود بالفعل",
          description: "هذا الرقم مسجل لعميل آخر. يرجى استخدام رقم فريد.",
        });
        return;
      }
      
      addDocumentNonBlocking(customersCollection, values);
      toast({
        title: "تمت إضافة العميل بنجاح",
        description: `تم حفظ العميل ${values.client_name} في قاعدة البيانات.`,
      });
      form.reset();
      setAddCustomerOpen(false);
    } catch (error) {
      console.error("Error adding customer:", error);
      toast({
        variant: "destructive",
        title: "حدث خطأ",
        description: "فشلت عملية إضافة العميل. يرجى المحاولة مرة أخرى.",
      });
    }
  };

  return (
    <>
      <Dialog open={isConfirming} onOpenChange={setIsConfirming}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>تأكيد الاستيراد</DialogTitle>
            <DialogDescription>
              تم العثور على {importData.length} سجل. هل تريد تأكيد استيراد هذه البيانات؟
            </DialogDescription>
          </DialogHeader>
          <div className="max-h-[50vh] overflow-y-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>رقم العميل</TableHead>
                  <TableHead>اسم العميل</TableHead>
                  <TableHead>العنوان</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {importData.slice(0, 5).map((item, index) => (
                  <TableRow key={index}>
                    <TableCell>{item['رقم العميل'] || 'N/A'}</TableCell>
                    <TableCell>{item['اسم العميل'] || 'N/A'}</TableCell>
                    <TableCell>{item['العنوان'] || 'N/A'}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline" onClick={() => setImportData([])}>إلغاء</Button>
            </DialogClose>
            <Button onClick={handleConfirmImport}>تأكيد الاستيراد</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold tracking-tight">العملاء ({data.length})</h2>
        <div className="flex items-center space-x-2">
          <Dialog open={isAddCustomerOpen} onOpenChange={setAddCustomerOpen}>
            <DialogTrigger asChild>
              <Button disabled={isLoading || isProcessing}>
                <PlusCircle className="ml-2 h-4 w-4" />
                إضافة عميل يدوياً
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-2xl">
              <DialogHeader>
                <DialogTitle>إضافة عميل جديد</DialogTitle>
                <DialogDescription>
                  املأ الحقول التالية لحفظ بيانات عميل جديد. الحقول المعلمة بـ * إجبارية.
                </DialogDescription>
              </DialogHeader>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onAddCustomerSubmit)}>
                  <div className="max-h-[60vh] overflow-y-auto p-4">
                    <div className="grid grid-cols-2 gap-4">
                      <FormField
                          control={form.control}
                          name="bkcode"
                          render={({ field }) => (
                            <FormItem className="col-span-1">
                              <FormLabel>رقم العميل *</FormLabel>
                              <FormControl>
                                <Input placeholder="e.g. 12345" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      <FormField
                          control={form.control}
                          name="client_name"
                          render={({ field }) => (
                            <FormItem className="col-span-1">
                              <FormLabel>اسم العميل *</FormLabel>
                              <FormControl>
                                <Input placeholder="اسم العميل بالكامل" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name="address"
                          render={({ field }) => (
                            <FormItem className="col-span-2">
                              <FormLabel>العنوان *</FormLabel>
                              <FormControl>
                                <Textarea placeholder="عنوان العميل بالتفصيل" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name="national_id"
                          render={({ field }) => (
                            <FormItem className="col-span-1">
                              <FormLabel>الرقم القومي</FormLabel>
                              <FormControl>
                                <Input placeholder="14 رقم" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name="telephone_1"
                          render={({ field }) => (
                            <FormItem className="col-span-1">
                              <FormLabel>رقم الهاتف 1</FormLabel>
                              <FormControl>
                                <Input placeholder="رقم الهاتف الأساسي" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name="supply_office"
                          render={({ field }) => (
                            <FormItem className="col-span-1">
                              <FormLabel>مكتب التموين</FormLabel>
                              <FormControl>
                                <Input placeholder="اسم مكتب التموين" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name="dept"
                          render={({ field }) => (
                            <FormItem className="col-span-1">
                              <FormLabel>إدارة التموين</FormLabel>
                              <FormControl>
                                <Input placeholder="اسم الإدارة" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name="contact_person"
                          render={({ field }) => (
                            <FormItem className="col-span-1">
                              <FormLabel>الشخص المسؤول</FormLabel>
                              <FormControl>
                                <Input placeholder="اسم الشخص المسؤول" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name="telephone_2"
                          render={({ field }) => (
                            <FormItem className="col-span-1">
                              <FormLabel>رقم الهاتف 2</FormLabel>
                              <FormControl>
                                <Input placeholder="رقم هاتف إضافي" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name="notes"
                          render={({ field }) => (
                            <FormItem className="col-span-2">
                              <FormLabel>ملاحظات</FormLabel>
                              <FormControl>
                                <Textarea placeholder="أي ملاحظات إضافية عن العميل" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                    </div>
                  </div>
                  <DialogFooter className="pt-4">
                    <DialogClose asChild>
                      <Button type="button" variant="outline">إلغاء</Button>
                    </DialogClose>
                    <Button type="submit" disabled={form.formState.isSubmitting}>
                      {form.formState.isSubmitting && <Loader2 className="ml-2 h-4 w-4 animate-spin" />}
                      إنشاء العميل
                    </Button>
                  </DialogFooter>
                </form>
              </Form>
            </DialogContent>
          </Dialog>

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
          searchPlaceholder="بحث برقم العميل أو اسم العميل..." 
        />
      )}
    </>
  );
}

    