
"use client";

import { useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { PlusCircle, Loader2, Upload, Download } from "lucide-react";
import { collection, where, query, getDocs, doc, writeBatch } from "firebase/firestore";

import { Button } from "@/components/ui/button";
import { DataTable } from "@/components/ui/data-table";
import { useToast } from "@/hooks/use-toast";
import { useFirestore, addDocumentNonBlocking, updateDocumentNonBlocking, deleteDocumentNonBlocking, useUser } from "@/firebase";
import { SparePart, InventoryItem } from "@/lib/types";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogClose,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Progress } from "@/components/ui/progress";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";


import { columns, type InventoryColumn } from "./columns";

interface WarehouseClientProps {
  data: InventoryColumn[];
  spareParts: SparePart[];
  isLoading: boolean;
}

const formSchema = z.object({
  partId: z.string().min(1, { message: "يجب اختيار قطعة غيار." }),
  quantity: z.coerce.number().min(0, { message: "الكمية يجب أن تكون رقمًا موجبًا."}),
  minLevel: z.coerce.number().min(0, { message: "الحد الأدنى يجب أن يكون رقمًا موجبًا."}),
  location: z.string().optional(),
});

const editFormSchema = z.object({
    quantity: z.coerce.number().min(0, { message: "الكمية يجب أن تكون رقمًا موجبًا."}),
    minLevel: z.coerce.number().min(0, { message: "الحد الأدنى يجب أن يكون رقمًا موجبًا."}),
    location: z.string().optional(),
});

export const WarehouseClient: React.FC<WarehouseClientProps> = ({ data, spareParts, isLoading }) => {
  const { toast } = useToast();
  const firestore = useFirestore();
  const { user } = useUser();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);

  const [isAddItemOpen, setAddItemOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<InventoryColumn | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [deletingItemId, setDeletingItemId] = useState<string | null>(null);
  const [isConfirming, setIsConfirming] = useState(false);
  const [importData, setImportData] = useState<any[]>([]);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      partId: "",
      quantity: 0,
      minLevel: 1,
      location: "",
    },
  });

  const editForm = useForm<z.infer<typeof editFormSchema>>({
    resolver: zodResolver(editFormSchema),
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
        
        const validData = json.filter(item => item.quantity && Number(item.quantity) > 0);
        
        if (validData.length === 0) {
            toast({ variant: "destructive", title: "لا توجد كميات", description: "لم يتم العثور على كميات صالحة للتحديث في الملف."});
            return;
        }

        setImportData(validData);
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
        toast({ variant: "destructive", title: "خطأ", description: "لا يمكن إتمام عملية الاستيراد." });
        return;
    }

    setIsProcessing(true);
    setProgress(0);

    try {
        toast({
            title: "بدء تحديث المخزون...",
            description: `جاري تحديث ${importData.length} عنصر.`,
        });

        const inventoryCollection = collection(firestore, 'inventory');
        const inventorySnapshot = await getDocs(inventoryCollection);
        const inventoryMap = new Map(inventorySnapshot.docs.map(doc => [doc.data().partId, { id: doc.id, ...doc.data() } as InventoryItem]));
        
        const batch = writeBatch(firestore);

        for (let i = 0; i < importData.length; i++) {
            const item = importData[i];
            const partId = item.partId?.toString();
            const quantity = Number(item.quantity);

            if (!partId || isNaN(quantity) || quantity <= 0) {
                continue;
            }

            const existingItem = inventoryMap.get(partId);

            if (existingItem) {
                // Update existing item
                const itemRef = doc(firestore, 'inventory', existingItem.id);
                batch.update(itemRef, { quantity });
            } else {
                // Create new item
                const newItemRef = doc(inventoryCollection);
                const partDetails = spareParts.find(p => p.id === partId);
                batch.set(newItemRef, {
                    partId: partId,
                    quantity: quantity,
                    minLevel: 1, // Default minLevel
                    location: partDetails?.name || '', // Default location
                });
            }
             setProgress(((i + 1) / importData.length) * 100);
        }

        await batch.commit();

        toast({
            title: "اكتمل تحديث المخزون بنجاح",
            description: `تم تحديث وإنشاء ${importData.length} عنصر في المخزن.`,
            duration: 9000,
        });

    } catch (error) {
        console.error("Error processing file:", error);
        toast({ variant: "destructive", title: "حدث خطأ", description: "فشلت معالجة الملف." });
    } finally {
        setIsProcessing(false);
        setProgress(0);
        setImportData([]);
    }
};

  const handleDownloadTemplate = async () => {
    if (spareParts.length === 0) {
      toast({ variant: "destructive", title: "لا توجد قطع غيار", description: "يجب تعريف قطع الغيار أولاً من صفحة الإعدادات." });
      return;
    }
    const XLSX = await import("xlsx");
    const templateData = spareParts.map(part => ({
        partId: part.id,
        partName: part.name,
        partNumber: part.partNumber || 'N/A',
        quantity: ''
    }));

    const ws = XLSX.utils.json_to_sheet(templateData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Inventory Update");
    XLSX.writeFile(wb, "InventoryUpdate_Template.xlsx");
  };

  const onAddItemSubmit = async (values: z.infer<typeof formSchema>) => {
    if (!firestore) return;
    try {
      const inventoryCollection = collection(firestore, 'inventory');
      
      const q = query(inventoryCollection, where("partId", "==", values.partId));
      const querySnapshot = await getDocs(q);
      
      if (!querySnapshot.empty) {
        toast({
          variant: "destructive",
          title: "قطعة غيار موجودة بالفعل",
          description: "هذه القطعة موجودة بالفعل في المخزن. يمكنك تعديل كميتها من القائمة الرئيسية.",
        });
        return;
      }
      
      addDocumentNonBlocking(inventoryCollection, values);
      const partName = spareParts.find(p => p.id === values.partId)?.name;
      toast({
        title: "تمت الإضافة للمخزن بنجاح",
        description: `تم حفظ ${partName} في المخزن.`,
      });
      form.reset();
      setAddItemOpen(false);
    } catch (error) {
      console.error("Error adding to inventory:", error);
      toast({
        variant: "destructive",
        title: "حدث خطأ",
        description: "فشلت عملية إضافة العنصر للمخزن.",
      });
    }
  };

  const onEditItemSubmit = async (values: z.infer<typeof editFormSchema>) => {
    if (!firestore || !editingItem) return;
    try {
      const itemDoc = doc(firestore, 'inventory', editingItem.id);
      updateDocumentNonBlocking(itemDoc, values);
      toast({ title: "تم تحديث العنصر بنجاح" });
      setIsEditDialogOpen(false);
      setEditingItem(null);
    } catch (error) {
      console.error("Error updating inventory item:", error);
      toast({ variant: "destructive", title: "حدث خطأ", description: "فشل تحديث العنصر." });
    }
  };

  const openEditDialog = (item: InventoryColumn) => {
    setEditingItem(item);
    editForm.reset({
        quantity: item.quantity,
        minLevel: item.minLevel,
        location: item.location,
    });
    setIsEditDialogOpen(true);
  };
  
  const openDeleteDialog = (itemId: string) => {
    setDeletingItemId(itemId);
    setIsDeleteDialogOpen(true);
  };

  const confirmDelete = () => {
    if (!firestore || !deletingItemId) return;
    const itemDoc = doc(firestore, 'inventory', deletingItemId);
    deleteDocumentNonBlocking(itemDoc);
    toast({ title: "تم الحذف من المخزن" });
    setIsDeleteDialogOpen(false);
    setDeletingItemId(null);
  };

  return (
    <>
      <Dialog open={isConfirming} onOpenChange={setIsConfirming}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>تأكيد استيراد الكميات</DialogTitle>
            <DialogDescription>
              تم العثور على {importData.length} عنصر لتحديث كمياتهم. هل تريد تأكيد العملية؟
            </DialogDescription>
          </DialogHeader>
          <div className="max-h-[50vh] overflow-y-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>اسم القطعة</TableHead>
                  <TableHead>الكمية الجديدة</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {importData.slice(0, 10).map((item, index) => (
                  <TableRow key={index}>
                    <TableCell>{item.partName || 'N/A'}</TableCell>
                    <TableCell>{item.quantity || 'N/A'}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
             {importData.length > 10 && <p className="text-center text-sm text-muted-foreground mt-2">... والمزيد</p>}
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
        <h2 className="text-3xl font-bold tracking-tight">إدارة المخزن ({data.length})</h2>
        <div className="flex items-center space-x-2">
           <Dialog open={isAddItemOpen} onOpenChange={setAddItemOpen}>
            <DialogTrigger asChild>
              <Button disabled={isLoading || spareParts.length === 0}>
                <PlusCircle className="ml-2 h-4 w-4" />
                إضافة عنصر للمخزن
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>إضافة عنصر جديد للمخزن</DialogTitle>
                <DialogDescription>
                  اختر قطعة غيار وأدخل الكمية الأولية والموقع.
                </DialogDescription>
              </DialogHeader>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onAddItemSubmit)} className="space-y-4">
                  <FormField
                    control={form.control}
                    name="partId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>قطعة الغيار *</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="اختر قطعة غيار لإضافتها" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {spareParts.map((part) => (
                              <SelectItem key={part.id} value={part.id}>
                                {part.name} - متوافقة مع: {part.compatibleModels.join(', ')}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="quantity"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>الكمية الحالية *</FormLabel>
                          <FormControl>
                            <Input type="number" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="minLevel"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>أقل كمية *</FormLabel>
                          <FormControl>
                            <Input type="number" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  <FormField
                    control={form.control}
                    name="location"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>الموقع في المخزن</FormLabel>
                        <FormControl>
                          <Input placeholder="e.g. Shelf A-1, Row 3" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <DialogFooter className="pt-4">
                    <DialogClose asChild>
                      <Button type="button" variant="outline">إلغاء</Button>
                    </DialogClose>
                    <Button type="submit" disabled={form.formState.isSubmitting}>
                      {form.formState.isSubmitting && <Loader2 className="ml-2 h-4 w-4 animate-spin" />}
                      إضافة للمخزن
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
                <DropdownMenuLabel>خيارات المخزون</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleDownloadTemplate} disabled={isProcessing || spareParts.length === 0}>
                    <Download className="ml-2 h-4 w-4" />
                    تنزيل قالب التحديث
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => fileInputRef.current?.click()} disabled={isProcessing}>
                    <Upload className="ml-2 h-4 w-4" />
                    رفع ملف التحديث
                </DropdownMenuItem>
                </DropdownMenuContent>
            </DropdownMenu>
            <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileUpload}
                className="hidden"
                accept=".xlsx, .xls"
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
          searchKeys={["partName", "partNumber", "location"]} 
          columns={columns({ openEditDialog, openDeleteDialog })} 
          data={data} 
          searchPlaceholder="بحث بالاسم، رقم القطعة، أو الموقع..." 
        />
      )}

      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>تعديل عنصر المخزن</DialogTitle>
            <DialogDescription>
              تحديث الكمية أو الموقع لـ: {editingItem?.partName}
            </DialogDescription>
          </DialogHeader>
          <Form {...editForm}>
            <form onSubmit={editForm.handleSubmit(onEditItemSubmit)} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                    <FormField control={editForm.control} name="quantity" render={({ field }) => (<FormItem><FormLabel>الكمية الحالية *</FormLabel><FormControl><Input type="number" {...field} /></FormControl><FormMessage /></FormItem>)} />
                    <FormField control={editForm.control} name="minLevel" render={({ field }) => (<FormItem><FormLabel>أقل كمية *</FormLabel><FormControl><Input type="number" {...field} /></FormControl><FormMessage /></FormItem>)} />
                </div>
                <FormField control={editForm.control} name="location" render={({ field }) => (<FormItem><FormLabel>الموقع في المخزن</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>)} />
                <DialogFooter className="pt-4">
                    <DialogClose asChild><Button type="button" variant="outline">إلغاء</Button></DialogClose>
                    <Button type="submit" disabled={editForm.formState.isSubmitting}>
                        {editForm.formState.isSubmitting && <Loader2 className="ml-2 h-4 w-4 animate-spin" />}
                        حفظ التعديلات
                    </Button>
                </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

    <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>هل أنت متأكد؟</AlertDialogTitle>
          <AlertDialogDescription>
            سيتم حذف هذا العنصر من المخزن نهائيًا. لا يمكن التراجع عن هذا الإجراء.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>إلغاء</AlertDialogCancel>
          <AlertDialogAction onClick={confirmDelete}>متابعة</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>

    </>
  );
};
