
import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';

const API_BASE_URL = 'https://symposium-backend.onrender.com';

// This function communicates with your main backend to mark users as paid
async function flagUsersAsPaid(apiKey: string, razorpay_order_id: string, razorpay_payment_id: string, razorpay_signature: string) {
    if (!apiKey) {
        throw new Error("Internal API key is not configured.");
    }
    
    const response = await fetch(`${API_BASE_URL}/api/v1/symposium-payments/symposium/verify`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'x-api-key': apiKey,
        },
        body: JSON.stringify({
            razorpay_order_id,
            razorpay_payment_id,
            razorpay_signature,
        })
    });
    
    const responseData = await response.json();

    if (!response.ok || responseData.success === false) {
        throw new Error(responseData.message || `Backend verification failed with status: ${response.status}`);
    }

    return responseData;
}


export async function POST(request: NextRequest) {
 try {
    const { userApiKey, razorpay_order_id, razorpay_payment_id, razorpay_signature } = await request.json();

    if (!userApiKey) {
        return NextResponse.json({ success: false, message: 'Authentication failed: API Key is missing.' }, { status: 401 });
    }

    // First, verify the signature locally to ensure the request is from Razorpay
    const keySecret = process.env.RAZORPAY_KEY_SECRET;
    if (!keySecret) {
        throw new Error('Razorpay key secret is not defined in environment variables.');
    }
    const hmac = crypto.createHmac('sha256', keySecret);
    hmac.update(razorpay_order_id + '|' + razorpay_payment_id);
    const generatedSignature = hmac.digest('hex');

    if (generatedSignature !== razorpay_signature) {
        return NextResponse.json({ success: false, message: 'Payment verification failed: Invalid signature.' }, { status: 400 });
    }
    
    // If signature is valid, now tell our main backend to update the user statuses
    const backendResponse = await flagUsersAsPaid(userApiKey, razorpay_order_id, razorpay_payment_id, razorpay_signature);
    
    return NextResponse.json({ success: true, message: 'Payment verified successfully.', data: backendResponse }, { status: 200 });

 } catch (error) {
    console.error("Verification failed:", error);
    const errorMessage = error instanceof Error ? error.message : "An unknown error occurred";
    return NextResponse.json({ success: false, message: errorMessage }, { status: 500 });
 }
}
