
"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
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
import type { LoggedInUser } from '@/lib/types';
import { isAdmin } from "@/lib/utils";

function setCookie(name: string, value: string, days: number) {
    let expires = "";
    if (days) {
        const date = new Date();
        date.setTime(date.getTime() + (days*24*60*60*1000));
        expires = "; expires=" + date.toUTCString();
    }
    document.cookie = name + "=" + (value || "")  + expires + "; path=/";
}

export default function LoginPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const response = await api<any>('/auth/login', {
        method: 'POST',
        body: { email, password },
      });

      if (response.success && response.user && response.apiKey) {
        const user = response.user;
        
        localStorage.setItem('userApiKey', response.apiKey);
        localStorage.setItem('loggedInUser', JSON.stringify(user));
        
        setCookie('apiKey', response.apiKey, 7);
        setCookie('loggedInUser', JSON.stringify(user), 7);


        toast({
          title: "Login Successful",
          description: `Welcome, ${user.name}!`,
        });
        
        if (isAdmin(user)) {
             window.location.href = "/u/s/portal/dashboard";
        } else {
             window.location.href = "/u/d/dashboard";
        }

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
            <CardTitle className="text-2xl font-headline">User Login</CardTitle>
            <CardDescription>
              Enter your credentials to access your account.
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
          <CardFooter className="flex-col gap-4">
            <Button type="submit" className="w-full">Sign in</Button>
             <div className="mt-4 text-center text-sm">
                Don&apos;t have an account?{" "}
                <Link href="/auth/signup" className="underline">
                Sign up
                </Link>
            </div>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
