
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";
import {
  Table,
  TableHeader,
  TableRow,
  TableHead,
  TableBody,
  TableCell,
} from "@/components/ui/table";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { users } from "@/lib/data";
import { format, parseISO } from "date-fns";
import type { LoggedInUser, User } from "@/lib/types";
import { isAdmin } from "@/lib/utils";

export default function RegisteredUsersPage() {
  const router = useRouter();
  const [user, setUser] = useState<LoggedInUser | null>(null);
  
  useEffect(() => {
    const userData = localStorage.getItem("loggedInUser");
    if (userData) {
        const parsedUser = JSON.parse(userData);
        if (!isAdmin(parsedUser) || parsedUser.role !== 'super_admin') {
          router.push('/u/s/portal/dashboard');
        } else {
          setUser(parsedUser);
        }
    } else {
        router.push('/c/auth/login?login=s_admin');
    }
  }, [router]);

  return (
    <>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-3xl font-bold tracking-tight font-headline">
            All Users
          </h2>
          <p className="text-muted-foreground">
            A list of all users in the system.
          </p>
        </div>
      </div>
      <Card>
        <CardContent className="pt-6">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>User</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Role</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {users.map((regUser) => (
                <TableRow key={regUser.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Avatar>
                          <AvatarImage src={regUser.avatarUrl} alt={regUser.name} data-ai-hint="person" />
                          <AvatarFallback>{regUser.name.charAt(0)}</AvatarFallback>
                        </Avatar>
                        <p className="font-medium">{regUser.name}</p>
                      </div>
                    </TableCell>
                    <TableCell>
                        <p className="text-muted-foreground">{regUser.email}</p>
                    </TableCell>
                    <TableCell>
                        <Badge variant="outline">{regUser.role || 'user'}</Badge>
                    </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </>
  );
}
