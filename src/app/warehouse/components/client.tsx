
"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { PlusCircle, Loader2 } from "lucide-react";
import { collection, where, query, getDocs, doc } from "firebase/firestore";

import { Button } from "@/components/ui/button";
import { DataTable } from "@/components/ui/data-table";
import { useToast } from "@/hooks/use-toast";
import { useFirestore, addDocumentNonBlocking, updateDocumentNonBlocking, deleteDocumentNonBlocking } from "@/firebase";
import { SparePart } from "@/lib/types";

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
  const [isAddItemOpen, setAddItemOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<InventoryColumn | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [deletingItemId, setDeletingItemId] = useState<string | null>(null);

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
                                {part.name} ({part.partNumber || 'N/A'})
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
        </div>
      </div>
      
      {isLoading ? (
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
