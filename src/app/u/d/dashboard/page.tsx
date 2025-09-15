
"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import {
  Calendar,
  Users,
} from "lucide-react";
import { events, users } from "@/lib/data";
import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import type { LoggedInUser } from "@/lib/types";


const totalParticipants = new Set(events.flatMap(event => event.participants.map(p => p.id))).size;
const totalRevenue = events.reduce((acc, event) => acc + event.participants.length * event.registrationFee, 0);

export default function UserDashboardPage() {
  const router = useRouter();
  const [user, setUser] = useState<LoggedInUser | null>(null);
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    const userData = localStorage.getItem("loggedInUser");
    if (userData) {
      setUser(JSON.parse(userData));
    } else {
      router.push('/auth/login');
    }
    setIsClient(true);
  }, [router]);

  const userRegisteredEvents = events.filter(event => event.participants.some(p => p.email === user?.email));


  if (!isClient) {
    return null; // or a loading spinner
  }

  return (
    <div className="flex flex-col gap-6">
       <h1 className="text-3xl font-bold font-headline">Welcome, {user?.name}!</h1>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Registered Events</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold font-headline">{userRegisteredEvents.length}</div>
            <p className="text-xs text-muted-foreground">You have registered for {userRegisteredEvents.length} events</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Total Events
            </CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold font-headline">{events.length}</div>
            <p className="text-xs text-muted-foreground">Available in the symposium</p>
          </CardContent>
        </Card>
      </div>

      <Card>
          <CardHeader>
            <CardTitle className="font-headline">Your Recent Registrations</CardTitle>
            <CardDescription>
              A quick look at the events you've signed up for.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Event Name</TableHead>
                  <TableHead>Department</TableHead>
                  <TableHead>Date</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {userRegisteredEvents.slice(0, 5).map((event) => (
                  <TableRow key={event.id}>
                    <TableCell>
                      <p className="font-medium">{event.name}</p>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{event.department.name}</Badge>
                    </TableCell>
                     <TableCell>
                      <p className="text-sm text-muted-foreground">{new Date(event.date).toLocaleDateString()}</p>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
    </div>
  );
}

