
"use client";

import Image from "next/image";
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
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { winners as allWinners } from "@/lib/data";
import { parseISO, format } from 'date-fns';
import { notFound, useParams, useRouter } from "next/navigation";
import { Calendar, Users, Trophy, Globe, Info, Clock, TicketCheck, ExternalLink, Phone, Mail, Link as LinkIcon, IndianRupee, Building } from "lucide-react";
import React, { useEffect, useState } from "react";
import api from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import type { Event, ApiSuccessResponse, Winner, Department, LoggedInUser, Registration } from '@/lib/types';
import { Skeleton } from "@/components/ui/skeleton";
import { QrDialog } from "@/components/payment/qr-dialog";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useGoogleAuth } from "@/components/layout/google-one-tap";
import { GoogleLogin } from "@react-oauth/google";
import { RegistrationDialog } from "@/components/events/registration-dialog";

export default function EventDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { toast } = useToast();
  const { handleGoogleAuth } = useGoogleAuth();
  const eventId = params.eventId as string;
  
  const [event, setEvent] = useState<Event | null>(null);
  const [user, setUser] = useState<LoggedInUser | null>(null);
  const [winners, setWinners] = useState<Winner[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  const [isRegistering, setIsRegistering] = useState(false);
  const [isRegistrationDialogOpen, setIsRegistrationDialogOpen] = useState(false);

  const [qrDialogOpen, setQrDialogOpen] = useState(false);
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [isAlreadyRegisteredDialogOpen, setIsAlreadyRegisteredDialogOpen] = useState(false);
  const [currentRegistration, setCurrentRegistration] = useState<Registration | null>(null);

  useEffect(() => {
    const userData = localStorage.getItem("loggedInUser");
    if (userData) {
      setUser(JSON.parse(userData));
    }

    if (!eventId) return;

    const fetchEventData = async () => {
      setIsLoading(true);
      try {
        const response = await api<ApiSuccessResponse<{ event: Event }>>(`/events/${eventId}`);
        if (response.success && response.data) {
          setEvent(response.data as unknown as Event);
          // This should be replaced with an API call in the future
          setWinners(allWinners.filter(w => w.eventId === (response.data as Event)?._id));
        } else {
           throw new Error("Event not found in API response.");
        }
      } catch (error) {
        toast({ variant: 'destructive', title: 'Error', description: (error as Error).message || 'Could not fetch event details.'});
        notFound();
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchEventData();
  }, [eventId, toast]);

  const handleRazorpayPayment = async (registration: Registration, razorpayOrderId: string) => {
     if (!user) return;
     const razorpayKeyId = process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID;
     if (!razorpayKeyId) {
        toast({ variant: 'destructive', title: 'Configuration Error', description: 'Razorpay Key ID is not configured.'});
        return;
     }

    const options = {
        key: razorpayKeyId,
        amount: registration.payment.amount * 100, // amount in the smallest currency unit
        currency: registration.payment.currency,
        name: event?.name,
        description: `Registration for ${event?.name}`,
        image: 'https://cdn.egspec.org/assets/img/logo-sm.png',
        order_id: razorpayOrderId,
        handler: async function (response: any) {
            try {
                await api(`/registrations/${registration._id}/payment/verify`, {
                    method: 'POST',
                    body: {
                        razorpay_order_id: response.razorpay_order_id,
                        razorpay_payment_id: response.razorpay_payment_id,
                        razorpay_signature: response.razorpay_signature,
                    },
                    authenticated: true,
                });
                toast({ title: 'Payment Successful', description: 'Your registration is confirmed!' });
                 window.location.reload();
            } catch (error) {
                toast({ variant: 'destructive', title: 'Payment Verification Failed', description: (error as Error).message });
            }
        },
        prefill: {
            name: user.name,
            email: user.email,
        },
        notes: {
            registration_id: registration._id,
        },
        theme: {
            color: '#9D4EDD',
        },
    };
    const rzp = new (window as any).Razorpay(options);
    rzp.open();
  }

  const handleOpenRegistration = () => {
    if (!user) {
      setIsLoginModalOpen(true);
      return;
    }
     if (user.provider !== 'google') {
       toast({ variant: 'destructive', title: 'Registration Unavailable', description: "Registration is only open for users who signed in with Google." });
       return;
    }
    setIsRegistrationDialogOpen(true);
  }
  
  const onRegistrationSuccess = (registration: Registration, hints: any) => {
    setIsRegistrationDialogOpen(false);
    setCurrentRegistration(registration);
    if (hints?.next === 'confirmed') {
      toast({ title: 'Success', description: 'You have been registered for the event!' });
      window.location.reload();
    } else if (hints?.next === 'pay_gateway' && hints?.razorpayOrderId) {
        handleRazorpayPayment(registration, hints.razorpayOrderId);
    } else if (hints?.next === 'submit_qr_proof') {
      setQrDialogOpen(true);
    } else {
        toast({ title: 'Registration Pending', description: 'Your registration is pending further action.' });
    }
  }
  
   const onRegistrationError = (error: Error) => {
    setIsRegistrationDialogOpen(false);
    if (error.message === 'You already have a registration for this event.') {
        setIsAlreadyRegisteredDialogOpen(true);
    } else {
        toast({ variant: 'destructive', title: 'Registration Failed', description: error.message });
    }
  }


  if (isLoading) {
    return (
      <div className="bg-background">
        <Skeleton className="h-64 md:h-80 w-full rounded-none" />
        <div className="container mx-auto px-4 md:px-6 py-8 md:py-12">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 lg:gap-12">
              <div className="lg:col-span-2 space-y-8">
                 <Skeleton className="h-10 w-3/4" />
                 <Skeleton className="h-24 w-full" />
                 <Skeleton className="h-10 w-32" />
              </div>
               <div className="lg:col-span-1 space-y-6">
                  <Skeleton className="h-64 w-full" />
               </div>
            </div>
        </div>
      </div>
    )
  }

  if (!event) {
    return notFound();
  }

  const departmentName = typeof event.department === 'object' ? event.department.name : 'Unknown Department';
  const paymentMethodText = event.payment.method === 'none' ? 'Free' : event.payment.method === 'gateway' ? 'Online Gateway' : 'QR Code';

  return (
    <>
      <div className="bg-background text-foreground">
        {/* Hero Section */}
        <section className="relative h-64 md:h-80 w-full">
          <Image
            src={event.thumbnailUrl || 'https://picsum.photos/seed/event-hero/1200/400'}
            alt={`${event.name} banner`}
            fill
            priority
            className="object-cover"
            data-ai-hint={event.imageHint || 'event banner'}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />
          <div className="relative h-full flex flex-col justify-end container mx-auto px-4 md:px-6 pb-8">
            <Badge variant="secondary" className="w-fit mb-2">{departmentName}</Badge>
            <h1 className="text-3xl md:text-5xl font-bold font-headline text-white">{event.name}</h1>
            <p className="text-lg md:text-xl font-medium text-gray-200 mt-1">
              Happening on {format(parseISO(event.startAt), "MMMM d, yyyy")}
            </p>
          </div>
        </section>

        {/* Main Content */}
        <main className="container mx-auto px-4 md:px-6 py-8 md:py-12">
          <Tabs defaultValue="overview" className="w-full">
            <TabsList className="grid w-full grid-cols-3 mb-8">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="participants">Participants</TabsTrigger>
              <TabsTrigger value="winners">Winners</TabsTrigger>
            </TabsList>
            
            <TabsContent value="overview">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 lg:gap-12">
                {/* Left Column */}
                <div className="lg:col-span-2 space-y-8">
                  <div>
                    <h2 className="text-2xl font-bold font-headline mb-4">About the Event</h2>
                    <p className="text-lg text-muted-foreground leading-relaxed">{event.description}</p>
                  </div>
                  
                  <div id="contacts">
                    <h2 className="text-2xl font-bold font-headline mb-4">Contact Information</h2>
                    <Card>
                      <CardContent className="p-6 grid gap-6">
                        {event.contacts?.map((contact, index) => (
                          <div key={index} className="flex items-start gap-4">
                            <Avatar className="mt-1 h-12 w-12">
                              <AvatarFallback>{contact.name.charAt(0)}</AvatarFallback>
                            </Avatar>
                            <div>
                              <p className="font-semibold text-lg">{contact.name}</p>
                              <div className="text-sm text-muted-foreground space-y-1 mt-1">
                                {contact.email && <a href={`mailto:${contact.email}`} className="flex items-center gap-2 hover:text-primary transition-colors"><Mail className="h-4 w-4" />{contact.email}</a>}
                                {contact.phone && <a href={`tel:${contact.phone}`} className="flex items-center gap-2 hover:text-primary transition-colors"><Phone className="h-4 w-4" />{contact.phone}</a>}
                              </div>
                            </div>
                          </div>
                        ))}
                        {event.contactEmail && (
                          <div className="flex items-start gap-4">
                            <Avatar className="mt-1 h-12 w-12">
                              <AvatarFallback>M</AvatarFallback>
                            </Avatar>
                            <div>
                              <p className="font-semibold text-lg">Event Manager</p>
                              <a href={`mailto:${event.contactEmail}`} className="flex items-center gap-2 text-sm text-muted-foreground hover:text-primary transition-colors"><Mail className="h-4 w-4" />{event.contactEmail}</a>
                            </div>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  </div>

                </div>
                {/* Right Sidebar */}
                <div className="lg:col-span-1 space-y-6">
                  <Card className="overflow-hidden">
                    <CardContent className="p-0">
                      <div className="bg-primary/10 p-4 text-center">
                        <h3 className="font-bold text-lg text-primary">Registration is Open!</h3>
                      </div>
                      <div className="p-4">
                          <Button size="lg" className="w-full" onClick={handleOpenRegistration} disabled={isRegistering}>
                              <TicketCheck className="mr-2 h-5 w-5"/>
                              {isRegistering ? 'Processing...' : 'Register Now'}
                          </Button>
                      </div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardHeader>
                      <CardTitle className="font-headline">Event Details</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4 text-sm">
                      <div className="flex items-start">
                        <Calendar className="mr-3 h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
                        <div>
                          <h3 className="font-semibold">Date & Time</h3>
                          <p className="text-muted-foreground">{format(parseISO(event.startAt), "MMM d, yyyy, h:mm a")} - {format(parseISO(event.endAt), "h:mm a")}</p>
                        </div>
                      </div>
                      <div className="flex items-start">
                        <Globe className="mr-3 h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
                        <div>
                          <h3 className="font-semibold">Mode & Location</h3>
                          <p className="text-muted-foreground capitalize">
                            {event.mode}
                          </p>
                          {event.mode === 'online' ? 
                            <a href={event.online?.url} target="_blank" rel="noopener noreferrer" className="text-primary underline flex items-center gap-1 text-xs">Meeting Link <ExternalLink className="h-3 w-3"/></a> 
                            : 
                            <p className="text-muted-foreground">{event.offline?.venueName}, {event.offline?.address}</p>
                          }
                        </div>
                      </div>
                      <div className="flex items-start">
                        <IndianRupee className="mr-3 h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
                        <div>
                          <h3 className="font-semibold">Registration Fee</h3>
                          <p className="text-muted-foreground">{event.payment.price > 0 ? `${event.payment.currency} ${event.payment.price}` : 'Free'} <span className="text-xs">({paymentMethodText})</span></p>
                        </div>
                      </div>
                      <div className="flex items-start">
                          <Building className="mr-3 h-4 w-4 text-muted-foreground mt-0.5 shrink-0"/>
                          <div>
                              <h3 className="font-semibold">Managed By</h3>
                              <Badge variant="outline">{departmentName}</Badge>
                          </div>
                      </div>
                      {event.departmentSite && (
                        <div className="flex items-start">
                            <LinkIcon className="mr-3 h-4 w-4 text-muted-foreground mt-0.5 shrink-0"/>
                            <div>
                                <h3 className="font-semibold">Event Website</h3>
                                <a href={event.departmentSite} target="_blank" rel="noopener noreferrer" className="text-primary underline flex items-center gap-1 text-xs">{new URL(event.departmentSite).hostname} <ExternalLink className="h-3 w-3"/></a>
                            </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="participants">
                <Card>
                    <CardHeader>
                        <CardTitle className="font-headline">Participants</CardTitle>
                        <CardDescription>A list of participants who have registered for this event.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="flex flex-1 items-center justify-center rounded-lg border border-dashed shadow-sm h-60">
                              <div className="flex flex-col items-center gap-2 text-center">
                                  <Users className="h-10 w-10 text-muted-foreground" />
                                  <h3 className="text-xl font-bold tracking-tight">No Participants Yet</h3>
                                  <p className="text-sm text-muted-foreground">User registrations will appear here once available.</p>
                              </div>
                          </div>
                    </CardContent>
                </Card>
            </TabsContent>
            
            <TabsContent value="winners">
              <Card>
                  <CardHeader>
                      <CardTitle className="font-headline">Event Winners</CardTitle>
                      <CardDescription>Prizes and winners for this event.</CardDescription>
                  </CardHeader>
                  <CardContent>
                      {winners.length > 0 ? (
                          <Table>
                          <TableHeader>
                              <TableRow>
                              <TableHead>Position</TableHead>
                              <TableHead>Winner</TableHead>
                              <TableHead className="text-right">Prize Amount</TableHead>
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
                                  <TableCell className="font-semibold text-right">₹{winner.prizeAmount.toLocaleString()}</TableCell>
                              </TableRow>
                              ))}
                          </TableBody>
                          </Table>
                      ) : (
                          <div className="flex flex-1 items-center justify-center rounded-lg border border-dashed shadow-sm h-60">
                              <div className="flex flex-col items-center gap-2 text-center">
                                  <Trophy className="h-10 w-10 text-muted-foreground" />
                                  <h3 className="text-xl font-bold tracking-tight">Winners Not Announced</h3>
                                  <p className="text-sm text-muted-foreground">Winners have not been announced for this event yet. Stay tuned!</p>
                              </div>
                          </div>
                      )}
                  </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </main>
      </div>
      
       {user && event && (
        <RegistrationDialog
          open={isRegistrationDialogOpen}
          onOpenChange={setIsRegistrationDialogOpen}
          event={event}
          user={user}
          onSuccess={onRegistrationSuccess}
          onError={onRegistrationError}
        />
      )}

       <Dialog open={isLoginModalOpen} onOpenChange={setIsLoginModalOpen}>
        <DialogContent className="sm:max-w-md">
            <DialogHeader>
                <DialogTitle className="font-headline text-2xl">Join the Event</DialogTitle>
                <DialogDescription>
                    Please sign in with your Google account to register and secure your spot.
                </DialogDescription>
            </DialogHeader>
            <div className="flex flex-col items-center justify-center gap-4 py-4">
                 <GoogleLogin
                    onSuccess={handleGoogleAuth}
                    onError={() => {
                        console.error('Login Failed');
                        toast({
                            variant: 'destructive',
                            title: 'Login Failed',
                            description: 'Could not authenticate with Google. Please try again.'
                        })
                    }}
                />
            </div>
        </DialogContent>
      </Dialog>
      
      {event?.payment.method === 'qr' && currentRegistration && (
          <QrDialog
            open={qrDialogOpen}
            onOpenChange={setQrDialogOpen}
            registration={currentRegistration}
            event={event}
          />
      )}

      <AlertDialog open={isAlreadyRegisteredDialogOpen} onOpenChange={setIsAlreadyRegisteredDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Already Registered</AlertDialogTitle>
            <AlertDialogDescription>
              You have already registered for this event. You can view your registration status in your dashboard.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
             <AlertDialogAction onClick={() => setIsAlreadyRegisteredDialogOpen(false)}>Close</AlertDialogAction>
            <AlertDialogAction onClick={() => router.push('/u/d/registered-events')}>
              Go to Dashboard
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

    