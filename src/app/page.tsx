"use client";

import Image from 'next/image';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { events } from '@/lib/data';
import { format, parseISO } from 'date-fns';
import { useEffect, useState } from 'react';
import { Calendar, Users, Search, ArrowRight } from 'lucide-react';
import { Input } from '@/components/ui/input';

export default function HomePage() {
  const [formattedDates, setFormattedDates] = useState<Record<string, string>>(
    {}
  );

  useEffect(() => {
    const newFormattedDates: Record<string, string> = {};
    events.forEach((event) => {
      newFormattedDates[event.id] = format(
        parseISO(event.date),
        "MMMM d, yyyy 'at' h:mm a"
      );
    });
    setFormattedDates(newFormattedDates);
  }, []);

  return (
    <div className="flex flex-col min-h-screen">
      <main className="flex-1">
        <section className="relative h-[60vh] flex items-center justify-center text-center bg-gradient-to-r from-primary/80 to-accent/80 text-primary-foreground">
          <Image
            src="https://picsum.photos/seed/symposium/1200/800"
            alt="Symposium background"
            fill
            className="object-cover -z-10"
            data-ai-hint="conference crowd"
          />
           <div className="absolute inset-0 bg-black/50 -z-10" />
          <div className="container px-4 md:px-6">
            <div className="max-w-3xl mx-auto">
              <h1 className="text-4xl font-bold font-headline md:text-6xl text-white">
                Discover Your Next Challenge
              </h1>
              <p className="mt-4 text-lg md:text-xl text-gray-200">
                Explore a wide range of technical and cultural events happening across campus.
              </p>
              <div className="mt-8 flex max-w-lg mx-auto">
                <div className="relative flex-grow">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                  <Input
                    type="search"
                    placeholder="Search for events, departments, or topics..."
                    className="w-full pl-10 pr-4 py-3 h-12 rounded-l-md text-foreground"
                  />
                </div>
                <Button size="lg" className="rounded-l-none h-12">
                  <ArrowRight className="h-5 w-5" />
                   <span className="sr-only">Search</span>
                </Button>
              </div>
            </div>
          </div>
        </section>

        <section className="py-12 md:py-20">
          <div className="container px-4 md:px-6">
             <h2 className="text-3xl font-bold font-headline tracking-tight mb-8">
              Upcoming Events
            </h2>
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {events.map((event) => (
                <Card
                  key={event.id}
                  className="flex flex-col overflow-hidden hover:shadow-lg transition-shadow duration-300"
                >
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
                    <div className="flex justify-between items-start">
                      <CardTitle className="font-headline text-xl mb-1">
                        {event.name}
                      </CardTitle>
                      <Badge variant="secondary">{event.department.name}</Badge>
                    </div>
                    <CardDescription className="flex items-center gap-2 text-sm">
                      <Calendar className="h-4 w-4" />
                      {formattedDates[event.id] || 'Loading...'}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="flex-grow">
                    <p className="text-sm text-muted-foreground">
                      {event.description}
                    </p>
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
          </div>
        </section>
      </main>
    </div>
  );
}
