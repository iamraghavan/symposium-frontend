
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
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import {
  Calendar,
  Users,
  KeyRound,
  DollarSign,
  Ticket,
  IndianRupee,
  Users2
} from "lucide-react";
import { format, parseISO } from "date-fns";
import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import type { LoggedInUser } from "@/lib/types";
import { isAdmin } from "@/lib/utils";
import { getStatisticsOverview, getFinanceOverview, getRecentParticipants, type StatsOverview, type FinanceOverview, type Participant } from "./actions";
import { useToast } from "@/hooks/use-toast";
import { Skeleton } from "@/components/ui/skeleton";

export default function AdminDashboardPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [user, setUser] = useState<LoggedInUser | null>(null);
  const [apiKey, setApiKey] = useState<string | null>(null);
  
  const [stats, setStats] = useState<StatsOverview | null>(null);
  const [finance, setFinance] = useState<FinanceOverview | null>(null);
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const userData = localStorage.getItem("loggedInUser");
    const userApiKey = localStorage.getItem("userApiKey");

    if (userData && userApiKey) {
      const parsedUser = JSON.parse(userData);
      if (!isAdmin(parsedUser)) {
        router.push('/');
      } else {
        setUser(parsedUser);
        setApiKey(userApiKey);
        fetchDashboardData(parsedUser, userApiKey);
      }
    } else {
      router.push('/c/auth/login?login=s_admin');
    }
  }, [router, toast]);

  const fetchDashboardData = async (currentUser: LoggedInUser, currentApiKey: string) => {
    setIsLoading(true);
    try {
        const fetchPromises = [
            getStatisticsOverview(),
            getRecentParticipants()
        ];
        if (currentUser.role === 'super_admin') {
            fetchPromises.push(getFinanceOverview());
        }

        const [statsData, participantsData, financeData] = await Promise.all(fetchPromises);

        if (statsData) setStats(statsData);
        if (participantsData) setParticipants(participantsData);
        if (financeData && currentUser.role === 'super_admin') setFinance(financeData);
        
    } catch (error) {
        toast({
            variant: "destructive",
            title: "Failed to load dashboard",
            description: (error as Error).message || "An unknown error occurred.",
        });
    } finally {
        setIsLoading(false);
    }
  };

  const kpis = stats?.kpis;
  const registrationData = stats?.sparklines?.registrationsDaily?.map(d => ({
      date: d.date,
      users: d.count
  })) || [];

  if (isLoading || !user) {
    // Render a skeleton layout while loading
    return (
      <div className="flex flex-col gap-6">
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Skeleton className="h-28" />
            <Skeleton className="h-28" />
            <Skeleton className="h-28" />
            <Skeleton className="h-28" />
        </div>
         <Skeleton className="h-40" />
         <div className="grid gap-6 lg:grid-cols-5">
            <Skeleton className="h-96 lg:col-span-3" />
            <Skeleton className="h-96 lg:col-span-2" />
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Users</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold font-headline">{kpis?.users || 0}</div>
            <p className="text-xs text-muted-foreground">in the system</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Events</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold font-headline">{kpis?.events || 0}</div>
            <p className="text-xs text-muted-foreground">across all departments</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Event Registrations
            </CardTitle>
            <Ticket className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold font-headline">{kpis?.registrations || 0}</div>
            <p className="text-xs text-muted-foreground">total event sign-ups</p>
          </CardContent>
        </Card>
         <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Paid Symposium Passes
            </CardTitle>
            <Users2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold font-headline">{kpis?.paidPasses || 0}</div>
            <p className="text-xs text-muted-foreground">unique paid users</p>
          </CardContent>
        </Card>
        {user?.role === 'super_admin' && (
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Gross Revenue</CardTitle>
              <IndianRupee className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold font-headline">₹{(finance?.grossInr || 0).toLocaleString()}</div>
              <p className="text-xs text-muted-foreground">from symposium passes</p>
            </CardContent>
          </Card>
        )}
      </div>

       <Card>
        <CardHeader>
          <CardTitle className="font-headline flex items-center gap-2"><KeyRound/> Your API Key</CardTitle>
          <CardDescription>
            This key is used to authenticate your requests to the API. Do not share it publicly.
          </CardDescription>
        </CardHeader>
        <CardContent>
            <pre className="text-xs bg-muted p-4 rounded-lg overflow-x-auto">
                <code>{apiKey}</code>
            </pre>
        </CardContent>
      </Card>

      <div className="grid gap-6 lg:grid-cols-5">
        <Card className="lg:col-span-3">
          <CardHeader>
            <CardTitle className="font-headline">Daily Registrations</CardTitle>
            <CardDescription>
              Symposium pass registrations over time.
            </CardDescription>
          </CardHeader>
          <CardContent className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={registrationData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis
                  dataKey="date"
                  tickFormatter={(str) => format(parseISO(str), "MMM d")}
                  stroke="#888888"
                  fontSize={12}
                  tickLine={false}
                  axisLine={false}
                />
                <YAxis
                  stroke="#888888"
                  fontSize={12}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(value) => `${value}`}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "hsl(var(--background))",
                    border: "1px solid hsl(var(--border))",
                  }}
                  cursor={{ fill: "hsl(var(--muted))" }}
                />
                <Bar
                  dataKey="users"
                  fill="hsl(var(--primary))"
                  radius={[4, 4, 0, 0]}
                  name="Registrations"
                />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="font-headline">Recent Participants</CardTitle>
            <CardDescription>
              The latest users to join the symposium.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[50px]">S.No</TableHead>
                  <TableHead>User</TableHead>
                  <TableHead>Email</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {participants.slice(0, 5).map((p, index) => (
                  <TableRow key={p._id}>
                    <TableCell className="font-medium">{index + 1}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Avatar className="h-8 w-8">
                          <AvatarImage src={p.picture} alt={p.name} data-ai-hint="person" />
                          <AvatarFallback>
                            {p.name.charAt(0)}
                          </AvatarFallback>
                        </Avatar>
                        <p className="font-medium">{p.name}</p>
                      </div>
                    </TableCell>
                    <TableCell>
                        <p className="text-sm text-muted-foreground">{p.email}</p>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
