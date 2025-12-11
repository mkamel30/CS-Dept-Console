
"use client"

import Link from "next/link"
import * as React from "react"
import {
  PanelLeft,
  Search,
  User,
  LogOut,
  LogIn,
  Settings as SettingsIcon,
} from "lucide-react"
import { useAuth, useUser } from "@/firebase"
import { signOut } from "firebase/auth"
import { useRouter } from "next/navigation"


import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Input } from "@/components/ui/input"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import { usePathname } from "next/navigation"
import { SidebarNav } from "./sidebar-nav"

const breadcrumbNameMap: { [key: string]: string } = {
  '/': 'لوحة التحكم',
  '/requests': 'طلبات الصيانة',
  '/assets': 'الأصول والمعدات',
  '/customers': 'العملاء',
  '/inventory': 'المخزون وقطع الغيار',
  '/technicians': 'الفنيون والمهام',
  '/reports': 'التقارير والتحليلات',
  '/settings': 'الإعدادات',
};

export function DashboardHeader() {
  const pathname = usePathname();
  const { user, isUserLoading } = useUser();
  const auth = useAuth();
  const router = useRouter();

  const handleSignOut = async () => {
    if (auth) {
      await signOut(auth);
      router.push('/login');
    }
  };

  const generateBreadcrumbs = () => {
    if (!user) return null;
    const pathSegments = pathname.split('/').filter(i => i);
    
    return (
      <Breadcrumb className="hidden md:flex">
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink asChild>
              <Link href="/">لوحة التحكم</Link>
            </BreadcrumbLink>
          </BreadcrumbItem>
          {pathSegments.map((segment, index) => {
            currentPath += `/${segment}`;
            const isLast = index === pathSegments.length - 1;
            return (
              <React.Fragment key={currentPath}>
                <BreadcrumbSeparator />
                <BreadcrumbItem>
                  {isLast ? (
                    <BreadcrumbPage>{breadcrumbNameMap[currentPath] || segment}</BreadcrumbPage>
                  ) : (
                    <BreadcrumbLink asChild>
                      <Link href={currentPath}>{breadcrumbNameMap[currentPath] || segment}</Link>
                    </BreadcrumbLink>
                  )}
                </BreadcrumbItem>
              </React.Fragment>
            );
          })}
        </BreadcrumbList>
      </Breadcrumb>
    );
  };
  let currentPath = '';

  return (
    <header className="sticky top-0 z-30 flex h-14 items-center gap-4 border-b bg-background px-4 sm:static sm:h-auto sm:border-0 sm:bg-transparent sm:px-6">
      {user && (
        <Sheet>
          <SheetTrigger asChild>
            <Button size="icon" variant="outline" className="sm:hidden">
              <PanelLeft className="h-5 w-5" />
              <span className="sr-only">فتح القائمة</span>
            </Button>
          </SheetTrigger>
          <SheetContent side="right" className="sm:max-w-xs dark">
            <SidebarNav isMobile={true} />
          </SheetContent>
        </Sheet>
      )}
      
      {generateBreadcrumbs()}

      <div className="relative ml-auto flex-1 md:grow-0">
        {user && (
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
        )}
        <Input
          type="search"
          placeholder="بحث..."
          className={`w-full rounded-lg bg-background md:w-[200px] lg:w-[320px] ${user ? 'pl-8' : ''}`}
          disabled={!user}
        />
      </div>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="outline"
            size="icon"
            className="overflow-hidden rounded-full"
            disabled={isUserLoading}
          >
            <User className="h-5 w-5" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          {user ? (
            <>
              <DropdownMenuLabel>{user.email || 'حسابي'}</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => router.push('/settings')}>
                <SettingsIcon className="mr-2 h-4 w-4" />
                الإعدادات
              </DropdownMenuItem>
              <DropdownMenuItem>
                <User className="mr-2 h-4 w-4" />
                ملفي الشخصي
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleSignOut}>
                <LogOut className="mr-2 h-4 w-4" />
                تسجيل الخروج
              </DropdownMenuItem>
            </>
          ) : (
            <>
              <DropdownMenuLabel>مرحباً</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => router.push('/login')}>
                <LogIn className="mr-2 h-4 w-4" />
                تسجيل الدخول
              </DropdownMenuItem>
            </>
          )}
        </DropdownMenuContent>
      </DropdownMenu>
    </header>
  )
}
