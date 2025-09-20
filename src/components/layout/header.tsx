
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
import { googleLogout, useGoogleLogin } from '@react-oauth/google';
import api from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import { isAdmin } from "@/lib/utils";

const GoogleIcon = (props: React.SVGProps<SVGSVGElement>) => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" width="24px" height="24px" {...props}>
        <path fill="#FFC107" d="M43.611,20.083H42V20H24v8h11.303c-1.649,4.657-6.08,8-11.303,8c-6.627,0-12-5.373-12-12s5.373-12,12-12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C12.955,4,4,12.955,4,24s8.955,20,20,20s20-8.955,20-20C44,22.659,43.862,21.35,43.611,20.083z" />
        <path fill="#FF3D00" d="M6.306,14.691l6.571,4.819C14.655,15.108,18.961,12,24,12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C16.318,4,9.656,8.337,6.306,14.691z" />
        <path fill="#4CAF50" d="M24,44c5.166,0,9.86-1.977,13.409-5.192l-6.19-5.238C29.211,35.091,26.715,36,24,36c-5.222,0-9.619-3.317-11.283-7.946l-6.522,5.025C9.505,39.556,16.227,44,24,44z" />
        <path fill="#1976D2" d="M43.611,20.083H42V20H24v8h11.303c-0.792,2.237-2.231,4.166-4.087,5.571l6.19,5.238C44.591,35.023,48,29.83,48,24C48,22.659,47.862,21.35,47.611,20.083z" />
    </svg>
);


function setCookie(name: string, value: string, days: number) {
    let expires = "";
    if (days) {
        const date = new Date();
        date.setTime(date.getTime() + (days*24*60*60*1000));
        expires = "; expires=" + date.toUTCString();
    }
    document.cookie = name + "=" + (value || "")  + expires + "; path=/";
}

function eraseCookie(name: string) {   
    document.cookie = name+'=; Max-Age=-99999999; path=/;';  
}

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

  const completeLogin = useCallback((apiKey: string, user: LoggedInUser) => {
    localStorage.setItem('userApiKey', apiKey);
    localStorage.setItem('loggedInUser', JSON.stringify(user));
    setCookie('apiKey', apiKey, 7);
    setUser(user);
    toast({
        title: "Login Successful",
        description: `Welcome, ${user.name}!`,
    });

    if (isAdmin(user)) {
        window.location.href = '/u/s/portal/dashboard';
    } else {
        window.location.href = '/u/d/dashboard';
    }
  }, [toast]);

 const handleGoogleAuthSuccess = useCallback(async (tokenResponse: any) => {
    try {
        const response: any = await api('/auth/google', {
            method: 'POST',
            body: { accessToken: tokenResponse.access_token },
        });

        if (response.success && response.apiKey && response.user) {
            completeLogin(response.apiKey, response.user);
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

  const login = useGoogleLogin({
    onSuccess: handleGoogleAuthSuccess,
    onError: () => toast({ variant: 'destructive', title: 'Login Failed', description: 'Google authentication failed.' }),
  });


  const handleLogout = () => {
    googleLogout();
    localStorage.removeItem("loggedInUser");
    localStorage.removeItem("userApiKey");
    eraseCookie('apiKey');
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
                      <Button onClick={() => login()}>
                         <GoogleIcon className="mr-2"/>
                         Sign in with Google
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
                            <div className="grid gap-2">
                               <SheetClose asChild>
                                <Button onClick={() => login()} className="w-full">
                                    <GoogleIcon className="mr-2"/>
                                    Sign in with Google
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
    </>
  );
}
