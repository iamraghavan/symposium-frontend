

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
import { motion } from "framer-motion";
import api from '@/lib/api';
import { useToast } from '@/hooks/use-toast';

export default function EventsPage() {
  const { toast } = useToast();
  const [allEvents, setAllEvents] = useState<Event[]>([]);
  const [filteredEvents, setFilteredEvents] = useState<Event[]>([]);
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
                 const deptMap = new Map(fetchedDepts.map(d => [d._id, d.name]));
                 const eventsWithDept = eventResponse.data.map(event => ({
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
    
    setFilteredEvents(tempEvents);
  }, [allEvents, modeFilter, departmentFilter]);

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
         <motion.div
            whileHover={{ scale: 1.02, y: -4 }}
            className="h-full"
        >
        <Card
          key={event._id}
          className="flex flex-col overflow-hidden h-full shadow-sm hover:shadow-md transition-all duration-300 cursor-pointer bg-background"
        >
          <CardHeader>
            <div className="flex justify-between items-start gap-2">
                <Badge variant="outline" className="w-fit">{departmentName}</Badge>
                <Badge variant={event.mode === 'online' ? 'default' : 'secondary'}>
                    {event.mode === 'online' ? <Video className='mr-1 h-3 w-3'/> : <Globe className='mr-1 h-3 w-3'/>}
                    {event.mode.charAt(0).toUpperCase() + event.mode.slice(1)}
                </Badge>
            </div>
             <CardTitle className="font-headline text-xl pt-2 line-clamp-2 flex-grow min-h-[3.5rem]">
                {event.name}
              </CardTitle>
          </CardHeader>
          <CardFooter className="flex-col items-start gap-3 pt-4 border-t mt-auto">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Calendar className="h-4 w-4" />
                <span>{date} at {time}</span>
              </div>
              <Button variant="default" size="sm" className="w-full">
                Free Registration
            </Button>
          </CardFooter>
        </Card>
        </motion.div>
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
                <Link href={`/events/${event._id}`}>
                  <EventCard event={event} />
                </Link>
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
  );
}
