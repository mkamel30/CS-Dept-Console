import type { Metadata } from 'next';
import './globals.css';
import { Sidebar, SidebarProvider, SidebarInset } from '@/components/ui/sidebar';
import { Toaster } from "@/components/ui/toaster"
import { SidebarNav } from '@/components/sidebar-nav';
import { DashboardHeader } from '@/components/dashboard-header';
import { FirebaseClientProvider } from '@/firebase/client-provider';

export const metadata: Metadata = {
  title: 'On-Premise Maintenance Manager',
  description: 'Integrated maintenance management system.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ar" dir="rtl" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet" />
      </head>
      <body className="font-body antialiased">
        <FirebaseClientProvider>
          <SidebarProvider>
              <Sidebar side="right" collapsible="icon" variant="sidebar" className="dark">
                <SidebarNav />
              </Sidebar>
              <div className="flex flex-col flex-1">
                <DashboardHeader />
                <main className="flex-1 p-4 md:p-6 lg:p-8 bg-background">
                  {children}
                </main>
              </div>
          </SidebarProvider>
        </FirebaseClientProvider>
        <Toaster />
      </body>
    </html>
  );
}
