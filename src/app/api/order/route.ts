import Razorpay from 'razorpay';
import { NextRequest, NextResponse } from 'next/server';

const razorpay = new Razorpay({
 key_id: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID!,
 key_secret: process.env.RAZORPAY_KEY_SECRET,
});

export async function POST(request: NextRequest) {
 const { amount, currency } = (await request.json()) as {
  amount: number;
  currency: string;
 };

 var options = {
  amount: amount,
  currency: currency,
  receipt: `rcp_${Date.now()}`,
 };

 try {
    const order = await razorpay.orders.create(options);
    return NextResponse.json({ orderId: order.id }, { status: 200 });
 } catch (error) {
    console.error("Razorpay order creation failed:", error);
    return NextResponse.json({ message: "Failed to create order" }, { status: 500 });
 }
}