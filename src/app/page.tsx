
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
import {
  Carousel,
  CarouselContent,
  CarouselItem,
} from "@/components/ui/carousel";
import { Badge } from '@/components/ui/badge';
import { format, parseISO } from 'date-fns';
import { useEffect, useState } from 'react';
import { Calendar, Users, ArrowRight, ArrowRightCircle, Lightbulb, Network, Code, Users2, Globe, FileText, Ticket, Video } from 'lucide-react';
import type { Event, ApiSuccessResponse, Department } from '@/lib/types';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { motion } from "framer-motion";
import api from '@/lib/api';
import { useToast } from '@/hooks/use-toast';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const GoogleCalendarIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24" fill="currentColor" {...props}>
    <path d="M7 11h2v2H7v-2zm4 0h2v2h-2v-2zm4 0h2v2h-2v-2zm2-7h-1V2h-2v2H8V2H6v2H5c-1.11 0-1.99.9-1.99 2L3 20a2 2 0 0 0 2 2h14c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 16H5V9h14v11z"/>
  </svg>
);


export default function HomePage() {
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
                api<ApiSuccessResponse<{ departments: Department[] }>>('/departments?limit=100'),
                api<ApiSuccessResponse<{data: Event[]}>>('/events?status=published&limit=100&upcoming=true')
            ]);
            
            const fetchedDepts = deptResponse.data?.departments || [];
            setDepartments(fetchedDepts);

            if (eventResponse.data) {
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

  const speakers = [
    {
      name: 'Dr. Evelyn Reed',
      title: 'AI Researcher',
      company: 'Synthara Corp',
      avatarUrl: 'https://picsum.photos/seed/speaker1/200/200',
      imageHint: 'woman portrait',
    },
    {
      name: 'Marcus Chen',
      title: 'Cloud Architect',
      company: 'NexusCloud',
      avatarUrl: 'https://picsum.photos/seed/speaker2/200/200',
      imageHint: 'man portrait',
    },
    {
      name: 'Priya Sharma',
      title: 'Cybersecurity Expert',
      company: 'SecureNet',
      avatarUrl: 'https://picsum.photos/seed/speaker3/200/200',
      imageHint: 'woman professional',
      
    },
    {
      name: 'Ben Carter',
      title: 'Head of Product',
      company: 'InnovateX',
      avatarUrl: 'https://picsum.photos/seed/speaker4/200/200',
      imageHint: 'man professional',
    },
  ];

  const cardVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 },
  };

  const EventCard = ({ event }: { event: Event }) => {
     const { date, time } = getFormattedDate(event.startAt);
     const departmentName = typeof event.department === 'object' ? event.department.name : 'N/A';
     
    return (
      <motion.div
        whileHover={{ scale: 1.03, y: -5 }}
        className="h-full"
      >
        <Card
          key={event._id}
          className="flex flex-col overflow-hidden h-full shadow-md transition-shadow duration-300 cursor-pointer"
        >
          <div className="relative h-48 w-full">
            <Image
              src={event.thumbnailUrl || 'https://picsum.photos/seed/event/400/250'}
              alt={event.name}
              fill
              className="object-cover"
              data-ai-hint={event.imageHint || 'event placeholder'}
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
             <Badge variant="outline" className="w-fit">{departmentName}</Badge>
            <CardDescription className="flex items-center gap-2 text-sm pt-1">
              <Calendar className="h-4 w-4" />
              {date} at {time}
            </CardDescription>
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
              Free Registration
            </Button>
          </CardFooter>
        </Card>
      </motion.div>
  );
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
      <motion.main 
         initial="hidden"
        animate="visible"
        transition={{ staggerChildren: 0.1 }}
        className="flex-1">
        <section className="relative h-[80vh] flex items-center justify-center text-center text-white">
          <Image
            src="https://cdn.egspec.org/assets/img/conference-hall.webp"
            alt="A vibrant symposium with a diverse audience"
            fill
            className="object-cover -z-10"
            data-ai-hint="symposium audience"
            priority
          />
          <div className="absolute inset-0 bg-black/60 -z-10" />

          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: "easeInOut" }}
            className="container px-4 md:px-6"
          >
              <Badge>#EGSPECISSH-T</Badge>
              <h1 className="text-4xl font-extrabold font-headline md:text-7xl mt-4 tracking-tight">
                EGSPEC Biggest Event 2025
              </h1>
              
              <p className="mt-4 text-lg md:text-xl text-gray-200 max-w-3xl mx-auto">
                Join thousands of students, professionals, and enthusiasts for the most anticipated tech and culture symposium of the year.
              </p>
               <div className="mt-8 flex items-center justify-center gap-4">
                <Button size="lg" variant="secondary" asChild>
                  <Link href="/events">Register Now</Link>
                </Button>
                <Button asChild size="lg" variant="ghost" className="text-white hover:bg-white/10 hover:text-white group">
                  <Link href="/events" className="flex items-center gap-2">
                    <span>Explore Events</span>
                    <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-1" />
                  </Link>
                </Button>
              </div>
          </motion.div>
          
        </section>
        
        <motion.section 
            id="about-event" 
            className="py-12 md:py-20 bg-background"
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true, amount: 0.3 }}
            transition={{ duration: 0.8 }}
        >
          <div className="container mx-auto px-4">
             <div className="grid md:grid-cols-2 gap-12 items-center">
                <div>
                    <Image src="https://egspec.blob.core.windows.net/egspec-assets/engineering_college.webp" 
                           alt="EGS Pillay Engineering College"
                           width={600}
                           height={400}
                           className="rounded-lg object-cover shadow-lg"
                           data-ai-hint="college campus"
                    />
                </div>
                <div>
                  <h2 className="text-sm font-semibold uppercase text-primary tracking-wider">Welcome to Our Symposium</h2>
                  <h3 className="text-3xl font-bold font-headline mt-2">About This Event</h3>
                  <p className="text-muted-foreground mt-4 leading-relaxed">
                    Welcome to the International Symposium on Sustainable and High-Performance Computing (ISSH-T), a premier event dedicated to exploring the future of technology. Our symposium brings together leading experts, industry professionals, and aspiring students to share knowledge, foster collaboration, and drive innovation. This year's event focuses on cutting-edge topics in Al, data science, sustainable engineering, and management, providing a platform to discuss challenges and opportunities in shaping our future.
                  </p>
                  <ul className="mt-4 space-y-2">
                    <li className="flex items-center gap-2"><ArrowRight className="h-4 w-4 text-primary"/>Engage with experts in various technology streams.</li>
                    <li className="flex items-center gap-2"><ArrowRight className="h-4 w-4 text-primary"/>Explore comprehensive engineering, management, and career tracks.</li>
                    <li className="flex items-center gap-2"><ArrowRight className="h-4 w-4 text-primary"/>Network with a broad range of students and professionals.</li>
                    <li className="flex items-center gap-2"><ArrowRight className="h-4 w-4 text-primary"/>Discover the impact of emerging technologies.</li>
                  </ul>
                   <Button asChild className="mt-6">
                      <Link href="/about">Learn More</Link>
                  </Button>
                </div>
             </div>
          </div>
        </motion.section>

        <motion.section 
            className="py-12 md:py-20 bg-muted/30"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.2 }}
            transition={{ staggerChildren: 0.1 }}
        >
          <div className="container mx-auto px-4 text-center">
            <h2 className="text-3xl font-bold font-headline">Who Benefits?</h2>
            <p className="text-muted-foreground mt-2 max-w-2xl mx-auto">Our symposium is designed to provide value to a wide range of participants, from students to seasoned professionals.</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8 mt-10 text-left">
              {[
                { icon: Lightbulb, title: 'Inspiration', text: 'Get inspired by leading experts, groundbreaking research, and innovative projects that are shaping the future of technology.' },
                { icon: Network, title: 'Networking', text: 'Expand your professional network by connecting with industry leaders, academic experts, and talented peers from various disciplines.' },
                { icon: Code, title: 'Tech Insights', text: 'Gain deep insights into the latest technological advancements and trends directly from the innovators creating them.' },
                { icon: Users2, title: 'Collaborative Sessions', text: 'Participate in interactive workshops and sessions to collaborate, solve problems, and exchange ideas among participants.' },
                { icon: Globe, title: 'Global Perspective', text: 'Experience a global outlook on tech and business with contributions from international speakers and attendees.' },
                { icon: FileText, title: 'Exclusive Materials', text: 'Get access to exclusive content, including research papers, presentation slides, and recorded sessions from the event.' },
              ].map((item, i) => (
                <motion.div key={i} variants={cardVariants} className="p-6 bg-background rounded-lg shadow-sm">
                  <item.icon className="h-8 w-8 text-primary mb-4" />
                  <h3 className="font-bold font-headline text-lg">{item.title}</h3>
                  <p className="text-muted-foreground mt-1">{item.text}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </motion.section>

        <section id="events" className="py-12 md:py-20">
            <div className="container mx-auto px-4">
                <motion.div 
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5 }}
                    className="mb-8 text-center"
                >
                    <h2 className="text-3xl md:text-4xl font-bold font-headline tracking-tight">Upcoming Events</h2>
                    <p className="text-muted-foreground mt-2 max-w-2xl mx-auto">Browse, filter, and discover all the exciting events happening. Click on any event to see more details.</p>
                </motion.div>

                <div className="flex flex-wrap gap-4 mb-8 p-4 bg-muted rounded-lg justify-center">
                    <Select value={modeFilter} onValueChange={setModeFilter}>
                        <SelectTrigger className="w-full sm:w-auto flex-1 min-w-[150px] max-w-xs">
                        <SelectValue placeholder="Event Mode" />
                        </SelectTrigger>
                        <SelectContent>
                        <SelectItem value="all">All Modes</SelectItem>
                        <SelectItem value="online">Online</SelectItem>
                        <SelectItem value="offline">Offline</SelectItem>
                        </SelectContent>
                    </Select>

                    <Select value={departmentFilter} onValueChange={setDepartmentFilter}>
                        <SelectTrigger className="w-full sm:w-auto flex-1 min-w-[150px] max-w-xs">
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

                <div className="text-center mt-12">
                  <Button asChild size="lg">
                    <Link href="/events">View All Events <ArrowRight className="ml-2 h-5 w-5" /></Link>
                  </Button>
                </div>
            </div>
        </section>

        <motion.section 
            className="py-12 md:py-20 bg-muted/30"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.2 }}
            transition={{ staggerChildren: 0.1 }}
        >
          <div className="container mx-auto px-4 text-center">
             <h2 className="text-3xl font-bold font-headline">Our Speakers</h2>
             <p className="text-muted-foreground mt-2 max-w-2xl mx-auto">Meet the brilliant minds who will be sharing their insights at our symposium.</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-8 mt-10">
                {speakers.map((speaker) => (
                  <motion.div key={speaker.name} variants={cardVariants} className="flex flex-col items-center text-center">
                    <Avatar className="h-32 w-32 mb-4 border-4 border-background shadow-lg">
                      <AvatarImage src={speaker.avatarUrl} alt={speaker.name} data-ai-hint={speaker.imageHint} />
                      <AvatarFallback>{speaker.name.charAt(0)}</AvatarFallback>
                    </Avatar>
                    <h3 className="font-bold font-headline text-lg">{speaker.name}</h3>
                    <p className="text-primary">{speaker.title}</p>
                    <p className="text-muted-foreground text-sm">{speaker.company}</p>
                  </motion.div>
                ))}
              </div>
          </div>
        </motion.section>
        
        <section className="py-12 md:py-20">
          <div className="container mx-auto px-4 text-center">
             <h2 className="text-3xl font-bold font-headline">Event &amp; Venue Partner</h2>
              <div className="mt-8 text-center">
                <Image src="/placeholder.svg" alt="Partner logo" width={150} height={50} className="mx-auto" data-ai-hint="logo"/>
             </div>
          </div>
        </section>

         <section className="relative py-16 md:py-24 bg-primary text-primary-foreground">
          <Image
            src="https://picsum.photos/seed/crowd-register/1920/1080"
            alt="Crowd at a conference"
            fill
            className="object-cover -z-10"
            data-ai-hint="conference crowd"
          />
           <div className="absolute inset-0 bg-primary/80 -z-10" />
          <div className="container px-4 md:px-6 text-center mx-auto">
              <Badge variant="secondary">Don't Miss Out</Badge>
              <h2 className="text-3xl font-bold font-headline md:text-4xl text-white mt-4">
                Register for the Symposium
              </h2>
              <p className="mt-4 text-lg md:text-xl text-primary-foreground/80 max-w-3xl mx-auto">
                Join hundreds of students, professionals, and academics for a multi-day immersion in groundbreaking technology. Register today and take the next step in your career, network with peers, and gain the insights that will shape our future.
              </p>
              <div className="mt-8">
                <Button size="lg" variant="secondary" asChild>
                  <Link href="/events">Register Now</Link>
                </Button>
              </div>
          </div>
        </section>
      </motion.main>
  );
}
