
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
import { Calendar, Users, Trophy, DollarSign, MapPin, Ticket, Building, Globe, Info, Clock } from "lucide-react";
import React, { useEffect, useState } from "react";
import Link from "next/link";

export default function EventDetailPage() {
  const params = useParams();
  const eventId = params.eventId as string;
  const [event, setEvent] = useState<(typeof events)[0] | null>(null);
  const [winners, setWinners] = useState<(typeof allWinners)>([]);
  const [daysLeft, setDaysLeft] = useState(0);

  useEffect(() => {
    const foundEvent = events.find((e) => e.id === eventId);
    if (foundEvent) {
      setEvent(foundEvent);
      const foundWinners = allWinners.filter((w) => w.eventId === eventId);
      setWinners(foundWinners);
      const endDate = parseISO(foundEvent.date);
      const now = new Date();
      setDaysLeft(differenceInDays(endDate, now));
    } else {
      notFound();
    }
  }, [eventId]);

  if (!event) {
    return null;
  }

  const totalPrizeMoney = winners.reduce((acc, winner) => acc + winner.prizeAmount, 0);

  return (
    <div className="bg-background">
      {/* Hero Section */}
      <section className="relative h-64 md:h-80 w-full text-white">
        <Image
          src={event.imageUrl}
          alt={`${event.name} banner`}
          fill
          className="object-cover"
          data-ai-hint={event.imageHint}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/40 to-transparent" />
        <div className="relative h-full flex flex-col justify-end container mx-auto px-4 md:px-6 pb-8">
          <h1 className="text-3xl md:text-5xl font-bold font-headline">{event.name}</h1>
          <p className="text-lg md:text-xl font-medium text-gray-200 mt-2">
            Submit by {format(parseISO(event.date), "MMMM d, yyyy")}
          </p>
        </div>
      </section>

      {/* Sub-navigation */}
      <section className="sticky top-[64px] z-30 bg-background shadow-md">
        <div className="container mx-auto px-4 md:px-6">
          <nav className="flex items-center space-x-4 md:space-x-8 -mb-px">
            <Link href="#" className="py-4 px-1 inline-flex items-center gap-2 text-sm font-medium border-b-2 border-primary text-primary">
              Overview
            </Link>
             <Link href="#" className="py-4 px-1 inline-flex items-center gap-2 text-sm font-medium border-b-2 border-transparent text-muted-foreground hover:text-foreground">
              Participants <Badge variant="secondary">{event.participants.length}</Badge>
            </Link>
            <Link href="#" className="py-4 px-1 inline-flex items-center gap-2 text-sm font-medium border-b-2 border-transparent text-muted-foreground hover:text-foreground">
              Rules
            </Link>
          </nav>
        </div>
      </section>

      {/* Main Content */}
      <main className="container mx-auto px-4 md:px-6 py-8 md:py-12">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 lg:gap-12">
          {/* Left Column */}
          <div className="lg:col-span-2 space-y-8">
            <div>
                <h2 className="text-3xl font-bold font-headline mb-2">{event.name}</h2>
                <p className="text-lg text-muted-foreground">{event.description}</p>
                 <Button className="mt-6">
                    <Ticket className="mr-2 h-4 w-4"/>
                    Join Hackathon
                </Button>
            </div>
             <div>
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
                    {daysLeft > 0 ? `${daysLeft} more days to deadline` : 'Deadline has passed'}
                </Badge>
                <div>
                  <h3 className="font-semibold text-sm mb-1">Deadline</h3>
                  <p className="text-sm text-muted-foreground flex items-center">
                    {format(parseISO(event.date), "MMM d, yyyy @ h:mm a zzz")}
                    <Calendar className="ml-auto h-4 w-4 text-muted-foreground cursor-pointer"/>
                  </p>
                </div>
                <hr />
                <div className="grid grid-cols-2 gap-4 text-sm">
                   <div className="flex items-center gap-2">
                     <Globe className="h-4 w-4 text-muted-foreground" />
                     <span>{event.mode}</span>
                   </div>
                   <div className="flex items-center gap-2">
                     <Building className="h-4 w-4 text-muted-foreground" />
                     <span>Public</span>
                   </div>
                    <div className="flex items-center gap-2">
                     <Trophy className="h-4 w-4 text-muted-foreground" />
                     <span className="font-bold text-primary">${totalPrizeMoney.toLocaleString()} in cash</span>
                   </div>
                   <div className="flex items-center gap-2">
                     <Users className="h-4 w-4 text-muted-foreground" />
                     <span>{event.participants.length} participants</span>
                   </div>
                    <div className="flex items-center gap-2">
                     <DollarSign className="h-4 w-4 text-muted-foreground" />
                     <span>{event.registrationFee > 0 ? `$${event.registrationFee}` : 'Free'}</span>
                   </div>
                </div>
                 <hr />
                 <div>
                    <h3 className="font-semibold text-sm mb-2 flex items-center gap-2">
                        <Info className="h-4 w-4"/>
                        Managed By
                    </h3>
                    <Badge variant="outline">{event.department.name}</Badge>
                 </div>
              </CardContent>
            </Card>
             <Card className="bg-muted/50">
                <CardContent className="p-4">
                    <p className="text-sm text-center text-muted-foreground">
                        Questions? <a href={`mailto:${event.department.head.email}`} className="text-primary underline">Email the hackathon manager</a>
                    </p>
                </CardContent>
             </Card>
          </div>
        </div>
      </main>
    </div>
  );
}
