
"use client";

import Image from "next/image";
import {
  Card,
  CardContent,
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
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { winners as allWinners } from "@/lib/data";
import { parseISO, format, differenceInDays } from 'date-fns';
import { notFound, useParams } from "next/navigation";
import { Calendar, Users, Trophy, DollarSign, Globe, Info, Clock, Ticket, ExternalLink, Phone, Mail, Link as LinkIcon } from "lucide-react";
import React, { useEffect, useState } from "react";
import api from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import type { Event, ApiSuccessResponse, Winner, Department } from '@/lib/types';
import { Skeleton } from "@/components/ui/skeleton";

export default function EventDetailPage() {
  const params = useParams();
  const { toast } = useToast();
  const eventId = params.eventId as string;
  
  const [event, setEvent] = useState<Event | null>(null);
  const [winners, setWinners] = useState<Winner[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!eventId) return;

    const fetchEventData = async () => {
      setIsLoading(true);
      try {
        const response = await api<ApiSuccessResponse<Event>>(`/events/${eventId}`);
        if (response.success && response.data) {
          setEvent(response.data);
          setWinners(allWinners.filter(w => w.eventId === response.data?._id));
        } else {
           throw new Error((response as any).message || "Event not found");
        }
      } catch (error) {
        toast({ variant: 'destructive', title: 'Error', description: 'Could not fetch event details.'});
        notFound();
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchEventData();
  }, [eventId, toast]);
  
  if (isLoading) {
    return (
      <div className="bg-background">
        <div className="relative h-64 md:h-80 w-full text-white">
          <Skeleton className="h-full w-full" />
        </div>
        <div className="container mx-auto px-4 md:px-6 py-8 md:py-12">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 lg:gap-12">
              <div className="lg:col-span-2 space-y-8">
                 <Skeleton className="h-10 w-3/4" />
                 <Skeleton className="h-24 w-full" />
                 <Skeleton className="h-10 w-32" />
              </div>
               <div className="lg:col-span-1 space-y-6">
                  <Skeleton className="h-64 w-full" />
               </div>
            </div>
        </div>
      </div>
    )
  }

  if (!event) {
    return notFound();
  }

  const daysLeft = differenceInDays(parseISO(event.endAt), new Date());
  const departmentName = typeof event.department === 'object' ? event.department.name : 'Unknown Department';
  const paymentMethodText = event.payment.method === 'none' ? 'Free' : event.payment.method === 'gateway' ? 'Online Gateway' : 'QR Code';

  return (
    <div className="bg-background">
      {/* Hero Section */}
      <section className="relative h-64 md:h-80 w-full text-white">
        <Image
          src={event.thumbnailUrl || 'https://picsum.photos/seed/event-hero/1200/400'}
          alt={`${event.name} banner`}
          fill
          className="object-cover"
          data-ai-hint={event.imageHint || 'event banner'}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/40 to-transparent" />
        <div className="relative h-full flex flex-col justify-end container mx-auto px-4 md:px-6 pb-8">
          <h1 className="text-3xl md:text-5xl font-bold font-headline">{event.name}</h1>
          <p className="text-lg md:text-xl font-medium text-gray-200 mt-2">
            Submit by {format(parseISO(event.endAt), "MMMM d, yyyy")}
          </p>
        </div>
      </section>

      {/* Main Content */}
      <main className="container mx-auto px-4 md:px-6 py-8 md:py-12">
        <Tabs defaultValue="overview" className="w-full">
          <TabsList className="grid w-full grid-cols-3 mb-8">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="participants">Participants</TabsTrigger>
            <TabsTrigger value="winners">Winners</TabsTrigger>
          </TabsList>
          
          <TabsContent value="overview">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 lg:gap-12">
              {/* Left Column */}
              <div className="lg:col-span-2 space-y-8">
                <div>
                    <p className="text-lg text-muted-foreground">{event.description}</p>
                     <Button className="mt-6">
                        <Ticket className="mr-2 h-4 w-4"/>
                        Register Now
                    </Button>
                </div>
                
                <div id="contacts">
                  <h3 className="text-2xl font-bold font-headline mb-4">Contacts</h3>
                  <Card>
                    <CardContent className="p-6 space-y-4">
                      {event.contacts?.map((contact, index) => (
                        <div key={index} className="flex items-start gap-4">
                          <Avatar className="mt-1">
                            <AvatarFallback>{contact.name.charAt(0)}</AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="font-semibold">{contact.name}</p>
                            <div className="text-sm text-muted-foreground space-y-1 mt-1">
                              {contact.email && <a href={`mailto:${contact.email}`} className="flex items-center gap-2 hover:text-primary"><Mail className="h-4 w-4" />{contact.email}</a>}
                              {contact.phone && <a href={`tel:${contact.phone}`} className="flex items-center gap-2 hover:text-primary"><Phone className="h-4 w-4" />{contact.phone}</a>}
                            </div>
                          </div>
                        </div>
                      ))}
                    </CardContent>
                  </Card>
                </div>

              </div>
              {/* Right Sidebar */}
              <div className="lg:col-span-1 space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="font-headline">Event Details</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                     <Badge variant="secondary" className="w-full justify-center bg-teal-100 text-teal-800 hover:bg-teal-200">
                        <Clock className="mr-1.5 h-4 w-4"/>
                        {daysLeft > 0 ? `${daysLeft} more days to submit` : 'Submissions closed'}
                    </Badge>
                    
                    <div className="space-y-3 text-sm">
                       <div className="flex items-start">
                         <Calendar className="mr-3 h-4 w-4 text-muted-foreground mt-0.5" />
                         <div>
                           <h3 className="font-semibold text-sm">Date & Time</h3>
                           <p className="text-muted-foreground">{format(parseISO(event.startAt), "MMM d, yyyy, h:mm a")} - {format(parseISO(event.endAt), "h:mm a")}</p>
                         </div>
                       </div>
                       <div className="flex items-start">
                         <Globe className="mr-3 h-4 w-4 text-muted-foreground mt-0.5" />
                         <div>
                           <h3 className="font-semibold text-sm">Mode & Location</h3>
                           <p className="text-muted-foreground capitalize">
                            {event.mode} - {event.mode === 'online' ? <a href={event.online?.url} target="_blank" rel="noopener noreferrer" className="text-primary underline flex items-center gap-1">Meeting Link <ExternalLink className="h-3 w-3"/></a> : event.offline?.venueName}
                           </p>
                           {event.mode === 'offline' && <p className="text-xs text-muted-foreground">{event.offline?.address}</p>}
                         </div>
                       </div>
                       <div className="flex items-start">
                         <DollarSign className="mr-3 h-4 w-4 text-muted-foreground mt-0.5" />
                         <div>
                           <h3 className="font-semibold text-sm">Registration Fee</h3>
                           <p className="text-muted-foreground">{event.payment.price > 0 ? `${event.payment.currency} ${event.payment.price}` : 'Free'} ({paymentMethodText})</p>
                         </div>
                       </div>
                       <div className="flex items-start">
                         <Users className="mr-3 h-4 w-4 text-muted-foreground mt-0.5" />
                         <div>
                           <h3 className="font-semibold text-sm">Participants</h3>
                           <p className="text-muted-foreground">0 registered</p>
                         </div>
                       </div>
                    </div>

                     <hr />
                     <div className="space-y-3 text-sm">
                        <div className="flex items-start">
                            <Info className="mr-3 h-4 w-4 text-muted-foreground mt-0.5"/>
                            <div>
                                <h3 className="font-semibold text-sm">Managed By</h3>
                                <Badge variant="outline">{departmentName}</Badge>
                            </div>
                        </div>
                        {event.departmentSite && (
                          <div className="flex items-start">
                              <LinkIcon className="mr-3 h-4 w-4 text-muted-foreground mt-0.5"/>
                              <div>
                                  <h3 className="font-semibold text-sm">Event Website</h3>
                                  <a href={event.departmentSite} target="_blank" rel="noopener noreferrer" className="text-primary underline flex items-center gap-1">{event.departmentSite} <ExternalLink className="h-3 w-3"/></a>
                              </div>
                          </div>
                        )}
                     </div>
                  </CardContent>
                </Card>
                 <Card className="bg-muted/50">
                    <CardContent className="p-4">
                        <p className="text-sm text-center text-muted-foreground">
                            Questions? <a href={`mailto:${event.contactEmail}`} className="text-primary underline">Email the event manager</a>
                        </p>
                    </CardContent>
                 </Card>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="participants">
              <Card>
                  <CardHeader>
                      <CardTitle>Participants</CardTitle>
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
                    <CardTitle>Winners</CardTitle>
                </CardHeader>
                <CardContent>
                    {winners.length > 0 ? (
                        <Table>
                        <TableHeader>
                            <TableRow>
                            <TableHead>Position</TableHead>
                            <TableHead>Winner</TableHead>
                            <TableHead>Prize Amount</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {winners.map((winner) => (
                            <TableRow key={winner.id}>
                                <TableCell>
                                <div className="flex items-center gap-2">
                                    <Trophy className={`h-6 w-6 ${winner.position === 1 ? 'text-yellow-500' : winner.position === 2 ? 'text-gray-400' : 'text-orange-400'}`} />
                                    <span className="font-bold text-lg">{winner.position}</span>
                                </div>
                                </TableCell>
                                <TableCell>
                                <div className="flex items-center gap-3">
                                    <Avatar>
                                    <AvatarImage src={winner.user.avatarUrl} alt={winner.user.name} data-ai-hint="person"/>
                                    <AvatarFallback>{winner.user.name.charAt(0)}</AvatarFallback>
                                    </Avatar>
                                    <div>
                                    <p className="font-medium">{winner.user.name}</p>
                                    <p className="text-xs text-muted-foreground">{winner.user.college}</p>
                                    </div>
                                </div>
                                </TableCell>
                                <TableCell className="font-semibold">${winner.prizeAmount.toLocaleString()}</TableCell>
                            </TableRow>
                            ))}
                        </TableBody>
                        </Table>
                    ) : (
                         <div className="flex flex-1 items-center justify-center rounded-lg border border-dashed shadow-sm h-60">
                            <div className="flex flex-col items-center gap-2 text-center">
                                <Trophy className="h-10 w-10 text-muted-foreground" />
                                <h3 className="text-xl font-bold tracking-tight">Winners Not Announced</h3>
                                <p className="text-sm text-muted-foreground">Winners have not been announced yet. Stay tuned!</p>
                            </div>
                        </div>
                    )}
                </CardContent>
             </Card>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
