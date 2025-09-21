'use client';
import { useState } from 'react';
import Script from 'next/script';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';

declare global {
    interface Window {
        Razorpay: any;
    }
}

function TestPaymentPage() {
 const { toast } = useToast();
 const [name, setName] = useState('Test User');
 const [email, setEmail] = useState('test@example.com');
 const [amount, setAmount] = useState('250');

 const createOrderId = async () => {
  try {
   const response = await fetch('/api/order', {
    method: 'POST',
    headers: {
     'Content-Type': 'application/json',
    },
    body: JSON.stringify({
     amount: parseFloat(amount) * 100, // Amount in paise
     currency: 'INR'
    }),
   });

   if (!response.ok) {
    throw new Error('Network response was not ok');
   }

   const data = await response.json();
   return data.orderId;
  } catch (error) {
   console.error('There was a problem with your fetch operation:', error);
   toast({
    variant: "destructive",
    title: "Error creating order",
    description: (error as Error).message
   })
  }
 };

const processPayment = async (e: React.FormEvent<HTMLFormElement>) => {
  e.preventDefault();
  try {
   const orderId: string = await createOrderId();
   if (!orderId) {
    return;
   }

   const options = {
    key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
    amount: parseFloat(amount) * 100,
    currency: 'INR',
    name: 'Symposium Central Test',
    description: 'Test Transaction',
    order_id: orderId,
    handler: async function (response: any) {
     const data = {
      orderCreationId: orderId,
      razorpayPaymentId: response.razorpay_payment_id,
      razorpayOrderId: response.razorpay_order_id,
      razorpaySignature: response.razorpay_signature,
     };

     const result = await fetch('/api/verify', {
      method: 'POST',
      body: JSON.stringify(data),
      headers: { 'Content-Type': 'application/json' },
     });
     const res = await result.json();
     if (res.isOk) {
        toast({
            title: "Payment Successful",
            description: "Payment verified successfully."
        })
     } else {
        toast({
            variant: "destructive",
            title: "Payment Verification Failed",
            description: res.message
        })
     }
    },
    prefill: {
     name: name,
     email: email,
    },
    theme: {
     color: '#9D4EDD',
    },
   };

   const paymentObject = new window.Razorpay(options);
   paymentObject.on('payment.failed', function (response: any) {
    toast({
        variant: "destructive",
        title: "Payment Failed",
        description: response.error.description
    })
   });
   paymentObject.open();
  } catch (error) {
   console.log(error);
  }
 };

 
 return (
  <>
   <Script
    id="razorpay-checkout-js"
    src="https://checkout.razorpay.com/v1/checkout.js"
   />

   <section className="min-h-[calc(100vh-8rem)] flex flex-col items-center justify-center p-4">
    <Card className="w-full max-w-md">
        <CardHeader>
            <CardTitle>Razorpay Test Payment</CardTitle>
            <CardDescription>Use this page to test your Razorpay integration and keys.</CardDescription>
        </CardHeader>
        <CardContent>
            <form
            className="flex flex-col gap-6"
            onSubmit={processPayment}
            >
            <div className="space-y-1">
            <Label htmlFor="name">Full name</Label>
            <Input
                id="name"
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
            />
            </div>
            <div className="space-y-1">
            <Label htmlFor="email">Email</Label>
            <Input
                id="email"
                type="email"
                placeholder="user@gmail.com"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
            />
            </div>
            <div className="space-y-1">
            <Label htmlFor="amount">Amount (INR)</Label>
            <Input
                id="amount"
                type="number"
                step="1"
                min={1}
                required
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
            />
            </div>

            <Button type="submit">Pay with Razorpay</Button>
            </form>
        </CardContent>
    </Card>
    
   </section>
  </>
 );
}

export default TestPaymentPage;