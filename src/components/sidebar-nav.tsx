'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Wrench,
  HardDrive,
  Package,
  Users,
  FileText,
  Settings,
} from 'lucide-react';
import {
  SidebarHeader,
  SidebarContent,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarFooter,
} from '@/components/ui/sidebar';
import { Logo } from './icons';
import { cn } from '@/lib/utils';
import { Separator } from './ui/separator';

const navItems = [
  { href: '/', label: 'لوحة التحكم', icon: LayoutDashboard },
  { href: '/requests', label: 'طلبات الصيانة', icon: Wrench },
  { href: '/assets', label: 'ماكينات نقاط البيع', icon: HardDrive },
  { href: '/inventory', label: 'المخزون', icon: Package },
  { href: '/technicians', label: 'الفنيون', icon: Users },
  { href: '/reports', label: 'التقارير', icon: FileText },
];

const settingsNav = { href: '/settings', label: 'الإعدادات', icon: Settings };

interface SidebarNavProps {
  isMobile?: boolean;
}

export function SidebarNav({ isMobile = false }: SidebarNavProps) {
  const pathname = usePathname();

  const renderNavItems = (items: typeof navItems) =>
    items.map((item) => (
      <SidebarMenuItem key={item.href}>
        <SidebarMenuButton
          asChild
          isActive={pathname === item.href}
          className="justify-end"
        >
          <Link href={item.href}>
            <span
              className={cn(
                'truncate transition-all',
                isMobile ? 'block' : 'group-data-[collapsible=icon]:hidden'
              )}
            >
              {item.label}
            </span>
            <item.icon />
          </Link>
        </SidebarMenuButton>
      </SidebarMenuItem>
    ));

  return (
    <>
      <SidebarHeader className="flex items-center justify-between p-4">
        <h1
          className={cn(
            'text-xl font-semibold text-primary-foreground',
            isMobile ? 'block' : 'group-data-[collapsible=icon]:hidden'
          )}
        >
          نظام الصيانة
        </h1>
        <Logo className="h-6 w-6 text-primary-foreground" />
      </SidebarHeader>

      <SidebarContent className="p-2">
        <SidebarMenu>{renderNavItems(navItems)}</SidebarMenu>
      </SidebarContent>

      <SidebarFooter className="p-2">
         <Separator className="my-2 bg-sidebar-border" />
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              asChild
              isActive={pathname === settingsNav.href}
              className="justify-end"
            >
              <Link href={settingsNav.href}>
                <span
                  className={cn(
                    'truncate transition-all',
                    isMobile ? 'block' : 'group-data-[collapsible=icon]:hidden'
                  )}
                >
                  {settingsNav.label}
                </span>
                <settingsNav.icon />
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </>
  );
}
