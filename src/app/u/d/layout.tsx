
"use client"
import {
  SidebarProvider,
  Sidebar,
  SidebarInset,
} from "@/components/ui/sidebar";
import { UserNav } from "@/components/user/nav";

export default function PortalLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <SidebarProvider>
      <Sidebar side="left" variant="sidebar" collapsible="icon">
        <UserNav />
      </Sidebar>
      <SidebarInset>
        <main className="p-4 lg:p-6">{children}</main>
      </SidebarInset>
    </SidebarProvider>
  );
}
