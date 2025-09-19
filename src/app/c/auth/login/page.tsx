
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
  CardFooter,
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
  const [loginType, setLoginType] = useState<'super_admin' | 'department_admin' | null>(null);
  const [title, setTitle] = useState("Admin Login");

  useEffect(() => {
    const type = searchParams.get('login');
    if (type === 's_admin' || type === 'd_admin') {
      const role = type === 's_admin' ? 'super_admin' : 'department_admin';
      setLoginType(role);
      setTitle(role === 'super_admin' ? 'Super Admin Login' : 'Department Admin Login');
    } else {
      // Redirect or show an error if login type is invalid
      router.push('/');
    }
  }, [searchParams, router]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const response = await api<ApiSuccessResponse<any>>('/auth/login', {
        method: 'POST',
        body: { email, password },
      });

      if (response.success && response.token && response.user) {
        const user = response.user;

        if (!isAdmin(user)) {
             toast({
                variant: "destructive",
                title: "Access Denied",
                description: "You do not have the required permissions for this portal.",
            });
            return;
        }

        if (loginType && user.role !== loginType) {
             toast({
                variant: "destructive",
                title: "Access Denied",
                description: "Your role does not match the login portal you are using.",
            });
            return;
        }

        localStorage.setItem('jwt', response.token);
        localStorage.setItem('loggedInUser', JSON.stringify(user));

        toast({
          title: "Login Successful",
          description: `Welcome, ${user.name}!`,
        });
        window.location.href = "/u/s/portal/dashboard";
      } else {
        throw new Error((response as any).message || "Login failed.");
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
