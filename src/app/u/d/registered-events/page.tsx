
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
import { events } from "@/lib/data";
import type { LoggedInUser, Event } from "@/lib/types";
import { Calendar, Users } from "lucide-react";
import { format, parseISO } from 'date-fns';

export default function RegisteredEventsPage() {
  const router = useRouter();
  const [user, setUser] = useState<LoggedInUser | null>(null);
  const [userRegisteredEvents, setUserRegisteredEvents] = useState<Event[]>([]);

  useEffect(() => {
    const userData = localStorage.getItem("loggedInUser");
    if (userData) {
        const currentUser = JSON.parse(userData);
        setUser(currentUser);
        // Filter events where the current user is a participant
        const registered = events.filter(event => 
            event.participants.some(participant => participant.email === currentUser.email)
        );
        setUserRegisteredEvents(registered);
    } else {
        router.push('/auth/login');
    }
  }, [router]);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight font-headline">
            Registered Events
          </h2>
          <p className="text-muted-foreground">
            Here are all the events you've registered for.
          </p>
        </div>
      </div>
      {userRegisteredEvents.length > 0 ? (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {userRegisteredEvents.map((event) => (
            <Card key={event.id} className="flex flex-col overflow-hidden">
               <div className="relative h-48 w-full">
                <Image
                    src={event.imageUrl}
                    alt={event.name}
                    fill
                    className="object-cover"
                    data-ai-hint={event.imageHint}
                />
              </div>
              <CardHeader>
                <CardTitle className="font-headline">{event.name}</CardTitle>
                <CardDescription className="flex items-center gap-2 text-sm">
                    <Calendar className="h-4 w-4" />
                    {format(parseISO(event.date), "MMMM d, yyyy")}
                </CardDescription>
              </CardHeader>
              <CardContent className="flex-grow">
                 <Badge variant="secondary">{event.department.name}</Badge>
              </CardContent>
              <CardFooter className="flex justify-between items-center">
                 <div className="flex items-center gap-2">
                    <Users className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm font-medium">
                    {event.participants.length} Participants
                    </span>
                </div>
                <Button asChild variant="default" size="sm">
                  <Link href={`/events/${event.id}`}>View Details</Link>
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
