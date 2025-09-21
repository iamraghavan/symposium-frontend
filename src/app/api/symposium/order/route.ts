
import Razorpay from 'razorpay';
import { NextRequest, NextResponse } from 'next/server';

const razorpay = new Razorpay({
 key_id: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID!,
 key_secret: process.env.RAZORPAY_KEY_SECRET,
});

const SYMPOSIUM_FEE = 250; // Base fee in INR
const RAZORPAY_FEE_PERCENTAGE = 0.02; // 2%
const GST_PERCENTAGE = 0.18; // 18%

// This function calculates the total amount the customer should be charged
// so that the merchant receives the intended base amount after fees.
// Formula from Razorpay docs: Amount to charge = (Base Amount + 0.3) / (1 - (Fee % + (Fee % * GST %)))
// Simplified for 2% fee and 18% GST: (Base Amount) / (1 - 0.0236)
// Note: Razorpay has a minimum fee, but for simplicity we'll use the percentage.
// Let's pass the fees to the user instead.
function calculateTotalWithFees(baseAmount: number): number {
    const razorpayFee = baseAmount * RAZORPAY_FEE_PERCENTAGE;
    const gstOnFee = razorpayFee * GST_PERCENTAGE;
    const totalAmount = baseAmount + razorpayFee + gstOnFee;
    return Math.ceil(totalAmount); // Round up to nearest whole number for INR
}


export async function POST(request: NextRequest) {
 try {
    const { emails } = (await request.json()) as { emails: string[] };

    if (!emails || !Array.isArray(emails) || emails.length === 0) {
        return NextResponse.json({ message: "Emails are required." }, { status: 400 });
    }

    const baseAmount = emails.length * SYMPOSIUM_FEE;
    const totalAmountInRupees = calculateTotalWithFees(baseAmount);
    const amountInPaise = totalAmountInRupees * 100;

    const options = {
        amount: amountInPaise,
        currency: 'INR',
        receipt: `symposium_rcpt_${Date.now()}`,
        notes: {
            emails: emails.join(','),
            baseAmount: baseAmount,
            fees: totalAmountInRupees - baseAmount
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
