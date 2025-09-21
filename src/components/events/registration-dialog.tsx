
"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { useForm, useFieldArray, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import type { Event, LoggedInUser, Registration, ApiSuccessResponse } from "@/lib/types";
import { useState } from "react";
import api from "@/lib/api";
import { Trash2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const memberSchema = z.object({
  name: z.string().min(1, "Name is required"),
  email: z.string().email("Invalid email address"),
});

const registrationSchema = z.object({
  type: z.enum(["individual", "team"]),
  teamName: z.string().optional(),
  members: z.array(memberSchema).optional(),
});

type RegistrationFormData = z.infer<typeof registrationSchema>;

type RegistrationDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  event: Event;
  user: LoggedInUser;
  onSuccess: () => void;
  onError: (error: Error) => void;
  onPaymentRequired: (registration: Registration) => void;
};

export function RegistrationDialog({
  open,
  onOpenChange,
  event,
  user,
  onSuccess,
  onError,
  onPaymentRequired,
}: RegistrationDialogProps) {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    control,
    watch,
    formState: { errors },
  } = useForm<RegistrationFormData>({
    resolver: zodResolver(registrationSchema),
    defaultValues: {
      type: "individual",
      members: [],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: "members",
  });

  const registrationType = watch("type");

  const handleRegistrationSubmit = async (data: RegistrationFormData) => {
    setIsSubmitting(true);
    try {
      const payload: any = {
        eventId: event._id,
        eventName: event.name,
        type: data.type,
      };

      if (data.type === "team") {
        if (!data.teamName) {
           toast({ variant: 'destructive', title: 'Validation Error', description: 'Team name is required.' });
           setIsSubmitting(false);
           return;
        }
        payload.team = {
          name: data.teamName,
          members: data.members || [],
          size: data.members?.length || 0, // Correctly calculate team size
        };
      }

      const response = await api<any>('/registrations', {
        method: 'POST',
        body: payload,
        authenticated: true,
      });
      
      // Check backend response to see if payment is needed
      if (response.payment?.needsPayment === true && response.registration) {
          onPaymentRequired(response.registration);
      } else {
          onSuccess();
      }

    } catch (error) {
      onError(error as Error);
    } finally {
      setIsSubmitting(false);
    }
  };
  
  const isPaidEvent = event.payment.price > 0 && !user.hasPaidForEvent;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle className="font-headline text-2xl">Register for {event.name}</DialogTitle>
          <DialogDescription>
            Confirm your details and choose your registration type.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit(handleRegistrationSubmit)}>
          <div className="grid gap-6 py-4">
            <div className="grid grid-cols-1 sm:grid-cols-4 items-center gap-4">
              <Label htmlFor="name" className="text-left sm:text-right">
                Your Name
              </Label>
              <Input id="name" value={user.name} className="sm:col-span-3" disabled />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-4 items-center gap-4">
              <Label htmlFor="email" className="text-left sm:text-right">
                Your Email
              </Label>
              <Input id="email" value={user.email} className="sm:col-span-3" disabled />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-4 items-start gap-4">
              <Label className="text-left sm:text-right pt-2">Type</Label>
              <Controller
                control={control}
                name="type"
                render={({ field }) => (
                  <RadioGroup
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                    className="sm:col-span-3 flex gap-4"
                  >
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="individual" id="individual" />
                      <Label htmlFor="individual">Individual</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="team" id="team" />
                      <Label htmlFor="team">Team</Label>
                    </div>
                  </RadioGroup>
                )}
              />
            </div>
            
            {registrationType === "team" && (
              <div className="grid grid-cols-1 gap-4">
                <div className="grid grid-cols-1 sm:grid-cols-4 items-center gap-4">
                   <Label htmlFor="teamName" className="text-left sm:text-right">Team Name</Label>
                   <Input id="teamName" {...register("teamName")} className="sm:col-span-3" placeholder="e.g., The Code Crusaders" />
                   {errors.teamName && <p className="col-start-2 col-span-3 text-xs text-destructive mt-1">{errors.teamName?.message}</p>}
                </div>
                
                <h4 className="font-semibold text-center mt-2">Team Members (Max 3)</h4>
                
                {fields.map((item, index) => (
                  <div key={item.id} className="grid grid-cols-1 sm:grid-cols-10 gap-2 items-start">
                     <div className="col-span-full sm:col-span-4">
                        <Label htmlFor={`members.${index}.name`} className="sr-only">Name</Label>
                        <Input
                            placeholder="Member Name"
                            {...register(`members.${index}.name`)}
                        />
                         {errors.members?.[index]?.name && <p className="text-xs text-destructive mt-1">{errors.members[index]?.name?.message}</p>}
                    </div>
                    <div className="col-span-full sm:col-span-5">
                        <Label htmlFor={`members.${index}.email`} className="sr-only">Email</Label>
                        <Input
                            placeholder="Member Email"
                             {...register(`members.${index}.email`)}
                        />
                        {errors.members?.[index]?.email && <p className="text-xs text-destructive mt-1">{errors.members[index]?.email?.message}</p>}
                    </div>
                    <Button type="button" variant="destructive" size="icon" onClick={() => remove(index)} className="col-span-full sm:col-span-1 justify-self-center sm:justify-self-auto">
                        <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
                 {fields.length < 3 && (
                  <div className="text-center">
                    <Button type="button" variant="outline" onClick={() => append({ name: "", email: "" })}>
                        Add Team Member ({3 - fields.length} remaining)
                    </Button>
                  </div>
                )}
              </div>
            )}
          </div>
          
           {isPaidEvent && (
            <div className="space-y-2 mt-4 pt-4 border-t">
                <h4 className="font-semibold text-lg">Payment Details</h4>
                 <p className="text-sm text-muted-foreground text-center pt-2">
                    A one-time symposium pass fee of <strong>{event.payment.currency} {event.payment.price}</strong> is required. 
                    This pass gives you free access to all other events. Your backend will calculate the final amount based on which team members have already paid.
                 </p>
            </div>
           )}

            {event.payment.price > 0 && user.hasPaidForEvent && (
                <div className="mt-4 pt-4 border-t text-center text-sm text-green-600 font-medium bg-green-50 p-3 rounded-md">
                    Your Symposium Pass is active. This registration is free!
                </div>
            )}


          <DialogFooter className="mt-6">
            <Button variant="outline" type="button" onClick={() => onOpenChange(false)} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Submitting...' : (isPaidEvent ? 'Proceed to Payment' : 'Confirm Registration')}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

    