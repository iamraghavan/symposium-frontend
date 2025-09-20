
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
import Image from "next/image";
import { useState } from "react";
import api from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import type { Event, Registration } from "@/lib/types";

type QrDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  registration: Registration;
  event: Event;
};

export function QrDialog({ open, onOpenChange, registration, event }: QrDialogProps) {
  const { toast } = useToast();
  const [utr, setUtr] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!utr) {
      toast({
        variant: "destructive",
        title: "Missing Information",
        description: "Please enter the transaction reference number (UTR).",
      });
      return;
    }
    setIsSubmitting(true);
    try {
        await api(`/registrations/${registration._id}/payment/qr`, {
            method: 'POST',
            body: { qrReference: utr },
            authenticated: true,
        });
        toast({
            title: "Submission Successful",
            description: "Your payment proof has been submitted and is awaiting verification.",
        });
        onOpenChange(false);
        // Optionally, you can trigger a refresh of the user's registrations here.
    } catch(error) {
        toast({
            variant: 'destructive',
            title: 'Submission Failed',
            description: (error as Error).message || 'An unknown error occurred.',
        });
    } finally {
        setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="font-headline">Complete Your Payment</DialogTitle>
          <DialogDescription>
            Scan the QR code below to pay the registration fee of <strong>₹{event.payment.price}</strong> for &quot;{event.name}&quot;.
          </DialogDescription>
        </DialogHeader>
        <div className="flex flex-col items-center gap-4 py-4">
          {event.payment.qrImageUrl ? (
             <Image
                src={event.payment.qrImageUrl}
                alt="Payment QR Code"
                width={250}
                height={250}
                className="rounded-lg border p-1"
                data-ai-hint="qr code"
              />
          ) : (
            <div className="w-[250px] h-[250px] bg-muted rounded-lg flex items-center justify-center text-sm text-muted-foreground">
                QR Code not available
            </div>
          )}
         
          <p className="text-sm text-center text-muted-foreground px-4">
            {event.payment.qrInstructions || 'After paying, enter the transaction reference number (UTR) below.'}
          </p>
          <div className="w-full px-4">
            <Label htmlFor="utr" className="sr-only">
              Transaction Reference (UTR)
            </Label>
            <Input
              id="utr"
              placeholder="Enter UTR / Transaction ID"
              value={utr}
              onChange={(e) => setUtr(e.target.value)}
              disabled={isSubmitting}
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={isSubmitting}>
            {isSubmitting ? 'Submitting...' : 'Submit Proof'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
