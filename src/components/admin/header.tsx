"use client";

import { usePathname, useRouter } from "next/navigation";
import React, { useEffect, useState } from "react";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { Search } from "lucide-react";
import { Input } from "../ui/input";
import type { LoggedInUser } from "@/lib/types";

const pathToTitle: { [key: string]: string } = {
  "/admin": "Dashboard",
  "/admin/events": "Events",
  "/admin/departments": "Departments",
  "/admin/finance": "Finance",
};

export function AdminHeader() {
  const pathname = usePathname();
  const title = pathToTitle[pathname] || "Event Details";
  
  return (
    <header className="sticky top-0 z-10 flex h-16 items-center gap-4 border-b bg-background/80 px-4 backdrop-blur-sm md:px-6">
      <div className="md:hidden">
        <SidebarTrigger />
      </div>

      <div className="flex-1">
        <h1 className="font-headline text-xl font-semibold md:text-2xl">
          {title}
        </h1>
      </div>

      <div className="flex flex-1 items-center gap-4 md:ml-auto md:flex-initial">
        <div className="relative w-full max-w-sm">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Search events or users..."
            className="pl-8"
          />
        </div>
      </div>
    </header>
  );
}
