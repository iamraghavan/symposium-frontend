
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { LoggedInUser, Registration, ApiSuccessResponse, Event } from "@/lib/types";
import { Calendar, Users, Info } from "lucide-react";
import { format, parseISO } from 'date-fns';
import api from "@/lib/api";
import { useToast } from "@/hooks/use-toast";

export default function RegisteredEventsPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [user, setUser] = useState<LoggedInUser | null>(null);
  const [registrations, setRegistrations] = useState<Registration[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const userData = localStorage.getItem("loggedInUser");
    if (userData) {
        const currentUser = JSON.parse(userData);
        setUser(currentUser);
        fetchRegistrations();
    } else {
        router.push('/auth/login');
    }
  }, [router]);

  const fetchRegistrations = async () => {
    setIsLoading(true);
    try {
        const response = await api<ApiSuccessResponse<Registration[]>>('/registrations/my', { authenticated: true });
        if (response.success) {
            // The actual event data is nested, let's process it.
            const processedRegistrations = response.data.map(reg => ({
              ...reg,
              event: reg.event as Event // Assume it's populated from backend
            }));
            setRegistrations(processedRegistrations);
        }
    } catch(e) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Could not fetch your registered events.",
      });
    } finally {
        setIsLoading(false);
    }
  }
  
  const getDepartmentName = (event: Event) => {
    if (typeof event.department === 'object' && event.department !== null) {
      return event.department.name;
    }
    return 'N/A';
  }

  const getStatusVariant = (status: string) => {
    switch (status) {
      case 'confirmed': return 'default';
      case 'pending': return 'secondary';
      case 'cancelled': return 'destructive';
      default: return 'outline';
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight font-headline">
            My Registrations
          </h2>
          <p className="text-muted-foreground">
            Here are all the events you've registered for.
          </p>
        </div>
      </div>
      {isLoading ? (
         <p>Loading your registrations...</p>
      ) : registrations.length > 0 ? (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {registrations.map((reg) => (
            <Card key={reg._id} className="flex flex-col overflow-hidden">
              <div className="relative h-48 w-full">
                <Image
                    src={reg.event.thumbnailUrl || 'https://picsum.photos/seed/event/400/250'}
                    alt={reg.event.name}
                    fill
                    className="object-cover"
                    data-ai-hint={reg.event.imageHint || "event placeholder"}
                />
              </div>
              <CardHeader>
                <div className="flex justify-between items-start">
                    <CardTitle className="font-headline">{reg.event.name}</CardTitle>
                    <Badge variant={getStatusVariant(reg.status)} className="capitalize">{reg.status}</Badge>
                </div>
                <CardDescription className="flex items-center gap-2 text-sm pt-1">
                    <Calendar className="h-4 w-4" />
                    {format(parseISO(reg.event.startAt), "MMMM d, yyyy")}
                </CardDescription>
              </CardHeader>
              <CardContent className="flex-grow">
                 <Badge variant="outline">{getDepartmentName(reg.event)}</Badge>
              </CardContent>
              <CardFooter className="flex justify-between items-center bg-muted/50 p-4">
                 <div className="flex items-center gap-2">
                    <Info className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm font-medium text-muted-foreground">
                      Payment: <span className="font-semibold capitalize text-foreground">{reg.payment.status}</span>
                    </span>
                </div>
                <Button asChild variant="default" size="sm">
                  <Link href={`/events/${reg.event._id}`}>View Details</Link>
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      ) : (
        <div className="flex flex-1 items-center justify-center rounded-lg border border-dashed shadow-sm h-[calc(100vh-12rem)]">
          <div className="flex flex-col items-center gap-4 text-center">
            <h3 className="text-2xl font-bold tracking-tight font-headline">
              No Registered Events
            </h3>
            <p className="text-sm text-muted-foreground max-w-md">
              You haven't registered for any events yet. Explore the events and join some!
            </p>
            <Button asChild>
              <Link href="/events">Explore Events</Link>
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
