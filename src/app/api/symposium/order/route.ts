import Razorpay from 'razorpay';
import { NextRequest, NextResponse } from 'next/server';

const razorpay = new Razorpay({
 key_id: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID!,
 key_secret: process.env.RAZORPAY_KEY_SECRET,
});

const SYMPOSIUM_FEE = 250;

export async function POST(request: NextRequest) {
 try {
    const { emails } = (await request.json()) as { emails: string[] };

    if (!emails || !Array.isArray(emails) || emails.length === 0) {
        return NextResponse.json({ message: "Emails are required." }, { status: 400 });
    }

    const amount = emails.length * SYMPOSIUM_FEE * 100; // Amount in paise

    const options = {
        amount: amount,
        currency: 'INR',
        receipt: `symposium_rcpt_${Date.now()}`,
        notes: {
            emails: emails.join(','),
        }
    };

    const order = await razorpay.orders.create(options);
    
    return NextResponse.json({ 
        success: true,
        payment: {
            keyId: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
            order: {
                id: order.id,
                amount: order.amount,
                currency: order.currency
            }
        }
     }, { status: 201 });

 } catch (error) {
    console.error("Razorpay order creation failed:", error);
    const errorMessage = error instanceof Error ? error.message : "An unknown error occurred";
    return NextResponse.json({ message: "Failed to create order", error: errorMessage }, { status: 500 });
 }
}
