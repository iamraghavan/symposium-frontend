
"use client";

import Link from "next/link";
import {
  Card,
  CardContent,
  CardDescription,
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
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { LoggedInUser, Event, Department } from "@/lib/types";
import { getEvents, createEvent } from "./actions";
import { getDepartments } from "../departments/actions";
import { format, parseISO } from "date-fns";
import {
  Calendar as CalendarIcon,
  PlusCircle,
  Clock,
  MoreHorizontal,
  Eye,
} from "lucide-react";
import { useState, useEffect, useRef } from "react";
import { cn } from "@/lib/utils";
import { Calendar } from "@/components/ui/calendar";
import { useRouter } from "next/navigation";
import { isAdmin } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export default function AdminEventsPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [user, setUser] = useState<LoggedInUser | null>(null);
  const [events, setEvents] = useState<Event[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const formRef = useRef<HTMLFormElement>(null);
  
  const [isNewEventDialogOpen, setIsNewEventDialogOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Form State
  const [eventMode, setEventMode] = useState("offline");
  const [startDate, setStartDate] = useState<Date>();
  const [endDate, setEndDate] = useState<Date>();
  const [startTime, setStartTime] = useState("09:00");
  const [endTime, setEndTime] = useState("17:00");

  useEffect(() => {
    const userData = localStorage.getItem("loggedInUser");
    if (userData) {
      const parsedUser = JSON.parse(userData) as LoggedInUser;
      if (!isAdmin(parsedUser)) {
        router.push("/");
        return;
      }
      setUser(parsedUser);
      fetchEvents();
      if (parsedUser.role === 'super_admin') {
        fetchDepartments();
      }
    } else {
      router.push("/c/auth/login?login=s_admin");
    }
  }, [router]);
  
  const fetchEvents = async () => {
      setIsLoading(true);
      try {
          const eventData = await getEvents();
          setEvents(eventData.data);
      } catch (error) {
          toast({ variant: 'destructive', title: 'Error', description: (error as Error).message });
      } finally {
          setIsLoading(false);
      }
  }

  const fetchDepartments = async () => {
    try {
      const depts = await getDepartments();
      setDepartments(depts);
    } catch (error) {
      toast({ variant: 'destructive', title: 'Error', description: 'Could not fetch departments.' });
    }
  }
  
  const handleCreateEvent = async (formData: FormData) => {
    if (!startDate || !endDate) {
        toast({ variant: 'destructive', title: 'Error', description: 'Please select start and end dates.' });
        return;
    }
    
    const [startHour, startMinute] = startTime.split(':').map(Number);
    const [endHour, endMinute] = endTime.split(':').map(Number);

    const startAt = new Date(startDate);
    startAt.setHours(startHour, startMinute);
    
    const endAt = new Date(endDate);
    endAt.setHours(endHour, endMinute);

    formData.set('startAt', startAt.toISOString());
    formData.set('endAt', endAt.toISOString());
    
    try {
        await createEvent(formData);
        toast({ title: 'Success', description: 'Event created successfully.' });
        setIsNewEventDialogOpen(false);
        formRef.current?.reset();
        fetchEvents();
    } catch (error) {
        toast({ variant: 'destructive', title: 'Error', description: (error as Error).message });
    }
  }
  
  const formatTableDate = (dateString?: string) => {
    if (!dateString) return "N/A";
    try {
      return format(parseISO(dateString), "MMM d, yyyy");
    } catch (error) {
      return "Invalid date";
    }
  }

  const getDepartmentName = (department: Department | string) => {
    if (typeof department === 'object' && department !== null) {
      return department.name;
    }
    return 'N/A';
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight font-headline">
            Events
          </h2>
          <p className="text-muted-foreground">
            {user?.role === "super_admin"
              ? "Manage all events across the college."
              : "Manage events for your department."}
          </p>
        </div>
        <Dialog open={isNewEventDialogOpen} onOpenChange={setIsNewEventDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <PlusCircle className="mr-2" />
              Create Event
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-3xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="font-headline">Create New Event</DialogTitle>
              <DialogDescription>
                Fill in the details below to add a new event to the symposium.
              </DialogDescription>
            </DialogHeader>
            <form ref={formRef} action={handleCreateEvent}>
            <div className="grid gap-6 py-4">
              {/* Core Details */}
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="name" className="text-right">Name</Label>
                <Input id="name" name="name" placeholder="e.g. Hackathon 2024" className="col-span-3"/>
              </div>
              <div className="grid grid-cols-4 items-start gap-4">
                <Label htmlFor="description" className="text-right pt-2">Description</Label>
                <Textarea id="description" name="description" placeholder="A brief description of the event." className="col-span-3"/>
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                 <Label htmlFor="thumbnailUrl" className="text-right">Thumbnail URL</Label>
                <Input id="thumbnailUrl" name="thumbnailUrl" placeholder="https://example.com/image.jpg" className="col-span-3"/>
              </div>
              {user?.role === 'super_admin' && (
                <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="departmentId" className="text-right">Department</Label>
                    <Select name="departmentId">
                        <SelectTrigger className="col-span-3">
                            <SelectValue placeholder="Select a department" />
                        </SelectTrigger>
                        <SelectContent>
                            {departments.map(dept => (
                                <SelectItem key={dept._id} value={dept._id}>{dept.name}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
              )}
              
              {/* Scheduling */}
              <div className="grid grid-cols-4 items-center gap-4">
                <Label className="text-right">Start Date/Time</Label>
                <div className="col-span-3 grid grid-cols-2 gap-2">
                    <Popover>
                        <PopoverTrigger asChild>
                            <Button variant={"outline"} className={cn("justify-start text-left font-normal", !startDate && "text-muted-foreground")}>
                            <CalendarIcon className="mr-2 h-4 w-4" />
                            {startDate ? format(startDate, "PPP") : <span>Pick a start date</span>}
                            </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0"><Calendar mode="single" selected={startDate} onSelect={setStartDate} initialFocus /></PopoverContent>
                    </Popover>
                    <div className="relative">
                       <Clock className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                       <Input type="time" value={startTime} onChange={e => setStartTime(e.target.value)} className="pl-8" />
                    </div>
                </div>
              </div>
               <div className="grid grid-cols-4 items-center gap-4">
                <Label className="text-right">End Date/Time</Label>
                 <div className="col-span-3 grid grid-cols-2 gap-2">
                    <Popover>
                        <PopoverTrigger asChild>
                            <Button variant={"outline"} className={cn("justify-start text-left font-normal", !endDate && "text-muted-foreground")}>
                            <CalendarIcon className="mr-2 h-4 w-4" />
                            {endDate ? format(endDate, "PPP") : <span>Pick an end date</span>}
                            </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0"><Calendar mode="single" selected={endDate} onSelect={setEndDate} initialFocus /></PopoverContent>
                    </Popover>
                     <div className="relative">
                       <Clock className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                       <Input type="time" value={endTime} onChange={e => setEndTime(e.target.value)} className="pl-8" />
                    </div>
                </div>
              </div>

              {/* Mode */}
              <div className="grid grid-cols-4 items-start gap-4">
                <Label className="text-right pt-2">Event Mode</Label>
                <div className="col-span-3">
                  <RadioGroup name="mode" defaultValue="offline" onValueChange={setEventMode} className="flex gap-4">
                    <div className="flex items-center space-x-2"><RadioGroupItem value="offline" id="offline" /><Label htmlFor="offline">Offline</Label></div>
                    <div className="flex items-center space-x-2"><RadioGroupItem value="online" id="online" /><Label htmlFor="online">Online</Label></div>
                  </RadioGroup>
                  {eventMode === "offline" && (
                    <div className="grid gap-2 mt-3">
                      <Input name="offline.venueName" placeholder="Venue Name" />
                      <Input name="offline.address" placeholder="Full Address" />
                    </div>
                  )}
                  {eventMode === "online" && (
                    <div className="grid gap-2 mt-3">
                        <Select name="online.provider">
                             <SelectTrigger><SelectValue placeholder="Select Online Provider" /></SelectTrigger>
                             <SelectContent>
                                <SelectItem value="google_meet">Google Meet</SelectItem>
                                <SelectItem value="zoom">Zoom</SelectItem>
                                <SelectItem value="other">Other</SelectItem>
                            </SelectContent>
                        </Select>
                        <Input name="online.url" placeholder="Meeting URL" />
                    </div>
                  )}
                </div>
              </div>

               {/* Payment */}
                <div className="grid grid-cols-4 items-start gap-4">
                    <Label className="text-right pt-2">Payment</Label>
                    <div className="col-span-3 grid gap-3">
                        <Select name="payment.method">
                             <SelectTrigger><SelectValue placeholder="Select Payment Method" /></SelectTrigger>
                             <SelectContent>
                                <SelectItem value="free">Free</SelectItem>
                                <SelectItem value="gateway">Online Gateway</SelectItem>
                                <SelectItem value="qr_code">QR Code</SelectItem>
                            </SelectContent>
                        </Select>
                        <div className="grid grid-cols-2 gap-2">
                            <Input name="payment.price" type="number" placeholder="Price (e.g., 100)" />
                            <Input name="payment.currency" placeholder="Currency (e.g., INR)" defaultValue="INR" />
                        </div>
                    </div>
                </div>

              {/* Contacts */}
              <div className="grid grid-cols-4 items-start gap-4">
                 <Label className="text-right pt-2">Contact</Label>
                 <div className="col-span-3 grid gap-2">
                    <Input name="contacts[0].name" placeholder="Contact Person Name" />
                    <Input name="contacts[0].email" type="email" placeholder="Contact Email" />
                    <Input name="contacts[0].phone" placeholder="Contact Phone" />
                 </div>
              </div>
              
              {/* Status */}
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="status" className="text-right">Status</Label>
                <Select name="status" defaultValue="draft">
                    <SelectTrigger className="col-span-3">
                        <SelectValue placeholder="Select event status" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="draft">Draft</SelectItem>
                        <SelectItem value="published">Published</SelectItem>
                        <SelectItem value="cancelled">Cancelled</SelectItem>
                    </SelectContent>
                </Select>
              </div>

            </div>
            <DialogFooter>
              <DialogClose asChild>
                <Button variant="outline" type="button">Cancel</Button>
              </DialogClose>
              <Button type="submit">Create Event</Button>
            </DialogFooter>
          </form>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="font-headline">Event List</CardTitle>
          <CardDescription>
            A list of all events managed by you.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Event Name</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Mode</TableHead>
                <TableHead>Start Date</TableHead>
                {user?.role === 'super_admin' && <TableHead>Department</TableHead>}
                <TableHead>
                  <span className="sr-only">Actions</span>
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={user?.role === 'super_admin' ? 6 : 5} className="h-24 text-center">
                    Loading events...
                  </TableCell>
                </TableRow>
              ) : events.length > 0 ? (
                events.map((event) => (
                  <TableRow key={event._id}>
                    <TableCell className="font-medium">{event.name}</TableCell>
                    <TableCell>
                      <Badge variant={event.status === 'published' ? 'default' : 'secondary'}>
                        {event.status}
                      </Badge>
                    </TableCell>
                    <TableCell>{event.mode}</TableCell>
                    <TableCell>{formatTableDate(event.startAt)}</TableCell>
                    {user?.role === 'super_admin' && (
                      <TableCell>{getDepartmentName(event.department)}</TableCell>
                    )}
                    <TableCell className="text-right">
                       <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" className="h-8 w-8 p-0">
                            <span className="sr-only">Open menu</span>
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem asChild>
                             <Link href={`/u/s/portal/events/${event._id}`}>
                                <Eye className="mr-2 h-4 w-4" />
                                <span>View Details</span>
                             </Link>
                           </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                 <TableRow>
                    <TableCell colSpan={user?.role === 'super_admin' ? 6 : 5} className="h-24 text-center">
                        No events found.
                    </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
