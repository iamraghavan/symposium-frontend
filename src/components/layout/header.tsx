
"use client";

import Link from "next/link";
import { AppWindow, Menu, Search, LayoutDashboard, LifeBuoy, LogOut, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Sheet,
  SheetContent,
  SheetTrigger,
  SheetClose,
} from "@/components/ui/sheet";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import React, { useEffect, useState, useCallback } from "react";
import type { LoggedInUser } from "@/lib/types";
import { useRouter } from "next/navigation";
import { googleLogout } from '@react-oauth/google';
import { useToast } from "@/hooks/use-toast";
import { isAdmin } from "@/lib/utils";
import Image from "next/image";
import { SearchDialog } from "@/components/search-dialog";


function eraseCookie(name: string) {   
    document.cookie = name+'=; Max-Age=-99999999; path=/;';  
}

export function Header() {
  const router = useRouter();
  const { toast } = useToast();
  const [user, setUser] = useState<LoggedInUser | null>(null);
  const [isClient, setIsClient] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);

  useEffect(() => {
    const userData = localStorage.getItem("loggedInUser");
    if (userData) {
      setUser(JSON.parse(userData));
    }
    setIsClient(true);

    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault()
        setIsSearchOpen((open) => !open)
      }
    }
    document.addEventListener("keydown", down)
    return () => document.removeEventListener("keydown", down)
  }, []);

  const handleLogout = () => {
    googleLogout();
    localStorage.removeItem("loggedInUser");
    localStorage.removeItem("userApiKey");
    eraseCookie('apiKey');
    eraseCookie('loggedInUser');
    setUser(null);
    toast({ title: "Logged out successfully" });
    window.location.href = "/";
  };
  
  return (
    <>
      <header className="sticky top-0 z-50 w-full border-b bg-background">
        <div className="w-full px-4 sm:px-6 md:px-8">
          <div className="flex h-16 items-center justify-between">
            <Link href="/" className="flex items-center gap-2 font-bold">
              <Image src="/assets/logo/EGSPEC_Symposium_header.svg" alt="EGSPEC Symposium Logo" width={200} height={40} className="h-10 w-auto" />
            </Link>

            <div className="flex items-center gap-4">
              <nav className="hidden md:flex items-center gap-6 text-sm">
                 <Link href="/events" className="text-muted-foreground transition-colors hover:text-foreground">Explore Events</Link>
                 <Link href="/#about-event" className="text-muted-foreground transition-colors hover:text-foreground">About</Link>
                 <Link href="/code-of-conduct" className="text-muted-foreground transition-colors hover:text-foreground">Code of Conduct</Link>
              </nav>

              <div className="flex items-center justify-end gap-2 md:gap-4">
                 <div className="relative w-full max-w-sm hidden sm:block">
                    <Button
                      variant="outline"
                      className="relative w-full justify-start text-sm text-muted-foreground sm:pr-12"
                      onClick={() => setIsSearchOpen(true)}
                    >
                      <Search className="absolute left-2.5 top-2.5 h-4 w-4" />
                      <span className="pl-6">Search events...</span>
                       <kbd className="pointer-events-none absolute right-1.5 top-1/5 hidden h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium opacity-100 sm:flex">
                        <span className="text-xs">⌘</span>K
                      </kbd>
                    </Button>
                  </div>
                {isClient && user ? (
                   <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" className="relative h-10 rounded-full p-2 flex items-center gap-2">
                        <Avatar className="h-8 w-8">
                          <AvatarImage
                              src={user.picture || `https://picsum.photos/seed/${user.name}/40/40`}
                              alt={user.name}
                              data-ai-hint="person"
                            />
                          <AvatarFallback>{user.name.charAt(0)}</AvatarFallback>
                        </Avatar>
                        <span className="hidden sm:inline-block text-sm font-medium">{user.name}</span>
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-56">
                      <DropdownMenuLabel>
                          <div className="flex flex-col">
                              <span className="text-sm font-medium">{user.name}</span>
                              <span className="text-xs text-muted-foreground">
                                {user.email}
                              </span>
                          </div>
                      </DropdownMenuLabel>
                      <DropdownMenuSeparator />
                       {isAdmin(user) ? (
                          <DropdownMenuItem onClick={() => router.push('/u/s/portal/dashboard')}>
                            <LayoutDashboard className="mr-2 h-4 w-4" />
                            <span>Admin Dashboard</span>
                          </DropdownMenuItem>
                       ) : (
                          <DropdownMenuItem onClick={() => router.push('/u/d/dashboard')}>
                            <LayoutDashboard className="mr-2 h-4 w-4" />
                            <span>Dashboard</span>
                          </DropdownMenuItem>
                       )}
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
                ) : isClient && (
                  <div className="hidden md:flex items-center gap-2">
                      <Button asChild>
                         <Link href="/auth/login">Login</Link>
                      </Button>
                  </div>
                )}
                 <Sheet>
                  <SheetTrigger asChild>
                    <Button variant="ghost" size="icon" className="md:hidden">
                      <Menu className="h-6 w-6" />
                      <span className="sr-only">Toggle Navigation</span>
                    </Button>
                  </SheetTrigger>
                  <SheetContent side="left">
                    <div className="flex flex-col h-full">
                      <div className="flex items-center justify-between p-4 border-b">
                          <Link href="/" className="flex items-center gap-2 font-bold">
                              <Image src="/assets/logo/EGSPEC_Symposium_header.svg" alt="EGSPEC Symposium Logo" width={150} height={30} />
                          </Link>
                          <SheetClose asChild>
                            <Button variant="ghost" size="icon"><span className="sr-only">Close</span></Button>
                          </SheetClose>
                      </div>
                      
                      <div className="flex-1 overflow-y-auto">
                        {isClient && user && (
                           <div className="p-4 border-b">
                             <div className="flex items-center gap-3 mb-4">
                                <Avatar className="h-10 w-10">
                                  <AvatarImage
                                      src={user.picture || `https://picsum.photos/seed/${user.name}/40/40`}
                                      alt={user.name}
                                      data-ai-hint="person"
                                    />
                                  <AvatarFallback>{user.name.charAt(0)}</AvatarFallback>
                                </Avatar>
                                <div className="flex flex-col">
                                    <span className="text-sm font-medium">{user.name}</span>
                                    <span className="text-xs text-muted-foreground">
                                      {user.email}
                                    </span>
                                </div>
                             </div>
                              <SheetClose asChild>
                                {isAdmin(user) ? (
                                    <Button variant="secondary" className="w-full" onClick={() => router.push('/u/s/portal/dashboard')}>Admin Dashboard</Button>
                                ) : (
                                    <Button variant="secondary" className="w-full" onClick={() => router.push('/u/d/dashboard')}>Dashboard</Button>
                                )}
                              </SheetClose>
                           </div>
                        )}
                        <nav className="flex flex-col gap-2 p-4">
                          <SheetClose asChild>
                            <Link href="/events" className="text-lg font-medium text-muted-foreground transition-colors hover:text-foreground">Explore Events</Link>
                          </SheetClose>
                          <SheetClose asChild>
                            <Link href="/#about-event" className="text-lg font-medium text-muted-foreground transition-colors hover:text-foreground">About</Link>
                          </SheetClose>
                          <SheetClose asChild>
                            <Link href="/code-of-conduct" className="text-lg font-medium text-muted-foreground transition-colors hover:text-foreground">Code of Conduct</Link>
                          </SheetClose>
                        </nav>
                      </div>
                       <div className="p-4 border-t mt-auto">
                          {isClient && user ? (
                            <Button onClick={handleLogout} className="w-full">Log out</Button>
                          ) : isClient && (
                            <div className="grid gap-2">
                               <SheetClose asChild>
                                 <Button asChild className="w-full">
                                    <Link href="/auth/login">Login</Link>
                                 </Button>
                               </SheetClose>
                            </div>
                          )}
                        </div>
                    </div>
                  </SheetContent>
                </Sheet>
              </div>
            </div>
          </div>
        </div>
      </header>
      <SearchDialog open={isSearchOpen} onOpenChange={setIsSearchOpen} />
    </>
  );
}
