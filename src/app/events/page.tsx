
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
import { format, parseISO } from 'date-fns';
import { useEffect, useState } from 'react';
import { Calendar, Users, Ticket, Globe, Video } from 'lucide-react';
import type { Event, Department, ApiSuccessResponse } from '@/lib/types';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { motion } from "framer-motion";
import api from '@/lib/api';
import { useToast } from '@/hooks/use-toast';

export default function EventsPage() {
  const { toast } = useToast();
  const [allEvents, setAllEvents] = useState<Event[]>([]);
  const [filteredEvents, setFilteredEvents] = useState<Event[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const [modeFilter, setModeFilter] = useState("all");
  const [departmentFilter, setDepartmentFilter] = useState("all");
  const [priceFilter, setPriceFilter] = useState("all");

  useEffect(() => {
    async function fetchData() {
        setIsLoading(true);
        try {
            const [deptResponse, eventResponse] = await Promise.all([
                api<ApiSuccessResponse<{ departments: Department[] }>>('/departments?limit=100'),
                api<ApiSuccessResponse<{ data: Event[] }>>('/events?status=published&limit=100')
            ]);
            
            const fetchedDepts = deptResponse.data?.departments || [];
            setDepartments(fetchedDepts);

            if (eventResponse.data?.data) {
                 const deptMap = new Map(fetchedDepts.map(d => [d._id, d.name]));
                 const eventsWithDept = eventResponse.data.data.map(event => ({
                    ...event,
                    department: {
                      _id: event.department as string,
                      name: deptMap.get(event.department as string) || 'Unknown',
                    } as any
                }));
                setAllEvents(eventsWithDept);
                setFilteredEvents(eventsWithDept);
            }
        } catch (error) {
            toast({ variant: 'destructive', title: 'Error', description: 'Could not fetch data.'});
            console.error(error);
        } finally {
            setIsLoading(false);
        }
    }
    fetchData();
  }, [toast]);

  useEffect(() => {
    let tempEvents = [...allEvents];

    if (modeFilter !== 'all') {
      tempEvents = tempEvents.filter(event => event.mode === modeFilter);
    }
    if (departmentFilter !== 'all') {
      tempEvents = tempEvents.filter(event => 
        (typeof event.department === 'object' && event.department._id === departmentFilter)
      );
    }
    if (priceFilter !== 'all') {
      tempEvents = tempEvents.filter(event => priceFilter === 'free' ? event.payment.price === 0 : event.payment.price > 0);
    }
    
    setFilteredEvents(tempEvents);
  }, [allEvents, modeFilter, departmentFilter, priceFilter]);

  const getFormattedDate = (dateString?: string) => {
    if (!dateString) return { date: "N/A", time: "" };
    const parsedDate = parseISO(dateString);
    return {
      date: format(parsedDate, "MMMM d, yyyy"),
      time: format(parsedDate, "h:mm a"),
    };
  };

  const EventCard = ({ event }: { event: Event }) => {
    const { date, time } = getFormattedDate(event.startAt);
    const departmentName = typeof event.department === 'object' ? event.department.name : 'N/A';
    return (
      <DialogTrigger asChild>
         <motion.div
            whileHover={{ scale: 1.03, y: -5 }}
            className="h-full"
        >
        <Card
          key={event._id}
          className="flex flex-col overflow-hidden h-full shadow-md transition-shadow duration-300 cursor-pointer"
          onClick={() => setSelectedEvent(event)}
        >
          <div className="relative h-48 w-full">
            <Image
              src={event.thumbnailUrl || 'https://picsum.photos/seed/event-placeholder/400/250'}
              alt={event.name}
              fill
              className="object-cover"
              data-ai-hint="event placeholder"
            />
            <Badge className="absolute top-2 right-2" variant={event.mode === 'online' ? 'default' : 'secondary'}>
                {event.mode === 'online' ? <Video className='mr-1 h-3 w-3'/> : <Globe className='mr-1 h-3 w-3'/>}
                {event.mode.charAt(0).toUpperCase() + event.mode.slice(1)}
            </Badge>
          </div>
          <CardHeader>
            <CardTitle className="font-headline text-xl mb-1 line-clamp-1">
              {event.name}
            </CardTitle>
            <CardDescription className="flex items-center gap-2 text-sm">
              <Calendar className="h-4 w-4" />
              {date} at {time}
            </CardDescription>
             <Badge variant="outline" className="w-fit">{departmentName}</Badge>
          </CardHeader>
          <CardContent className="flex-grow">
            <p className="text-sm text-muted-foreground line-clamp-2">
              {event.description}
            </p>
          </CardContent>
          <CardFooter className="flex justify-between items-center">
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium">
                0 Participants
              </span>
            </div>
            <Button variant="default" size="sm">
                {event.payment.price === 0 ? 'Free' : `₹${event.payment.price}`}
            </Button>
          </CardFooter>
        </Card>
        </motion.div>
      </DialogTrigger>
    )
  }

  const containerVariants = {
      hidden: { opacity: 0 },
      visible: {
          opacity: 1,
          transition: {
          staggerChildren: 0.05,
          },
      },
  };

  const itemVariants = {
      hidden: { y: 20, opacity: 0 },
      visible: { y: 0, opacity: 1 },
  };

  return (
    <Dialog>
      <div className="container mx-auto px-4 py-8 md:py-12">
        <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="mb-8"
        >
          <h1 className="text-4xl font-bold font-headline tracking-tight">All Events</h1>
          <p className="text-muted-foreground mt-2">Browse, filter, and discover all the exciting events happening.</p>
        </motion.div>

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
                  <SelectItem key={dept._id} value={dept._id}>{dept.name}</SelectItem>
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
        </div>
        
        {isLoading ? (
            <div className="text-center col-span-full py-12">
                <p className="text-muted-foreground">Loading events...</p>
            </div>
        ) : (
            <motion.div 
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            >
            {filteredEvents.map((event) => (
                <motion.div key={event._id} variants={itemVariants}>
                <EventCard event={event} />
                </motion.div>
            ))}
            </motion.div>
        )}
        {!isLoading && filteredEvents.length === 0 && (
            <div className="text-center col-span-full py-12">
                <p className="text-muted-foreground">No events match the current filters.</p>
            </div>
        )}
      </div>

       {selectedEvent && (
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle className="font-headline text-2xl">{selectedEvent.name}</DialogTitle>
          </DialogHeader>
          <div className="py-4 space-y-4 text-sm">
            <div className="flex items-center gap-2"><span className="font-semibold w-24">Date:</span> <span>{getFormattedDate(selectedEvent.startAt).date}</span></div>
            <div className="flex items-center gap-2"><span className="font-semibold w-24">Time:</span> <span>{getFormattedDate(selectedEvent.startAt).time}</span></div>
            <div className="flex items-center gap-2"><span className="font-semibold w-24">Venue:</span> <span>{selectedEvent.mode === 'online' ? (selectedEvent.online?.provider || 'Online') : (selectedEvent.offline?.venueName || 'On-campus')}</span></div>
             <div className="flex items-start gap-2">
                <span className="font-semibold w-24 shrink-0">Description:</span> 
                <p className="text-muted-foreground">{selectedEvent.description}</p>
            </div>
            <div className="flex items-center gap-2"><span className="font-semibold w-24">Conducted By:</span> <span>{typeof selectedEvent.department === 'object' ? selectedEvent.department.name : 'Department'}</span></div>
            <div className="flex items-center gap-2"><span className="font-semibold w-24">Price:</span> <span>{selectedEvent.payment.price === 0 ? 'Free' : `₹${selectedEvent.payment.price}`}</span></div>
          </div>
           <div className="flex justify-between items-center pt-4 border-t">
              <p className="text-xs text-muted-foreground">For technical support, email us at web@egspec.org</p>
              <div className="flex gap-2">
                <Button>
                  <Ticket className="mr-2 h-4 w-4" />
                  Register
                </Button>
                <Button variant="outline" asChild>
                  <Link href={`/events/${selectedEvent._id}`}>View Full Details</Link>
                </Button>
              </div>
           </div>
        </DialogContent>
      )}
    </Dialog>
  );
}
