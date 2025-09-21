
import { NextRequest, NextResponse } from 'next/server';

const API_BASE_URL = 'https://symposium-backend.onrender.com';

export async function POST(request: NextRequest) {
 try {
    const { 
        userApiKey, 
        razorpay_order_id, 
        razorpay_payment_id, 
        razorpay_signature,
        amount,
        currency,
        emails,
        meta,
    } = await request.json();

    if (!userApiKey) {
        return NextResponse.json({ success: false, message: 'Authentication failed: API Key is missing.' }, { status: 401 });
    }
    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
        return NextResponse.json({ success: false, message: 'Payment details are missing.' }, { status: 400 });
    }

    const backendResponse = await fetch(`${API_BASE_URL}/api/v1/symposium-payments/symposium/update`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'x-api-key': userApiKey,
        },
        body: JSON.stringify({
            razorpay_order_id,
            razorpay_payment_id,
            razorpay_signature,
            amount,
            currency,
            emails,
            meta
        })
    });
    
    const responseData = await backendResponse.json();

    if (!backendResponse.ok || responseData.success === false) {
        console.error("Backend verification failed:", responseData);
        throw new Error(responseData.message || `Backend verification failed with status: ${backendResponse.status}`);
    }

    return NextResponse.json({ success: true, message: 'Payment updated successfully.', data: responseData }, { status: 200 });

 } catch (error) {
    console.error("Update payment proxy failed:", error);
    const errorMessage = error instanceof Error ? error.message : "An unknown error occurred";
    return NextResponse.json({ success: false, message: errorMessage }, { status: 500 });
 }
}

    