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
      router.push("/admin");
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
      router.push("/admin");
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
            <CardTitle className="text-2xl font-headline">Admin Login</CardTitle>
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
                placeholder="e.g. Raghavan"
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
                placeholder="e.g. web@egspec.org"
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
            <svg
              className="mr-2 h-4 w-4"
              aria-hidden="true"
              focusable="false"
              data-prefix="fab"
              data-icon="google"
              role="img"
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 488 512"
            >
              <path
                fill="currentColor"
                d="M488 261.8C488 403.3 381.5 512 244 512 111.8 512 0 400.2 0 261.8S111.8 11.6 244 11.6C303.4 11.6 355.8 33.4 394.8 68.4l-64.3 62.1C308.2 110.1 278.3 97.4 244 97.4c-83.8 0-152.3 68.5-152.3 152.9s68.5 152.9 152.3 152.9c98.2 0 130.3-71.1 133.5-108.7H244V261.8h244z"
              ></path>
            </svg>
            Sign in with Google
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
