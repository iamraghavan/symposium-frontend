
"use client";

import Link from "next/link";
import { AppWindow, Menu, Search, Settings } from "lucide-react";
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
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from "@/components/ui/dialog";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import React, { useEffect, useState } from "react";
import type { LoggedInUser, ApiSuccessResponse, Department, ApiErrorResponse } from "@/lib/types";
import { useRouter } from "next/navigation";
import { LifeBuoy, LogOut } from "lucide-react";
import { googleLogout, GoogleLogin, useGoogleOneTapLogin } from '@react-oauth/google';
import api from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import { Combobox } from "../ui/combobox";
import { Label } from "../ui/label";


export function Header() {
  const router = useRouter();
  const { toast } = useToast();
  const [user, setUser] = useState<LoggedInUser | null>(null);
  const [isClient, setIsClient] = useState(false);
  
  const [showDepartmentModal, setShowDepartmentModal] = useState(false);
  const [googleCredential, setGoogleCredential] = useState<string | null>(null);
  const [departments, setDepartments] = useState<{ value: string; label: string }[]>([]);
  const [loadingDepartments, setLoadingDepartments] = useState(false);
  const [selectedDepartment, setSelectedDepartment] = useState("");


  useEffect(() => {
    const userData = localStorage.getItem("loggedInUser");
    if (userData) {
      setUser(JSON.parse(userData));
    }
    setIsClient(true);
  }, []);

  const fetchDepartments = async () => {
    if (departments.length > 0) return;
    setLoadingDepartments(true);
    try {
        const response = await api<ApiSuccessResponse<{ departments: Department[] }>>('/departments');
        if (response.success && response.data) {
            const formattedDepartments = response.data.departments.map(d => ({
                value: d._id,
                label: d.name,
            }));
            setDepartments(formattedDepartments);
        }
    } catch (error) {
        console.error("Failed to fetch departments:", error);
        toast({
            variant: "destructive",
            title: "Error",
            description: "Failed to load department list.",
        });
    } finally {
        setLoadingDepartments(false);
    }
  }


  const handleLogout = () => {
    googleLogout();
    localStorage.removeItem("loggedInUser");
    localStorage.removeItem("jwt");
    setUser(null);
    toast({ title: "Logged out successfully" });
    router.push("/");
  };

  const completeLogin = (token: string, user: LoggedInUser) => {
    localStorage.setItem('jwt', token);
    localStorage.setItem('loggedInUser', JSON.stringify(user));
    setUser(user);
    toast({
        title: "Login Successful",
        description: `Welcome, ${user.name}!`,
    });

    if (user.role === 'super_admin' || user.role === 'department_admin') {
        router.push('/u/s/portal/dashboard');
    } else {
        router.push('/events');
    }
  }
  
  const handleGoogleAuth = async (idToken: string, departmentId?: string) => {
     try {
        const response = await api<ApiSuccessResponse<{ user: LoggedInUser, token: string }> | ApiErrorResponse>('/auth/google', {
            method: 'POST',
            body: { idToken, ...(departmentId && { departmentId }) }
        });
        
        if (response.success && response.token && response.user) {
            completeLogin(response.token, response.user);
            return;
        }

        throw new Error((response as ApiErrorResponse).message || "Google login failed.");

    } catch (error: any) {
        if (error.message.includes("Department is required")) {
             setGoogleCredential(idToken);
             await fetchDepartments();
             setShowDepartmentModal(true);
        } else {
            toast({
                variant: "destructive",
                title: "Login Failed",
                description: error.message || "An unknown error occurred. Please try again.",
            });
        }
    }
  };

  const handleGoogleSuccess = (credentialResponse: any) => {
      if (credentialResponse.credential) {
          handleGoogleAuth(credentialResponse.credential);
      }
  };

  const handleGoogleError = () => {
    toast({
        variant: "destructive",
        title: "Login Failed",
        description: "An unknown error occurred during Google authentication.",
    });
  };

  useGoogleOneTapLogin({
      onSuccess: handleGoogleSuccess,
      onError: handleGoogleError,
      disabled: !isClient || !!user,
  });

  const handleDepartmentSelection = async () => {
      if (!googleCredential) return;
      if (!selectedDepartment) {
          toast({ variant: "destructive", title: "Please select a department."});
          return;
      }
      await handleGoogleAuth(googleCredential, selectedDepartment);
      setShowDepartmentModal(false);
      setGoogleCredential(null);
      setSelectedDepartment("");
  };


  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background">
      <div className="w-full px-[50px]">
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
                    <Button variant="ghost" className="relative h-10 w-10 rounded-full">
                      <Avatar>
                        <AvatarImage
                            src={user.picture || `https://picsum.photos/seed/${user.name}/40/40`}
                            alt={user.name}
                            data-ai-hint="person"
                          />
                        <AvatarFallback>{user.name.charAt(0)}</AvatarFallback>
                      </Avatar>
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
                     <DropdownMenuItem onClick={() => router.push('/u/s/portal/dashboard')}>
                      <Settings className="mr-2 h-4 w-4" />
                      <span>Dashboard</span>
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
              ) : isClient && (
                <div className="hidden md:flex items-center gap-2">
                     <GoogleLogin
                        onSuccess={handleGoogleSuccess}
                        onError={handleGoogleError}
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
                  <div className="flex flex-col gap-6 p-6">
                    <Link href="/" className="flex items-center gap-2 font-bold">
                        <AppWindow className="h-6 w-6 text-primary" />
                        <span className="font-headline text-lg">Symposium Central</span>
                    </Link>
                    <nav className="flex flex-col gap-4">
                      <SheetClose asChild>
                        <Link href="/events" className="text-muted-foreground transition-colors hover:text-foreground">Explore Events</Link>
                      </SheetClose>
                      <SheetClose asChild>
                        <Link href="/#about-event" className="text-muted-foreground transition-colors hover:text-foreground">About</Link>
                      </SheetClose>
                      <SheetClose asChild>
                        <Link href="/code-of-conduct" className="text-muted-foreground transition-colors hover:text-foreground">Code of Conduct</Link>
                      </SheetClose>
                    </nav>
                     <div className="flex flex-col gap-2 pt-4 border-t">
                        {isClient && user ? (
                          <Button onClick={handleLogout}>Log out</Button>
                        ) : isClient && (
                           <GoogleLogin
                                onSuccess={handleGoogleSuccess}
                                onError={handleGoogleError}
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
       <Dialog open={showDepartmentModal} onOpenChange={setShowDepartmentModal}>
        <DialogContent>
            <DialogHeader>
                <DialogTitle>Complete Your Registration</DialogTitle>
                <DialogDescription>
                    Welcome! To finish setting up your account, please select your department.
                </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
                 <div className="grid gap-2">
                    <Label htmlFor="department">Department</Label>
                    <Combobox 
                        items={departments}
                        value={selectedDepartment}
                        onChange={setSelectedDepartment}
                        placeholder={loadingDepartments ? "Loading departments..." : "Select department..."}
                        searchPlaceholder="Search departments..."
                        noResultsMessage="No department found."
                        disabled={loadingDepartments}
                    />
                </div>
            </div>
            <DialogFooter>
                <Button onClick={handleDepartmentSelection} disabled={loadingDepartments}>
                    Continue
                </Button>
            </DialogFooter>
        </DialogContent>
      </Dialog>
    </header>
  );
}

    