
"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import api from '@/lib/api';
import type { ApiSuccessResponse, LoggedInUser } from '@/lib/types';
import { isAdmin } from "@/lib/utils";

function LoginPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loginType, setLoginType] = useState<'s_admin' | 'd_admin' | null>(null);
  const [title, setTitle] = useState("Admin Login");

  useEffect(() => {
    const type = searchParams.get('login');
    if (type === 's_admin' || type === 'd_admin') {
      setLoginType(type);
      setTitle(type === 's_admin' ? 'Super Admin Login' : 'Department Admin Login');
    } else {
      // Redirect or show an error if login type is invalid
      router.push('/');
    }
  }, [searchParams, router]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const response = await api<ApiSuccessResponse<{ user: LoggedInUser, token: string }>>('/auth/login', {
        method: 'POST',
        body: { email, password },
      });

      if (response.success && response.token && response.user) {
        // Check if the role from backend matches the expected role from URL
        if (!isAdmin(response.user)) {
             toast({
                variant: "destructive",
                title: "Access Denied",
                description: "You do not have the required permissions for this portal.",
            });
            return;
        }

        if ((loginType === 's_admin' && response.user.role !== 'super_admin') || 
            (loginType === 'd_admin' && response.user.role !== 'department_admin')) {
             toast({
                variant: "destructive",
                title: "Access Denied",
                description: "Your role does not match the login portal you are using.",
            });
            return;
        }

        localStorage.setItem('jwt', response.token);
        localStorage.setItem('loggedInUser', JSON.stringify(response.user));

        toast({
          title: "Login Successful",
          description: `Welcome, ${response.user.name}!`,
        });
        window.location.href = "/u/s/portal/dashboard";
      } else {
        throw new Error(response.message || "Login failed.");
      }
    } catch (error) {
      let errorMessage = "An unknown error occurred.";
      try {
          const parsedError = JSON.parse((error as Error).message);
          errorMessage = parsedError.message || errorMessage;
      } catch (e) {
          errorMessage = (error as Error).message;
      }
      toast({
        variant: "destructive",
        title: "Login Failed",
        description: errorMessage,
      });
    }
  };

  return (
    <div className="flex items-center justify-center min-h-[calc(100vh-14rem)]">
      <Card className="w-full max-w-sm">
        <form onSubmit={handleLogin}>
          <CardHeader>
            <CardTitle className="text-2xl font-headline">{title}</CardTitle>
            <CardDescription>
              Enter your credentials to access the portal.
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4">
            <div className="grid gap-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="mail@example.com"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
          </CardContent>
          <CardFooter>
            <Button type="submit" className="w-full">Sign in</Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}


export default function LoginPage() {
    return (
        <Suspense fallback={<div>Loading...</div>}>
            <LoginPageContent />
        </Suspense>
    );
}
