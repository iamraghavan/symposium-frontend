

"use client";

import Image from "next/image";
import {
  Card,
  CardContent,
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
import { Button } from "@/components/ui/button";
import { events, winners as allWinners } from "@/lib/data";
import { parseISO, format, differenceInDays } from 'date-fns';
import { notFound, useParams } from "next/navigation";
import { Calendar, Users, Trophy, DollarSign, Building, Globe, Info, Clock, Ticket } from "lucide-react";
import React, { useEffect, useState } from "react";
import Link from "next/link";
import api from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import type { Event, ApiSuccessResponse, Winner } from '@/lib/types';
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
        const response = await api<ApiSuccessResponse<{ data: Event }>>(`/events/${eventId}`);
        if (response.success && response.data) {
          setEvent(response.data.data);
          // Assuming winners are fetched from another endpoint or are part of the event object in the future.
          // For now, we use the mock data filtered by the fetched event's ID.
          setWinners(allWinners.filter(w => w.eventId === response.data?.data?._id));
        } else {
           throw new Error(response.message || "Event not found");
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
  const totalPrizeMoney = event.payment.price > 0 ? (event.payment.price * 10) : 0; // Placeholder logic
  const departmentName = typeof event.department === 'object' ? event.department.name : 'Unknown Department';
  const departmentHeadEmail = typeof event.department === 'object' ? (event.department as any).head?.email || 'info@example.com' : 'info@example.com';

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

      {/* Sub-navigation */}
      <section className="sticky top-[64px] z-30 bg-background shadow-md">
        <div className="container mx-auto px-4 md:px-6">
          <nav className="flex items-center space-x-4 md:space-x-8 -mb-px">
            <Link href="#overview" className="py-4 px-1 inline-flex items-center gap-2 text-sm font-medium border-b-2 border-primary text-primary">
              Overview
            </Link>
             <Link href="#participants" className="py-4 px-1 inline-flex items-center gap-2 text-sm font-medium border-b-2 border-transparent text-muted-foreground hover:text-foreground">
              Participants <Badge variant="secondary">0</Badge>
            </Link>
            <Link href="#winners" className="py-4 px-1 inline-flex items-center gap-2 text-sm font-medium border-b-2 border-transparent text-muted-foreground hover:text-foreground">
              Winners
            </Link>
          </nav>
        </div>
      </section>

      {/* Main Content */}
      <main className="container mx-auto px-4 md:px-6 py-8 md:py-12">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 lg:gap-12">
          {/* Left Column */}
          <div id="overview" className="lg:col-span-2 space-y-8 scroll-mt-24">
            <div>
                <h2 className="text-3xl font-bold font-headline mb-2">{event.name}</h2>
                <p className="text-lg text-muted-foreground">{event.description}</p>
                 <Button className="mt-6">
                    <Ticket className="mr-2 h-4 w-4"/>
                    Register Now
                </Button>
            </div>
             <div id="winners" className="scroll-mt-24">
             <h3 className="text-2xl font-bold font-headline mb-4">Winners</h3>
             {winners.length > 0 ? (
                <Card>
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
                </Card>
             ) : (
                <p className="text-muted-foreground">Winners have not been announced yet. Stay tuned!</p>
             )}
          </div>

          </div>
          {/* Right Sidebar */}
          <div className="lg:col-span-1 space-y-6">
            <Card>
              <CardContent className="p-6 space-y-4">
                 <Badge variant="secondary" className="bg-teal-100 text-teal-800 hover:bg-teal-200">
                    <Clock className="mr-1.5 h-4 w-4"/>
                    {daysLeft > 0 ? `${daysLeft} more days to submit` : 'Submissions closed'}
                </Badge>
                <div>
                  <h3 className="font-semibold text-sm mb-1">Deadline</h3>
                  <p className="text-sm text-muted-foreground flex items-center">
                    {format(parseISO(event.endAt), "MMM d, yyyy @ h:mm a")}
                    <Calendar className="ml-auto h-4 w-4 text-muted-foreground cursor-pointer"/>
                  </p>
                </div>
                <hr />
                <div className="grid grid-cols-2 gap-4 text-sm">
                   <div className="flex items-center gap-2">
                     <Globe className="h-4 w-4 text-muted-foreground" />
                     <span className="capitalize">{event.mode}</span>
                   </div>
                   <div className="flex items-center gap-2">
                     <Building className="h-4 w-4 text-muted-foreground" />
                     <span>Public</span>
                   </div>
                    <div className="flex items-center gap-2">
                     <Trophy className="h-4 w-4 text-muted-foreground" />
                     <span className="font-bold text-primary">${totalPrizeMoney.toLocaleString()} in cash</span>
                   </div>
                   <div id="participants" className="flex items-center gap-2 scroll-mt-24">
                     <Users className="h-4 w-4 text-muted-foreground" />
                     <span>0 participants</span>
                   </div>
                    <div className="flex items-center gap-2">
                     <DollarSign className="h-4 w-4 text-muted-foreground" />
                     <span>{event.payment.price > 0 ? `$${event.payment.price}` : 'Free'}</span>
                   </div>
                </div>
                 <hr />
                 <div>
                    <h3 className="font-semibold text-sm mb-2 flex items-center gap-2">
                        <Info className="h-4 w-4"/>
                        Managed By
                    </h3>
                    <Badge variant="outline">{departmentName}</Badge>
                 </div>
              </CardContent>
            </Card>
             <Card className="bg-muted/50">
                <CardContent className="p-4">
                    <p className="text-sm text-center text-muted-foreground">
                        Questions? <a href={`mailto:${departmentHeadEmail}`} className="text-primary underline">Email the event manager</a>
                    </p>
                </CardContent>
             </Card>
          </div>
        </div>
      </main>
    </div>
  );
}
