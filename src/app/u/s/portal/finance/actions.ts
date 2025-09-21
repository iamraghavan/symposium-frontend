
'use server'

import { cookies } from 'next/headers';
import type { Payment, ApiSuccessResponse } from '@/lib/types';

const API_BASE_URL = 'https://symposium-backend.onrender.com';

function getApiKey(): string {
    const userApiKey = cookies().get('apiKey')?.value;
    if (!userApiKey) {
        throw new Error("Authentication details not found. User API key is missing from cookies.");
    }
    return userApiKey;
}

async function makeApiRequest(endpoint: string, apiKey: string, options: RequestInit = {}) {
    if (!apiKey) {
        throw new Error("API key is missing.");
    }

    const defaultHeaders: Record<string, string> = {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'x-api-key': apiKey,
    };

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
    const apiKey = getApiKey();
    if (!apiKey) {
        throw new Error("API Key is missing for authentication.");
    }

    const response = await makeApiRequest('/symposium-payments?populate=user', apiKey, {
        next: { revalidate: 0 } // No caching
    });
    return (response as ApiSuccessResponse<{ data: Payment[] }>).data || [];
}
