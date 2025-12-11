
"use client";

import { useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
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

          if (!bkcode || !item.client_name || !item.address) {
            missingRequiredDataCount++;
          } else if (existingBkCodes.has(bkcode)) {
            duplicateCount++;
          } else {
            const newCustomer = {
              bkcode: bkcode,
              client_name: item.client_name.toString(),
              address: item.address.toString(),
              national_id: item.national_id?.toString() || '',
              supply_office: item.supply_office?.toString() || '',
              dept: item.dept?.toString() || '',
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
      { bkcode: "", client_name: "", address: "", national_id: "", supply_office: "", dept: "", contact_person: "", telephone_1: "", telephone_2: "", notes: ""},
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

  const onAddCustomerSubmit = async (values: z.infer<typeof formSchema>) => {
    if (!firestore) return;
    try {
      const customersCollection = collection(firestore, 'customers');
      // Check for duplicates
      const existingQuery = await getDocs(collection(firestore, "customers"));
      const existingBkCodes = new Set(existingQuery.docs.map(doc => doc.data().bkcode));
      if (existingBkCodes.has(values.bkcode)) {
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
                <form onSubmit={form.handleSubmit(onAddCustomerSubmit)} className="grid grid-cols-2 gap-4 py-4">
                   <FormField
                      control={form.control}
                      name="bkcode"
                      render={({ field }) => (
                        <FormItem className="col-span-1">
                          <FormLabel>رقم العميل (BKCODE) *</FormLabel>
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
                  <DialogFooter className="col-span-2">
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
};
