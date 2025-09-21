
'use server'

import { cookies } from 'next/headers';
import type { Payment, ApiSuccessResponse } from '@/lib/types';

const API_BASE_URL = 'https://symposium-backend.onrender.com';

function getApiKey(): string | undefined {
    return cookies().get('apiKey')?.value;
}

async function makeApiRequest(endpoint: string, options: RequestInit = {}) {
    const apiKey = getApiKey();

    const defaultHeaders: Record<string, string> = {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
    };

    // Only add API key if it exists. Let the main `api` utility handle public/private logic.
    if (apiKey) {
        defaultHeaders['x-api-key'] = apiKey;
    }


    const config: RequestInit = {
        ...options,
        headers: {
            ...defaultHeaders,
            ...options.headers,
        },
    };

    try {
        const response = await fetch(`${API_BASE_URL}/api/v1${endpoint}`, config);
        const responseData = await response.json();

        if (!response.ok || responseData.success === false) {
             const errorMessage = responseData.message || `API request failed with status: ${response.status}`;
             console.error("API Error Details:", responseData);
             throw new Error(errorMessage);
        }
        
        return responseData;
    } catch (error) {
        if (error instanceof Error) {
            throw error;
        }
        throw new Error('An unknown error occurred during the API request.');
    }
}

export async function getPayments(): Promise<Payment[]> {
    // The endpoint /symposium-payments might not be public, but /finance/transactions is.
    // Let's assume you want to hit the public finance endpoint.
    const response = await makeApiRequest('/finance/transactions?populate=user&limit=100', {
        next: { revalidate: 0 } // No caching
    });
    return (response as ApiSuccessResponse<{ data: Payment[] }>).data || [];
}
