
"use client";

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
import { useEffect, useState, useMemo } from 'react';
import { Calendar, Globe, Video } from 'lucide-react';
import type { Event, Department, ApiSuccessResponse } from '@/lib/types';
import { motion, AnimatePresence } from "framer-motion";
import api from '@/lib/api';
import { useToast } from '@/hooks/use-toast';
import { Skeleton } from '@/components/ui/skeleton';

export default function EventsPage() {
  const { toast } = useToast();
  const [allEvents, setAllEvents] = useState<Event[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const [modeFilter, setModeFilter] = useState("all");
  const [departmentFilter, setDepartmentFilter] = useState("all");

  useEffect(() => {
    async function fetchData() {
        setIsLoading(true);
        try {
            const [deptResponse, eventResponse] = await Promise.all([
                api<ApiSuccessResponse<Department[]>>('/departments?limit=100'),
                api<ApiSuccessResponse<Event[]>>('/events?status=published&limit=100')
            ]);
            
            const fetchedDepts = deptResponse.data || [];
            setDepartments(fetchedDepts);

            if (eventResponse.success && eventResponse.data) {
                const deptMap = new Map(fetchedDepts.map(d => [d._id, d]));
                const eventsWithDept: Event[] = eventResponse.data.map(event => ({
                    ...event,
                    department: deptMap.get(event.department as string) || { name: 'Unknown', _id: 'unknown' }
                }));
                setAllEvents(eventsWithDept);
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

  const filteredEvents = useMemo(() => {
    let tempEvents = allEvents;

    if (modeFilter !== 'all') {
      tempEvents = tempEvents.filter(event => event.mode === modeFilter);
    }
    if (departmentFilter !== 'all') {
      tempEvents = tempEvents.filter(event => (event.department as Department)?._id === departmentFilter);
    }
    
    return tempEvents;
  }, [allEvents, modeFilter, departmentFilter]);


  const getFormattedDate = (dateString?: string) => {
    if (!dateString) return { date: "N/A", time: "" };
    const parsedDate = parseISO(dateString);
    return {
      date: format(parsedDate, "MMMM d, yyyy"),
      time: format(parsedDate, "h:mm a"),
    };
  };

   const cardVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.5 } },
    exit: { opacity: 0, y: -20, transition: { duration: 0.3 } }
  };

  const EventCard = ({ event }: { event: Event }) => {
    const { date, time } = getFormattedDate(event.startAt);
    const departmentName = (event.department as Department)?.name || 'Unknown';
    
    return (
      <motion.div
        layout
        variants={cardVariants}
        initial="hidden"
        animate="visible"
        exit="exit"
        className="h-full"
      >
        <Link href={`/events/${event._id}`} className="h-full block">
          <Card className="flex flex-col overflow-hidden h-full shadow-sm hover:shadow-lg transition-all duration-300 cursor-pointer bg-card group">
            <CardHeader className="flex-grow">
               <div className="flex justify-between items-start gap-2">
                 <Badge variant="secondary" className="w-fit">{departmentName}</Badge>
                 <Badge variant={event.mode === 'online' ? 'default' : 'outline'} className="shrink-0">
                     {event.mode === 'online' ? <Video className='mr-1 h-3 w-3'/> : <Globe className='mr-1 h-3 w-3'/>}
                     {event.mode.charAt(0).toUpperCase() + event.mode.slice(1)}
                 </Badge>
               </div>
               <CardTitle className="font-headline text-lg pt-2 line-clamp-2">
                  {event.name}
                </CardTitle>
                 <CardDescription className="flex items-center gap-2 text-xs pt-1">
                  <Calendar className="h-4 w-4" />
                  <span>{date} at {time}</span>
                </CardDescription>
            </CardHeader>
            <CardFooter className="flex-col items-start gap-3 pt-4 mt-auto">
                <Button variant="default" size="sm" className="w-full">
                  View Details
              </Button>
            </CardFooter>
          </Card>
        </Link>
      </motion.div>
    );
  }

  return (
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

       <div className="flex flex-col sm:flex-row gap-4 mb-8 p-4 bg-muted rounded-lg">
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-semibold mr-2">Department:</span>
            <Button variant={departmentFilter === 'all' ? 'default' : 'ghost'} size="sm" onClick={() => setDepartmentFilter('all')}>All</Button>
            {departments.map(dept => (
                <Button key={dept._id} variant={departmentFilter === dept._id ? 'default' : 'ghost'} size="sm" onClick={() => setDepartmentFilter(dept._id)}>{dept.name}</Button>
            ))}
          </div>
           <div className="flex items-center gap-2 border-t sm:border-t-0 sm:border-l pt-4 sm:pt-0 sm:pl-4">
            <span className="font-semibold">Mode:</span>
            <Button variant={modeFilter === 'all' ? 'default' : 'ghost'} size="sm" onClick={() => setModeFilter('all')}>All</Button>
            <Button variant={modeFilter === 'online' ? 'default' : 'ghost'} size="sm" onClick={() => setModeFilter('online')}>Online</Button>
            <Button variant={modeFilter === 'offline' ? 'default' : 'ghost'} size="sm" onClick={() => setModeFilter('offline')}>Offline</Button>
          </div>
      </div>
      
      {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
                <Card key={i} className="flex flex-col overflow-hidden h-full">
                  <CardHeader><Skeleton className="h-6 w-3/4"/><Skeleton className="h-4 w-1/2 mt-2"/></CardHeader>
                  <CardContent className="flex-grow"><Skeleton className="h-10 w-full"/></CardContent>
                  <CardFooter><Skeleton className="h-10 w-full"/></CardFooter>
                </Card>
            ))}
          </div>
      ) : (
          <motion.div 
            layout
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
          >
            <AnimatePresence>
              {filteredEvents.map((event) => (
                  <EventCard key={event._id} event={event} />
              ))}
            </AnimatePresence>
          </motion.div>
      )}
      {!isLoading && filteredEvents.length === 0 && (
          <div className="text-center col-span-full py-12">
              <p className="text-muted-foreground">No events match the current filters.</p>
          </div>
      )}
    </div>
  );
}

    