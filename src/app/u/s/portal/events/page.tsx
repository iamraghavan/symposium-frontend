
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
import type { LoggedInUser, Event, Department, ApiSuccessResponse } from "@/lib/types";
import { createEvent, updateEvent, deleteEvent } from "./actions";
import api from "@/lib/api";
import { format, parseISO } from "date-fns";
import {
  Calendar as CalendarIcon,
  PlusCircle,
  Clock,
  MoreHorizontal,
  Eye,
  Edit,
  Trash
} from "lucide-react";
import { useState, useEffect, useRef } from "react";
import { useActionState } from "react";
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
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";


const createInitialState = {
  message: '',
  success: false,
};

const updateInitialState = {
  message: '',
  success: false,
};

export default function AdminEventsPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [user, setUser] = useState<LoggedInUser | null>(null);
  const [events, setEvents] = useState<Event[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const createFormRef = useRef<HTMLFormElement>(null);
  const editFormRef = useRef<HTMLFormElement>(null);
  
  const [isNewEventDialogOpen, setIsNewEventDialogOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState<Event | null>(null);

  const [isLoading, setIsLoading] = useState(true);

  // Form State for Create Dialog
  const [createEventMode, setCreateEventMode] = useState("offline");
  const [createStartDate, setCreateStartDate] = useState<Date>();
  const [createEndDate, setCreateEndDate] = useState<Date>();
  const [createStartTime, setCreateStartTime] = useState("09:00");
  const [createEndTime, setCreateEndTime] = useState("17:00");

  // Form State for Edit Dialog
  const [editEventMode, setEditEventMode] = useState("offline");
  const [editStartDate, setEditStartDate] = useState<Date>();
  const [editEndDate, setEditEndDate] = useState<Date>();
  const [editStartTime, setEditStartTime] = useState("09:00");
  const [editEndTime, setEditEndTime] = useState("17:00");

  const [createFormState, createFormAction] = useActionState(createEvent, createInitialState);
  const [updateFormState, updateFormAction] = useActionState(updateEvent, updateInitialState);

  async function getAdminEvents(user: LoggedInUser): Promise<Event[]> {
    if (!user) throw new Error("User not authenticated");

    let endpoint = '/events/admin'; // Default for super admin
    if (user.role === 'department_admin') {
      if (!user._id) throw new Error("Department admin ID is missing.");
      endpoint = `/events/admin/created-by/${user._id}`;
    }

    const response = await api<ApiSuccessResponse<{ data?: Event[] }>>(endpoint, { authenticated: true });
    
    return response.data || [];
  }

  const fetchEvents = async (currentUser: LoggedInUser) => {
      setIsLoading(true);
      try {
          const eventData = await getAdminEvents(currentUser);
          setEvents(eventData || []);
      } catch (error) {
          toast({ variant: 'destructive', title: 'Error', description: (error as Error).message || "Could not fetch events." });
      } finally {
          setIsLoading(false);
      }
  }
  
  async function fetchDepartments() {
    try {
        const response = await api<ApiSuccessResponse<{ data: Department[] }>>('/departments?limit=100', { authenticated: true });
        if (response.success && response.data) {
            setDepartments(response.data);
        }
    } catch (error) {
         toast({ variant: 'destructive', title: 'Error', description: "Could not fetch departments for form." });
    }
  }


  useEffect(() => {
    const userData = localStorage.getItem("loggedInUser");
    if (userData) {
      const parsedUser = JSON.parse(userData) as LoggedInUser;
      if (!isAdmin(parsedUser)) {
        router.push("/");
        return;
      }
      setUser(parsedUser);
      fetchEvents(parsedUser);
      if (parsedUser.role === 'super_admin') {
        fetchDepartments();
      }
    } else {
      router.push("/c/auth/login?login=s_admin");
    }
  }, [router]);

  useEffect(() => {
    if (createFormState.message) {
      if (createFormState.success) {
        toast({ title: 'Success', description: createFormState.message });
        setIsNewEventDialogOpen(false);
        createFormRef.current?.reset();
        if(user) fetchEvents(user); // refetch events on success
      } else {
        toast({ variant: 'destructive', title: 'Error', description: createFormState.message });
      }
    }
  }, [createFormState, user]);
  
   useEffect(() => {
    if (updateFormState.message) {
      if (updateFormState.success) {
        toast({ title: 'Success', description: updateFormState.message });
        setEditingEvent(null);
        editFormRef.current?.reset();
        if(user) fetchEvents(user);
      } else {
        toast({ variant: 'destructive', title: 'Error', description: updateFormState.message });
      }
    }
  }, [updateFormState, user]);

  useEffect(() => {
    if (editingEvent) {
      setEditEventMode(editingEvent.mode);
      if(editingEvent.startAt) setEditStartDate(parseISO(editingEvent.startAt));
      if(editingEvent.endAt) setEditEndDate(parseISO(editingEvent.endAt));
      if(editingEvent.startAt) setEditStartTime(format(parseISO(editingEvent.startAt), "HH:mm"));
      if(editingEvent.endAt) setEditEndTime(format(parseISO(editingEvent.endAt), "HH:mm"));
    }
  }, [editingEvent]);

  

  const handleDelete = async (eventId: string) => {
    try {
      const result = await deleteEvent(eventId);
       if (result.success) {
        toast({ title: "Success", description: result.message });
        if(user) fetchEvents(user);
      } else {
         throw new Error(result.message);
      }
    } catch (error) {
      toast({ variant: 'destructive', title: 'Error', description: (error as Error).message || "Could not delete event." });
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

  const getDepartmentName = (department: Department | string | undefined) => {
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
            <form ref={createFormRef} action={createFormAction}>
            <div className="grid gap-6 py-4">
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
              <div className="grid grid-cols-4 items-center gap-4">
                <Label className="text-right">Start Date/Time</Label>
                <div className="col-span-3 grid grid-cols-2 gap-2">
                    <Popover>
                        <PopoverTrigger asChild>
                            <Button variant={"outline"} className={cn("justify-start text-left font-normal", !createStartDate && "text-muted-foreground")}>
                            <CalendarIcon className="mr-2 h-4 w-4" />
                            {createStartDate ? format(createStartDate, "PPP") : <span>Pick a start date</span>}
                            </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0"><Calendar mode="single" selected={createStartDate} onSelect={setCreateStartDate} initialFocus /></PopoverContent>
                    </Popover>
                    <div className="relative">
                       <Clock className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                       <Input name="startTime" type="time" value={createStartTime} onChange={e => setCreateStartTime(e.target.value)} className="pl-8" />
                    </div>
                </div>
                <input type="hidden" name="startAt" value={createStartDate ? new Date(createStartDate.setHours(Number(createStartTime.split(':')[0]), Number(createStartTime.split(':')[1]))).toISOString() : ''} />
              </div>
               <div className="grid grid-cols-4 items-center gap-4">
                <Label className="text-right">End Date/Time</Label>
                 <div className="col-span-3 grid grid-cols-2 gap-2">
                    <Popover>
                        <PopoverTrigger asChild>
                            <Button variant={"outline"} className={cn("justify-start text-left font-normal", !createEndDate && "text-muted-foreground")}>
                            <CalendarIcon className="mr-2 h-4 w-4" />
                            {createEndDate ? format(createEndDate, "PPP") : <span>Pick an end date</span>}
                            </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0"><Calendar mode="single" selected={createEndDate} onSelect={setCreateEndDate} initialFocus /></PopoverContent>
                    </Popover>
                     <div className="relative">
                       <Clock className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                       <Input name="endTime" type="time" value={createEndTime} onChange={e => setCreateEndTime(e.target.value)} className="pl-8" />
                    </div>
                </div>
                 <input type="hidden" name="endAt" value={createEndDate ? new Date(createEndDate.setHours(Number(createEndTime.split(':')[0]), Number(createEndTime.split(':')[1]))).toISOString() : ''} />
              </div>
              <div className="grid grid-cols-4 items-start gap-4">
                <Label className="text-right pt-2">Event Mode</Label>
                <div className="col-span-3">
                  <RadioGroup name="mode" defaultValue="offline" onValueChange={setCreateEventMode} className="flex gap-4">
                    <div className="flex items-center space-x-2"><RadioGroupItem value="offline" id="offline" /><Label htmlFor="offline">Offline</Label></div>
                    <div className="flex items-center space-x-2"><RadioGroupItem value="online" id="online" /><Label htmlFor="online">Online</Label></div>
                  </RadioGroup>
                  {createEventMode === "offline" && (
                    <div className="grid gap-2 mt-3">
                      <Input name="offline.venueName" placeholder="Venue Name" />
                      <Input name="offline.address" placeholder="Full Address" />
                    </div>
                  )}
                  {createEventMode === "online" && (
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
              <div className="grid grid-cols-4 items-start gap-4">
                 <Label className="text-right pt-2">Contact</Label>
                 <div className="col-span-3 grid gap-2">
                    <Input name="contacts[0].name" placeholder="Contact Person Name" />
                    <Input name="contacts[0].email" type="email" placeholder="Contact Email" />
                    <Input name="contacts[0].phone" placeholder="Contact Phone" />
                 </div>
              </div>
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
                <TableHead>Department</TableHead>
                <TableHead>
                  <span className="sr-only">Actions</span>
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={6} className="h-24 text-center">
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
                    <TableCell>{getDepartmentName(event.department)}</TableCell>
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
                           <DropdownMenuItem onClick={() => setEditingEvent(event)} onSelect={(e) => e.preventDefault()}>
                            <Edit className="mr-2 h-4 w-4" />
                            <span>Edit</span>
                           </DropdownMenuItem>
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                               <DropdownMenuItem onSelect={(e) => e.preventDefault()} className="text-red-600 focus:text-red-600">
                                 <Trash className="mr-2 h-4 w-4" />
                                 <span>Delete</span>
                               </DropdownMenuItem>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                                <AlertDialogDescription>
                                  This action cannot be undone. This will permanently delete the event
                                  <span className="font-semibold"> {event.name}</span>.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction onClick={() => handleDelete(event._id)}>Continue</AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                 <TableRow>
                    <TableCell colSpan={6} className="h-24 text-center">
                        No events found.
                    </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Edit Event Dialog */}
      <Dialog open={!!editingEvent} onOpenChange={() => setEditingEvent(null)}>
          <DialogContent className="sm:max-w-3xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="font-headline">Edit Event</DialogTitle>
              <DialogDescription>
                Update the details for &quot;{editingEvent?.name}&quot;.
              </DialogDescription>
            </DialogHeader>
            <form ref={editFormRef} action={updateFormAction}>
              <input type="hidden" name="eventId" value={editingEvent?._id || ''} />
              <div className="grid gap-6 py-4">
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="edit-name" className="text-right">Name</Label>
                  <Input id="edit-name" name="name" defaultValue={editingEvent?.name} className="col-span-3"/>
                </div>
                <div className="grid grid-cols-4 items-start gap-4">
                  <Label htmlFor="edit-description" className="text-right pt-2">Description</Label>
                  <Textarea id="edit-description" name="description" defaultValue={editingEvent?.description} className="col-span-3"/>
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="edit-thumbnailUrl" className="text-right">Thumbnail URL</Label>
                  <Input id="edit-thumbnailUrl" name="thumbnailUrl" defaultValue={editingEvent?.thumbnailUrl} className="col-span-3"/>
                </div>

                <div className="grid grid-cols-4 items-center gap-4">
                  <Label className="text-right">Start Date/Time</Label>
                  <div className="col-span-3 grid grid-cols-2 gap-2">
                      <Popover>
                          <PopoverTrigger asChild>
                              <Button variant={"outline"} className={cn("justify-start text-left font-normal", !editStartDate && "text-muted-foreground")}>
                              <CalendarIcon className="mr-2 h-4 w-4" />
                              {editStartDate ? format(editStartDate, "PPP") : <span>Pick a start date</span>}
                              </Button>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-0"><Calendar mode="single" selected={editStartDate} onSelect={setEditStartDate} initialFocus /></PopoverContent>
                      </Popover>
                      <div className="relative">
                        <Clock className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input name="startTime" type="time" value={editStartTime} onChange={e => setEditStartTime(e.target.value)} className="pl-8" />
                      </div>
                  </div>
                  <input type="hidden" name="startAt" value={editStartDate ? new Date(editStartDate.setHours(Number(editStartTime.split(':')[0]), Number(editStartTime.split(':')[1]))).toISOString() : ''} />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label className="text-right">End Date/Time</Label>
                  <div className="col-span-3 grid grid-cols-2 gap-2">
                      <Popover>
                          <PopoverTrigger asChild>
                              <Button variant={"outline"} className={cn("justify-start text-left font-normal", !editEndDate && "text-muted-foreground")}>
                              <CalendarIcon className="mr-2 h-4 w-4" />
                              {editEndDate ? format(editEndDate, "PPP") : <span>Pick an end date</span>}
                              </Button>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-0"><Calendar mode="single" selected={editEndDate} onSelect={setEditEndDate} initialFocus /></PopoverContent>
                      </Popover>
                      <div className="relative">
                        <Clock className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input name="endTime" type="time" value={editEndTime} onChange={e => setEditEndTime(e.target.value)} className="pl-8" />
                      </div>
                  </div>
                  <input type="hidden" name="endAt" value={editEndDate ? new Date(editEndDate.setHours(Number(editEndTime.split(':')[0]), Number(editEndTime.split(':')[1]))).toISOString() : ''} />
                </div>

                <div className="grid grid-cols-4 items-start gap-4">
                  <Label className="text-right pt-2">Event Mode</Label>
                  <div className="col-span-3">
                    <RadioGroup name="mode" value={editEventMode} onValueChange={setEditEventMode} className="flex gap-4">
                      <div className="flex items-center space-x-2"><RadioGroupItem value="offline" id="edit-offline" /><Label htmlFor="edit-offline">Offline</Label></div>
                      <div className="flex items-center space-x-2"><RadioGroupItem value="online" id="edit-online" /><Label htmlFor="edit-online">Online</Label></div>
                    </RadioGroup>
                    {editEventMode === "offline" && (
                      <div className="grid gap-2 mt-3">
                        <Input name="offline.venueName" placeholder="Venue Name" defaultValue={editingEvent?.offline?.venueName} />
                        <Input name="offline.address" placeholder="Full Address" defaultValue={editingEvent?.offline?.address} />
                      </div>
                    )}
                    {editEventMode === "online" && (
                      <div className="grid gap-2 mt-3">
                          <Select name="online.provider" defaultValue={editingEvent?.online?.provider}>
                              <SelectTrigger><SelectValue placeholder="Select Online Provider" /></SelectTrigger>
                              <SelectContent>
                                  <SelectItem value="google_meet">Google Meet</SelectItem>
                                  <SelectItem value="zoom">Zoom</SelectItem>
                                  <SelectItem value="other">Other</SelectItem>
                              </SelectContent>
                          </Select>
                          <Input name="online.url" placeholder="Meeting URL" defaultValue={editingEvent?.online?.url}/>
                      </div>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="edit-status" className="text-right">Status</Label>
                  <Select name="status" defaultValue={editingEvent?.status}>
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
                  <Button variant="outline" type="button" onClick={() => setEditingEvent(null)}>Cancel</Button>
                </DialogClose>
                <Button type="submit">Save Changes</Button>
              </DialogFooter>
            </form>
          </DialogContent>
      </Dialog>
    </div>
  );
}
