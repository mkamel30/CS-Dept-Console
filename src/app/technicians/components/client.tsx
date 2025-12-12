"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { PlusCircle, Loader2 } from "lucide-react";
import { collection } from "firebase/firestore";
import { useFirestore, addDocumentNonBlocking, useAuth } from "@/firebase";
import { createUserWithEmailAndPassword, updateProfile } from "firebase/auth";

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
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";

import { columns, type TechnicianColumn } from "./columns";

interface TechniciansClientProps {
  data: TechnicianColumn[];
  isLoading: boolean;
}

const formSchema = z.object({
  displayName: z.string().min(1, { message: "اسم الفني مطلوب." }),
  email: z.string().email({ message: "البريد الإلكتروني مطلوب." }),
  password: z.string().min(6, { message: "كلمة المرور يجب أن تكون 6 أحرف على الأقل." }),
});

export const TechniciansClient: React.FC<TechniciansClientProps> = ({ data, isLoading }) => {
  const { toast } = useToast();
  const firestore = useFirestore();
  const auth = useAuth();
  const [isAddTechnicianOpen, setAddTechnicianOpen] = useState(false);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      displayName: "",
      email: "",
      password: "",
    },
  });

  const onAddTechnicianSubmit = async (values: z.infer<typeof formSchema>) => {
    if (!firestore || !auth) return;
    try {
      // Create user in Auth
      const userCredential = await createUserWithEmailAndPassword(auth, values.email, values.password);
      const user = userCredential.user;

      // Update user profile
      await updateProfile(user, { displayName: values.displayName });

      // Add user to 'users' collection in Firestore
      const usersCollection = collection(firestore, 'users');
      const newUser = {
        uid: user.uid,
        email: values.email,
        displayName: values.displayName,
        role: 'Technician', // Default role
      };
      
      // Use setDoc with uid as document id
      const { setDocumentNonBlocking } = await import('@/firebase/non-blocking-updates');
      const { doc } = await import('firebase/firestore');
      setDocumentNonBlocking(doc(usersCollection, user.uid), newUser, { merge: true });

      toast({
        title: "تمت إضافة الفني بنجاح",
        description: `تم إنشاء حساب جديد لـ ${values.displayName}.`,
      });
      form.reset();
      setAddTechnicianOpen(false);
    } catch (error: any) {
      console.error("Error adding technician:", error);
      toast({
        variant: "destructive",
        title: "حدث خطأ",
        description: error.code === 'auth/email-already-in-use' 
            ? "هذا البريد الإلكتروني مستخدم بالفعل."
            : "فشلت عملية إضافة الفني. يرجى المحاولة مرة أخرى.",
      });
    }
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
                  املأ الحقول التالية لإنشاء حساب جديد للفني.
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
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>البريد الإلكتروني *</FormLabel>
                        <FormControl>
                          <Input type="email" placeholder="email@example.com" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="password"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>كلمة المرور *</FormLabel>
                        <FormControl>
                          <Input type="password" placeholder="******" {...field} />
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
          searchKeys={["displayName", "email"]} 
          columns={columns} 
          data={data} 
          searchPlaceholder="بحث بالاسم أو البريد الإلكتروني..." 
        />
      )}
    </>
  );
};
