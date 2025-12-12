
"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { PlusCircle, Loader2 } from "lucide-react";
import { collection, doc } from "firebase/firestore";
import { useFirestore, addDocumentNonBlocking, updateDocumentNonBlocking, deleteDocumentNonBlocking } from "@/firebase";

import { Button } from "@/components/ui/button";
import { DataTable } from "@/components/ui/data-table";
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

import { useToast } from "@/hooks/use-toast";

import { columns, type TechnicianColumn } from "./columns";

interface TechniciansClientProps {
  data: TechnicianColumn[];
  isLoading: boolean;
}

const formSchema = z.object({
  displayName: z.string().min(1, { message: "اسم الفني مطلوب." }),
  role: z.string().min(1, { message: "دور الفني مطلوب." }),
});

export const TechniciansClient: React.FC<TechniciansClientProps> = ({ data, isLoading }) => {
  const { toast } = useToast();
  const firestore = useFirestore();
  const [isAddTechnicianOpen, setAddTechnicianOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingTechnician, setEditingTechnician] = useState<TechnicianColumn | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [deletingTechnicianId, setDeletingTechnicianId] = useState<string | null>(null);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      displayName: "",
      role: "Technician",
    },
  });

  const editForm = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
  });

  const onAddTechnicianSubmit = async (values: z.infer<typeof formSchema>) => {
    if (!firestore) return;
    try {
      const usersCollection = collection(firestore, 'users');
      const newUser = {
        displayName: values.displayName,
        role: values.role,
        email: '', // Not creating an auth user anymore
        uid: '',   // Not creating an auth user anymore
      };
      
      addDocumentNonBlocking(usersCollection, newUser);

      toast({
        title: "تمت إضافة الفني بنجاح",
        description: `تم إضافة ${values.displayName} إلى قائمة الفنيين.`,
      });
      form.reset();
      setAddTechnicianOpen(false);
    } catch (error: any) {
      console.error("Error adding technician:", error);
      toast({
        variant: "destructive",
        title: "حدث خطأ",
        description: "فشلت عملية إضافة الفني. يرجى المحاولة مرة أخرى.",
      });
    }
  };

  const onEditTechnicianSubmit = async (values: z.infer<typeof formSchema>) => {
    if (!firestore || !editingTechnician) return;
    try {
      const userDoc = doc(firestore, 'users', editingTechnician.id);
      updateDocumentNonBlocking(userDoc, {
          displayName: values.displayName,
          role: values.role
      });
      toast({
        title: "تم تحديث الفني بنجاح",
      });
      setEditingTechnician(null);
      setIsEditDialogOpen(false);
    } catch (error) {
      console.error("Error updating technician:", error);
      toast({
        variant: "destructive",
        title: "حدث خطأ",
        description: "فشلت عملية تحديث الفني.",
      });
    }
  };

  const openEditDialog = (technician: TechnicianColumn) => {
    setEditingTechnician(technician);
    editForm.reset(technician);
    setIsEditDialogOpen(true);
  };
  
  const openDeleteDialog = (technicianId: string) => {
    setDeletingTechnicianId(technicianId);
    setIsDeleteDialogOpen(true);
  };

  const confirmDelete = () => {
    if (!firestore || !deletingTechnicianId) return;
    const userDoc = doc(firestore, 'users', deletingTechnicianId);
    deleteDocumentNonBlocking(userDoc);
    toast({
      title: "تم الحذف بنجاح",
    });
    setDeletingTechnicianId(null);
    setIsDeleteDialogOpen(false);
  };

  return (
    <>
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold tracking-tight">الفنيون ({data.length})</h2>
        <div className="flex items-center space-x-2">
          <Dialog open={isAddTechnicianOpen} onOpenChange={setAddTechnicianOpen}>
            <DialogTrigger asChild>
              <Button disabled={isLoading}>
                <PlusCircle className="ml-2 h-4 w-4" />
                إضافة فني
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>إضافة فني جديد</DialogTitle>
                <DialogDescription>
                  املأ الحقول التالية لإضافة فني جديد إلى النظام.
                </DialogDescription>
              </DialogHeader>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onAddTechnicianSubmit)} className="space-y-4">
                  <FormField
                    control={form.control}
                    name="displayName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>اسم الفني *</FormLabel>
                        <FormControl>
                          <Input placeholder="الاسم بالكامل" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="role"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>الدور (الوظيفة) *</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                                <SelectTrigger>
                                <SelectValue placeholder="اختر دور الفني" />
                                </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                                <SelectItem value="Technician">فني</SelectItem>
                                <SelectItem value="CustomerService">خدمة عملاء</SelectItem>
                                <SelectItem value="Manager">مدير</SelectItem>
                                <SelectItem value="Admin">مسؤول</SelectItem>
                            </SelectContent>
                        </Select>
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
                      إضافة الفني
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
          searchKeys={["displayName", "email", "role"]} 
          columns={columns({ openEditDialog, openDeleteDialog })} 
          data={data} 
          searchPlaceholder="بحث بالاسم أو البريد الإلكتروني أو الدور..." 
        />
      )}

    <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>تعديل بيانات الفني</DialogTitle>
          </DialogHeader>
          <Form {...editForm}>
            <form onSubmit={editForm.handleSubmit(onEditTechnicianSubmit)} className="space-y-4">
              <FormField
                control={editForm.control}
                name="displayName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>اسم الفني *</FormLabel>
                    <FormControl><Input {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={editForm.control}
                name="role"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>الدور (الوظيفة) *</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                        <SelectContent>
                            <SelectItem value="Technician">فني</SelectItem>
                            <SelectItem value="CustomerService">خدمة عملاء</SelectItem>
                            <SelectItem value="Manager">مدير</SelectItem>
                            <SelectItem value="Admin">مسؤول</SelectItem>
                        </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
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
            سيتم حذف هذا الفني نهائيًا. لا يمكن التراجع عن هذا الإجراء.
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

    