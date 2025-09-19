
"use client";

import Link from "next/link";
import { AppWindow, Menu, Search, LayoutDashboard, LifeBuoy, LogOut } from "lucide-react";
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
import { googleLogout, GoogleLogin, CredentialResponse } from '@react-oauth/google';
import api from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import { isAdmin } from "@/lib/utils";

export function Header() {
  const router = useRouter();
  const { toast } = useToast();
  const [user, setUser] = useState<LoggedInUser | null>(null);
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    const userData = localStorage.getItem("loggedInUser");
    if (userData) {
      setUser(JSON.parse(userData));
    }
    setIsClient(true);
  }, []);

  const completeLogin = useCallback((token: string, user: LoggedInUser) => {
    localStorage.setItem('jwt', token);
    localStorage.setItem('loggedInUser', JSON.stringify(user));
    setUser(user);
    toast({
        title: "Login Successful",
        description: `Welcome, ${user.name}!`,
    });

    if (isAdmin(user)) {
        window.location.href = '/u/s/portal/dashboard';
    } else {
        window.location.href = '/events';
    }
  }, [toast]);

 const handleGoogleAuth = useCallback(async (credentialResponse: CredentialResponse) => {
    if (!credentialResponse.credential) {
      toast({
        variant: "destructive",
        title: "Login Failed",
        description: "Could not retrieve Google credential.",
      });
      return;
    }

    try {
      const response: any = await api('/auth/google', {
        method: 'POST',
        body: { idToken: credentialResponse.credential },
      });

      if (response.success && response.token && response.user) {
        completeLogin(response.token, response.user);
      } else {
        throw new Error(response.message || "Google login failed: Invalid response from server.");
      }
    } catch (error: any) {
      try {
        const parsedError = JSON.parse(error.message);
        if (parsedError.isNewUser && parsedError.profile) {
          sessionStorage.setItem('google_signup_profile', JSON.stringify(parsedError.profile));
          router.push('/auth/signup');
          return;
        }
        toast({
          variant: "destructive",
          title: "Login Failed",
          description: parsedError.message || "An unknown error occurred.",
        });
      } catch (e) {
        toast({
          variant: "destructive",
          title: "Login Failed",
          description: error.message || "An unknown error occurred.",
        });
      }
    }
  }, [completeLogin, toast, router]);

  const handleLogout = () => {
    googleLogout();
    localStorage.removeItem("loggedInUser");
    localStorage.removeItem("jwt");
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
            <AppWindow className="h-6 w-6 text-primary" />
            <span className="font-headline text-lg hidden sm:inline-block">Symposium Central</span>
            </Link>

            <div className="flex items-center gap-4">
              <nav className="hidden md:flex items-center gap-6 text-sm">
                 <Link href="/events" className="text-muted-foreground transition-colors hover:text-foreground">Explore Events</Link>
                 <Link href="/#about-event" className="text-muted-foreground transition-colors hover:text-foreground">About</Link>
                 <Link href="/code-of-conduct" className="text-muted-foreground transition-colors hover:text-foreground">Code of Conduct</Link>
              </nav>

              <div className="flex items-center justify-end gap-2 md:gap-4">
                 <div className="relative w-full max-w-sm hidden sm:block">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      type="search"
                      placeholder="Search events..."
                      className="pl-8"
                    />
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
                       <GoogleLogin
                          onSuccess={handleGoogleAuth}
                          onError={() => toast({ variant: "destructive", title: "Google login failed."})}
                          theme="outline"
                          text="continue_with"
                          shape="rectangular"
                       />
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
                              <AppWindow className="h-6 w-6 text-primary" />
                              <span className="font-headline text-lg">Symposium Central</span>
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
                             <GoogleLogin
                                  onSuccess={handleGoogleAuth}
                                  onError={() => toast({ variant: "destructive", title: "Google login failed."})}
                               />
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
    </>
  );
}
