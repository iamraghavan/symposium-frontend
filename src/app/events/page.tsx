
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
import { events as allEvents, departments } from '@/lib/data';
import { format, parseISO } from 'date-fns';
import { useEffect, useState } from 'react';
import { Calendar, Users } from 'lucide-react';
import type { Event } from '@/lib/types';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";


export default function EventsPage() {
  const [events, setEvents] = useState<Event[]>(allEvents);
  const [filteredEvents, setFilteredEvents] = useState<Event[]>(allEvents);
  const [formattedDates, setFormattedDates] = useState<Record<string, string>>({});

  const [modeFilter, setModeFilter] = useState("all");
  const [departmentFilter, setDepartmentFilter] = useState("all");
  const [priceFilter, setPriceFilter] = useState("all");
  const [categoryFilter, setCategoryFilter] = useState("all");

  useEffect(() => {
    const newFormattedDates: Record<string, string> = {};
    allEvents.forEach((event) => {
      newFormattedDates[event.id] = format(
        parseISO(event.date),
        "MMMM d, yyyy 'at' h:mm a"
      );
    });
    setFormattedDates(newFormattedDates);
  }, []);

  useEffect(() => {
    let tempEvents = [...events];

    if (modeFilter !== 'all') {
      tempEvents = tempEvents.filter(event => event.mode === modeFilter);
    }
    if (departmentFilter !== 'all') {
      tempEvents = tempEvents.filter(event => event.department.id === departmentFilter);
    }
    if (priceFilter !== 'all') {
      tempEvents = tempEvents.filter(event => priceFilter === 'free' ? event.registrationFee === 0 : event.registrationFee > 0);
    }
    if (categoryFilter !== 'all') {
      tempEvents = tempEvents.filter(event => event.category === categoryFilter);
    }

    setFilteredEvents(tempEvents);
  }, [events, modeFilter, departmentFilter, priceFilter, categoryFilter]);


  const EventCard = ({ event }: { event: Event }) => (
      <Card
        key={event.id}
        className="flex flex-col overflow-hidden h-full hover:shadow-lg transition-shadow duration-300"
      >
        <div className="relative h-48 w-full">
          <Image
            src={event.imageUrl}
            alt={event.name}
            fill
            className="object-cover"
            data-ai-hint={event.imageHint}
          />
           <Badge className="absolute top-2 right-2" variant={event.mode === 'online' ? 'default' : 'secondary'}>
              {event.mode === 'online' ? 'Online' : 'Offline'}
          </Badge>
        </div>
        <CardHeader>
          <div className="flex justify-between items-start">
            <CardTitle className="font-headline text-xl mb-1">
              {event.name}
            </CardTitle>
            <Badge variant="outline">{event.department.name}</Badge>
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
  )

  return (
    <div className="container mx-auto px-4 py-8 md:py-12">
      <div className="mb-8">
        <h1 className="text-4xl font-bold font-headline tracking-tight">All Events</h1>
        <p className="text-muted-foreground mt-2">Browse, filter, and discover all the exciting events happening.</p>
      </div>

       <div className="flex flex-wrap gap-4 mb-8 p-4 bg-muted rounded-lg">
          <Select value={modeFilter} onValueChange={setModeFilter}>
            <SelectTrigger className="w-full sm:w-auto flex-1 min-w-[150px]">
              <SelectValue placeholder="Event Mode" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Modes</SelectItem>
              <SelectItem value="online">Online</SelectItem>
              <SelectItem value="offline">Offline</SelectItem>
            </SelectContent>
          </Select>

          <Select value={departmentFilter} onValueChange={setDepartmentFilter}>
            <SelectTrigger className="w-full sm:w-auto flex-1 min-w-[150px]">
              <SelectValue placeholder="Department" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Departments</SelectItem>
              {departments.map(dept => (
                <SelectItem key={dept.id} value={dept.id}>{dept.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={priceFilter} onValueChange={setPriceFilter}>
            <SelectTrigger className="w-full sm:w-auto flex-1 min-w-[150px]">
              <SelectValue placeholder="Price" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Prices</SelectItem>
              <SelectItem value="free">Free</SelectItem>
              <SelectItem value="paid">Paid</SelectItem>
            </SelectContent>
          </Select>

          <Select value={categoryFilter} onValueChange={setCategoryFilter}>
            <SelectTrigger className="w-full sm:w-auto flex-1 min-w-[150px]">
              <SelectValue placeholder="Category" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              <SelectItem value="technical">Technical</SelectItem>
              <SelectItem value="non-technical">Non-Technical</SelectItem>
            </SelectContent>
          </Select>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredEvents.map((event) => (
          <EventCard event={event} key={event.id} />
        ))}
         {filteredEvents.length === 0 && (
            <div className="text-center col-span-full py-12">
                <p className="text-muted-foreground">No events match the current filters.</p>
            </div>
        )}
      </div>
    </div>
  );
}

