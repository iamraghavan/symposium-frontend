
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
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import api from "@/lib/api";
import type { Event, ApiSuccessResponse, Department } from "@/lib/types";
import { useToast } from "@/hooks/use-toast";
import { parseISO, format } from "date-fns";
import { notFound, useParams } from "next/navigation";
import { Calendar, Users, Trophy, DollarSign, Edit, Globe, Video, Phone, Mail } from "lucide-react";
import React, { useEffect, useState } from "react";
import { Skeleton } from "@/components/ui/skeleton";

export default function EventDetailPage() {
  const params = useParams();
  const { toast } = useToast();
  const eventId = params.eventId as string;

  const [event, setEvent] = useState<Event | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (eventId) {
      const fetchEvent = async () => {
        setIsLoading(true);
        try {
          const response = await api<ApiSuccessResponse<{ event: Event }>>(`/events/admin/${eventId}`, { authenticated: true });
          if(response.success && response.data){
            setEvent(response.data as unknown as Event);
          } else {
             throw new Error("Event data not found in response")
          }
        } catch (error) {
          toast({ variant: 'destructive', title: 'Error', description: 'Could not fetch event details.'});
          console.error("Failed to fetch event:", error)
          notFound();
        } finally {
          setIsLoading(false);
        }
      };
      fetchEvent();
    }
  }, [eventId, toast]);

  const getFormattedDate = (dateString?: string) => {
     if (!dateString) return "Not specified";
    try {
      return format(parseISO(dateString), "EEEE, MMMM d, yyyy 'at' h:mm a");
    } catch (e) {
      return "Invalid Date";
    }
  }

  const getDepartmentName = (department?: Department | string) => {
    if (!department) return 'N/A';
    if (typeof department === 'object') return department.name;
    return 'N/A';
  }

  if (isLoading) {
    return (
      <div className="container py-6 space-y-6">
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-[400px] w-full" />
      </div>
    );
  }

  if (!event) {
    return notFound();
  }

  const totalRevenue = 0; // Replace with actual data if available
  const totalPrizes = 0; // Replace with actual data if available

  return (
    <div className="container py-6">
    <Tabs defaultValue="details" className="w-full">
      <TabsList className="grid w-full grid-cols-4">
        <TabsTrigger value="details">Details</TabsTrigger>
        <TabsTrigger value="participants">Participants</TabsTrigger>
        <TabsTrigger value="winners">Winners</TabsTrigger>
        <TabsTrigger value="finance">Finance</TabsTrigger>
      </TabsList>
      <TabsContent value="details">
        <Card>
          <CardHeader>
            <div className="flex justify-between items-start">
              <div>
                <h1 className="text-2xl font-bold tracking-tight font-headline mb-1">{event.name}</h1>
                <p className="text-muted-foreground">{event.description}</p>
              </div>
              <Button variant="outline" size="sm">
                <Edit className="mr-2 h-4 w-4"/>
                Edit Event
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
             <div className="grid md:grid-cols-2 gap-4 text-sm">
                <div className="flex items-start gap-3">
                    <Calendar className="h-5 w-5 text-muted-foreground mt-0.5" />
                    <div>
                        <p className="font-semibold">Event Timing</p>
                        <p className="text-muted-foreground">{getFormattedDate(event.startAt)} to {getFormattedDate(event.endAt)}</p>
                    </div>
                </div>
                <div className="flex items-start gap-3">
                    {event.mode === 'online' ? <Video className="h-5 w-5 text-muted-foreground mt-0.5"/> : <Globe className="h-5 w-5 text-muted-foreground mt-0.5"/>}
                    <div>
                        <p className="font-semibold">Mode & Venue</p>
                        <p className="text-muted-foreground capitalize">
                            {event.mode} {event.mode === 'online' ? `(${event.online?.provider})` : ''} - {event.mode === 'online' ? <a href={event.online?.url} className="text-primary underline">{event.online.url}</a> : event.offline?.venueName}
                        </p>
                    </div>
                </div>
                <div className="flex items-start gap-3">
                    <DollarSign className="h-5 w-5 text-muted-foreground mt-0.5" />
                    <div>
                        <p className="font-semibold">Registration</p>
                        <p className="text-muted-foreground">{event.payment.price === 0 ? 'Free' : `${event.payment.currency} ${event.payment.price}`} ({event.payment.method})</p>
                    </div>
                </div>
             </div>
            <Separator />
             <div className="space-y-2">
                <h3 className="font-semibold">Contacts</h3>
                {event.contacts?.map((contact, index) => (
                    <div key={index} className="text-sm flex items-center gap-4 text-muted-foreground">
                       <span className="font-medium text-foreground">{contact.name}</span>
                       {contact.email && <div className="flex items-center gap-1.5"><Mail className="h-4 w-4"/>{contact.email}</div>}
                       {contact.phone && <div className="flex items-center gap-1.5"><Phone className="h-4 w-4"/>{contact.phone}</div>}
                    </div>
                ))}
            </div>
             <Separator />
            <div className="flex items-center gap-2">
                <p className="text-sm font-medium">Department:</p>
                <Badge variant="secondary">{getDepartmentName(event.department)}</Badge>
            </div>
            <div className="flex items-center gap-2">
                 <p className="text-sm font-medium">Status:</p>
                 <Badge variant={event.status === 'published' ? 'default' : 'outline'}>{event.status}</Badge>
            </div>
          </CardContent>
        </Card>
      </TabsContent>
      <TabsContent value="participants">
        <Card>
          <CardHeader>
            <CardTitle className="font-headline">Registered Users</CardTitle>
            <CardDescription>
              A list of all users registered for {event.name}.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-1 items-center justify-center rounded-lg border border-dashed shadow-sm h-60">
              <div className="flex flex-col items-center gap-2 text-center">
                <Users className="h-10 w-10 text-muted-foreground" />
                <h3 className="text-xl font-bold tracking-tight">No Participants Yet</h3>
                <p className="text-sm text-muted-foreground">User registrations will appear here.</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </TabsContent>
      <TabsContent value="winners">
        <Card>
          <CardHeader>
            <CardTitle className="font-headline">Winner Details</CardTitle>
            <CardDescription>
              Winners and prize money distribution for {event.name}.
            </CardDescription>
          </CardHeader>
           <CardContent>
            <div className="flex flex-1 items-center justify-center rounded-lg border border-dashed shadow-sm h-60">
              <div className="flex flex-col items-center gap-2 text-center">
                <Trophy className="h-10 w-10 text-muted-foreground" />
                <h3 className="text-xl font-bold tracking-tight">No Winners Recorded</h3>
                <p className="text-sm text-muted-foreground">Winner information will appear here once finalized.</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </TabsContent>
       <TabsContent value="finance">
        <Card>
          <CardHeader>
            <CardTitle className="font-headline">Financial Summary</CardTitle>
            <CardDescription>
              Financial details for {event.name}.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-3">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
                  <DollarSign className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold font-headline">${totalRevenue.toLocaleString()}</div>
                  <p className="text-xs text-muted-foreground">From 0 registrations</p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Prizes Awarded</CardTitle>
                  <Trophy className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold font-headline">${totalPrizes.toLocaleString()}</div>
                   <p className="text-xs text-muted-foreground">To 0 winners</p>
                </CardContent>
              </Card>
               <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Net Income</CardTitle>
                  <DollarSign className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className={`text-2xl font-bold font-headline ${totalRevenue - totalPrizes >= 0 ? 'text-green-600' : 'text-red-600'}`}>${(totalRevenue - totalPrizes).toLocaleString()}</div>
                  <p className="text-xs text-muted-foreground">Revenue minus prizes</p>
                </CardContent>
              </Card>
            </div>
          </CardContent>
        </Card>
      </TabsContent>
    </Tabs>
    </div>
  );
}
