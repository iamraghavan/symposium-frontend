
"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  SidebarHeader,
  SidebarContent,
  SidebarFooter,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
} from "@/components/ui/sidebar";
import {
  LayoutDashboard,
  Calendar,
  Building2,
  Banknote,
  LifeBuoy,
  LogOut,
  Settings,
  AppWindow,
  Home,
  Users
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "../ui/button";
import type { LoggedInUser } from "@/lib/types";
import { isAdmin } from "@/lib/utils";

const allMenuItems = [
  { href: "/", label: "Home", icon: Home },
  { href: "/u/s/portal/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/u/s/portal/events", label: "Events", icon: Calendar },
  { href: "/u/s/portal/registered-users", label: "Users", icon: Users },
  { href: "/u/s/portal/departments", label: "Departments", icon: Building2, requiredRole: "super_admin" },
  { href: "/u/s/portal/finance", label: "Finance", icon: Banknote, requiredRole: "super_admin" },
];

function eraseCookie(name: string) {   
    document.cookie = name+'=; Max-Age=-99999999; path=/;';  
}

export function AdminNav() {
  const pathname = usePathname();
  const router = useRouter();
  const [user, setUser] = useState<LoggedInUser | null>(null);

  useEffect(() => {
    const userData = localStorage.getItem("loggedInUser");
    if (userData) {
      const loggedInUser = JSON.parse(userData);
      if (!isAdmin(loggedInUser)) {
        router.push("/");
      } else {
        setUser(loggedInUser);
      }
    } else {
      router.push("/c/auth/login?login=s_admin");
    }
  }, [router]);

  const handleLogout = () => {
    localStorage.removeItem("loggedInUser");
    localStorage.removeItem("userApiKey");
    eraseCookie('apiKey');
    eraseCookie('loggedInUser');
    window.location.href = "/";
  };
  
  const menuItems = allMenuItems.filter(item => {
    if (!isAdmin(user)) return item.href === '/'; // Should not happen due to guard clause above, but for safety
    if (item.requiredRole) {
      return user?.role === item.requiredRole;
    }
    return true;
  });


  return (
    <>
      <SidebarHeader className="p-4">
        <div className="flex items-center gap-2">
          <AppWindow className="text-primary w-8 h-8" />
          <div className="flex flex-col">
            <h2 className="text-lg font-headline font-semibold tracking-tight text-primary-foreground">
              Symposium
            </h2>
            <p className="text-xs text-sidebar-foreground/80">Admin Panel</p>
          </div>
        </div>
      </SidebarHeader>
      <SidebarContent className="p-2">
        <SidebarMenu>
          {menuItems.map((item) => (
            <SidebarMenuItem key={item.href}>
              <SidebarMenuButton
                asChild
                isActive={pathname === item.href || (item.href !== "/u/s/portal/dashboard" && item.href !== "/" && pathname.startsWith(item.href))}
                tooltip={item.label}
              >
                <Link href={item.href}>
                  <item.icon />
                  <span>{item.label}</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          ))}
        </SidebarMenu>
      </SidebarContent>
      <SidebarFooter className="p-2">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              className="w-full justify-start h-auto p-2"
            >
              <div className="flex justify-between items-center w-full">
                <div className="flex gap-2 items-center">
                  <Avatar className="w-8 h-8">
                    <AvatarImage
                      src={user?.picture || `https://picsum.photos/seed/${user?.name || 'admin'}/40/40`}
                      alt={user?.name || 'Admin'}
                      data-ai-hint="person"
                    />
                    <AvatarFallback>{user?.name?.charAt(0) || 'A'}</AvatarFallback>
                  </Avatar>
                  <div className="flex flex-col items-start group-data-[collapsible=icon]:hidden">
                    <span className="text-sm font-medium text-sidebar-foreground">{user?.name || 'Admin'}</span>
                    <span className="text-xs text-sidebar-foreground/70">
                      {user?.email || ''}
                    </span>
                  </div>
                </div>
              </div>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent side="right" align="start" className="w-56">
            <DropdownMenuLabel>My Account</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem>
              <Settings className="mr-2 h-4 w-4" />
              <span>Settings</span>
            </DropdownMenuItem>
            <DropdownMenuItem>
              <LifeBuoy className="mr-2 h-4 w-4" />
              <span>Support</span>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleLogout}>
              <LogOut className="mr-2 h-4 w-4" />
              <span>Log out</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarFooter>
    </>
  );
}
