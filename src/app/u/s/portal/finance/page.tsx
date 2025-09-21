
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Banknote, IndianRupee, Users } from "lucide-react";
import type { LoggedInUser, Payment } from "@/lib/types";
import { isAdmin } from "@/lib/utils";
import { getPayments } from "./actions";
import { useToast } from "@/hooks/use-toast";
import { format, parseISO } from "date-fns";

export default function AdminFinancePage() {
  const router = useRouter();
  const { toast } = useToast();
  const [user, setUser] = useState<LoggedInUser | null>(null);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const userData = localStorage.getItem("loggedInUser");
    if (userData) {
      const parsedUser = JSON.parse(userData) as LoggedInUser;
      if (parsedUser.role !== 'super_admin') {
        router.push('/u/s/portal/dashboard');
      } else {
        setUser(parsedUser);
        fetchPayments();
      }
    } else {
      router.push('/c/auth/login?login=s_admin');
    }
  }, [router]);

  const fetchPayments = async () => {
    setIsLoading(true);
    try {
        const fetchedPayments = await getPayments();
        setPayments(fetchedPayments);
    } catch(error) {
        toast({
            variant: "destructive",
            title: "Error",
            description: (error as Error).message || "Could not fetch payments.",
        });
    } finally {
        setIsLoading(false);
    }
  };

  if (!user || user.role !== 'super_admin') {
    return null; // or a loading spinner while redirecting
  }

  const totalRevenue = payments.reduce((acc, p) => p.status === 'paid' ? acc + p.amount : acc, 0) / 100;
  const totalTransactions = payments.length;

  const getStatusVariant = (status: string) => {
    switch (status) {
        case 'paid': return 'default';
        case 'pending': return 'secondary';
        case 'failed': return 'destructive';
        default: return 'outline';
    }
  };
  
  const getUser = (payment: Payment) => {
      if (typeof payment.user === 'object' && payment.user !== null) {
          return payment.user;
      }
      return null;
  }

  return (
    <div className="flex flex-col gap-6">
        <div>
          <h2 className="text-3xl font-bold tracking-tight font-headline">
            Financial Overview
          </h2>
          <p className="text-muted-foreground">
            Track all transactions and revenue from the symposium.
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
                <IndianRupee className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
                <div className="text-2xl font-bold font-headline">₹{totalRevenue.toLocaleString()}</div>
                <p className="text-xs text-muted-foreground">from successful payments</p>
            </CardContent>
            </Card>
            <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Transactions</CardTitle>
                <Banknote className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
                <div className="text-2xl font-bold font-headline">{totalTransactions}</div>
                <p className="text-xs text-muted-foreground">across all payment types</p>
            </CardContent>
            </Card>
        </div>
        
        <Card>
            <CardHeader>
                <CardTitle>All Transactions</CardTitle>
                <CardDescription>A complete log of all payments initiated.</CardDescription>
            </CardHeader>
            <CardContent>
                <Table>
                <TableHeader>
                    <TableRow>
                    <TableHead>User</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Order ID</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Date</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {isLoading ? (
                        <TableRow>
                            <TableCell colSpan={5} className="h-24 text-center">
                                Loading transactions...
                            </TableCell>
                        </TableRow>
                    ) : payments.length > 0 ? (
                        payments.map((p) => {
                            const paymentUser = getUser(p);
                            return (
                                <TableRow key={p._id}>
                                <TableCell>
                                    {paymentUser ? (
                                        <div className="flex items-center gap-3">
                                            <Avatar className="h-9 w-9">
                                                <AvatarImage src={paymentUser.picture} alt={paymentUser.name} />
                                                <AvatarFallback>{paymentUser.name.charAt(0)}</AvatarFallback>
                                            </Avatar>
                                            <div>
                                                <p className="font-medium">{paymentUser.name}</p>
                                                <p className="text-xs text-muted-foreground">{paymentUser.email}</p>
                                            </div>
                                        </div>
                                    ) : (
                                        <p className="text-muted-foreground">N/A</p>
                                    )}
                                </TableCell>
                                <TableCell>₹{(p.amount / 100).toFixed(2)}</TableCell>
                                <TableCell className="font-mono text-xs">{p.orderId}</TableCell>
                                <TableCell>
                                    <Badge variant={getStatusVariant(p.status)} className="capitalize">{p.status}</Badge>
                                </TableCell>
                                <TableCell>{format(parseISO(p.createdAt), "MMM d, yyyy h:mm a")}</TableCell>
                                </TableRow>
                            )
                        })
                    ) : (
                        <TableRow>
                            <TableCell colSpan={5} className="h-24 text-center">
                                No transactions found.
                            </TableCell>
                        </TableRow>
                    )}
                </TableBody>
                </Table>
            </CardContent>
        </Card>
    </div>
  );
}
