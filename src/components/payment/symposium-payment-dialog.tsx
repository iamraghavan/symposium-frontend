
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
import { IndianRupee } from "lucide-react";

type SymposiumPaymentDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  unpaidEmails: string[];
  onConfirmPayment: () => void;
};

export function SymposiumPaymentDialog({
  open,
  onOpenChange,
  unpaidEmails,
  onConfirmPayment,
}: SymposiumPaymentDialogProps) {
  const feePerPerson = 250;
  const baseAmount = feePerPerson * unpaidEmails.length;
  const razorpayFee = baseAmount * 0.02;
  const gst = razorpayFee * 0.18;
  const totalAmount = baseAmount + razorpayFee + gst;


  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="font-headline text-2xl">Symposium Fee Required</DialogTitle>
          <DialogDescription>
            A one-time symposium pass is required to register for any event.
          </DialogDescription>
        </DialogHeader>
        <div className="py-4">
            <div className="text-center mb-4">
                <p className="text-sm text-muted-foreground">Total amount to be paid:</p>
                <p className="text-4xl font-bold font-headline flex items-center justify-center">
                    <IndianRupee className="h-8 w-8" />{totalAmount.toFixed(2)}
                </p>
                <p className="text-xs text-muted-foreground">({unpaidEmails.length} person &times; ₹{feePerPerson}) + fees</p>
            </div>
            
            <div className="text-xs text-muted-foreground text-center my-4 border-t border-b py-2">
                Base Amount: <span className="font-semibold">₹{baseAmount.toFixed(2)}</span> + Razorpay Fee: <span className="font-semibold">₹{razorpayFee.toFixed(2)}</span> + GST: <span className="font-semibold">₹{gst.toFixed(2)}</span>
            </div>

            <div className="space-y-2">
                <h4 className="font-semibold text-center">Payment required for:</h4>
                <ul className="text-sm text-muted-foreground list-disc list-inside bg-muted p-3 rounded-md max-h-32 overflow-y-auto">
                    {unpaidEmails.map(email => <li key={email}>{email}</li>)}
                </ul>
            </div>
            
            <p className="text-xs text-center text-muted-foreground mt-4">
                This pass grants free access to all events in the symposium for the listed users.
            </p>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={onConfirmPayment}>
            Proceed to Pay ₹{totalAmount.toFixed(2)}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
