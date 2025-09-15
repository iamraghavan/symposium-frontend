
"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import type { LoggedInUser } from "@/lib/types";
import { useToast } from "@/hooks/use-toast";

export default function UserProfilePage() {
  const router = useRouter();
  const { toast } = useToast();
  const [user, setUser] = useState<LoggedInUser | null>(null);

  useEffect(() => {
    const userData = localStorage.getItem("loggedInUser");
    if (userData) {
      setUser(JSON.parse(userData));
    } else {
      router.push('/auth/login');
    }
  }, [router]);

  const handleUpdateProfile = (e: React.FormEvent) => {
    e.preventDefault();
    toast({
        title: "Profile Updated",
        description: "Your profile information has been successfully updated.",
    })
  }

  if (!user) {
    return null; // Or a loading spinner
  }

  return (
    <div className="flex flex-col gap-6">
        <div>
          <h2 className="text-3xl font-bold tracking-tight font-headline">
            Profile Settings
          </h2>
          <p className="text-muted-foreground">
            Manage your account details and preferences.
          </p>
        </div>
        <Card>
            <form onSubmit={handleUpdateProfile}>
                <CardHeader>
                    <CardTitle>Your Information</CardTitle>
                    <CardDescription>View and edit your personal details.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                    <div className="flex items-center gap-4">
                        <Avatar className="h-20 w-20">
                            <AvatarImage src={user.picture || `https://picsum.photos/seed/${user.name}/80/80`} alt={user.name} />
                            <AvatarFallback>{user.name?.charAt(0)}</AvatarFallback>
                        </Avatar>
                        <Button variant="outline" type="button">Change Picture</Button>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="name">Name</Label>
                            <Input id="name" defaultValue={user.name} />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="email">Email</Label>
                            <Input id="email" defaultValue={user.email} disabled />
                        </div>
                    </div>
                     <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="department">Department</Label>
                            <Input id="department" defaultValue={user.departmentId || "Not specified"} disabled />
                        </div>
                    </div>
                </CardContent>
                <CardFooter className="border-t px-6 py-4">
                    <Button type="submit">Save Changes</Button>
                </CardFooter>
            </form>
        </Card>
    </div>
  );
}
