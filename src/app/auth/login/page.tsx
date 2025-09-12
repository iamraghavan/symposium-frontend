
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { departments } from "@/lib/data";
import { GoogleIcon } from "@/components/ui/icons";

const SUPERADMIN_EMAIL = "web@egspec.org";
const SUPERADMIN_NAME = "Raghavan";

export default function LoginPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();

    if (name.toLowerCase() === SUPERADMIN_NAME.toLowerCase() && email.toLowerCase() === SUPERADMIN_EMAIL.toLowerCase()) {
      const user = { name: SUPERADMIN_NAME, email: SUPERADMIN_EMAIL, role: 'superadmin' };
      localStorage.setItem('loggedInUser', JSON.stringify(user));
      toast({
        title: "Login Successful",
        description: `Welcome, Super Admin ${user.name}!`,
      });
      router.push("/portal/dashboard");
      return;
    }

    const department = departments.find(
      (dept) => dept.head?.name.toLowerCase() === name.toLowerCase() && dept.head?.email.toLowerCase() === email.toLowerCase()
    );

    if (department && department.head) {
       const user = { name: department.head.name, email: department.head.email, role: 'department', departmentId: department.id };
       localStorage.setItem('loggedInUser', JSON.stringify(user));
      toast({
        title: "Login Successful",
        description: `Welcome, ${department.head.name}!`,
      });
      router.push("/portal/dashboard");
    } else {
      toast({
        variant: "destructive",
        title: "Login Failed",
        description: "Invalid credentials. Please try again.",
      });
    }
  };
  
  const handleGoogleLogin = () => {
    // Placeholder for Google Sign-in logic
    alert("Redirecting to Google for sign-in...");
  };


  return (
    <div className="flex items-center justify-center min-h-[calc(100vh-14rem)]">
      <Card className="w-full max-w-sm">
        <form onSubmit={handleLogin}>
          <CardHeader>
            <CardTitle className="text-2xl font-headline">Login</CardTitle>
            <CardDescription>
              Enter your credentials to access the admin dashboard.
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4">
            <div className="grid gap-2">
              <Label htmlFor="name">Username</Label>
              <Input
                id="name"
                type="text"
                placeholder="Username"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="Mail ID"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
          </CardContent>
          <CardFooter>
            <Button type="submit" className="w-full">Sign in</Button>
          </CardFooter>
        </form>
         <div className="relative mb-6">
          <div className="absolute inset-0 flex items-center">
            <span className="w-full border-t" />
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-background px-2 text-muted-foreground">
              Or continue with
            </span>
          </div>
        </div>
         <CardContent>
          <Button variant="outline" className="w-full" onClick={handleGoogleLogin}>
            <GoogleIcon className="mr-2 h-4 w-4" />
            Sign in with Google
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
