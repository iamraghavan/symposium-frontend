
'use server'

import { cookies } from 'next/headers';
import type { Payment, ApiSuccessResponse, FinanceOverviewData } from '@/lib/types';

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

    const config: RequestInit = {
        ...options,
        headers: {
            ...defaultHeaders,
            ...options.headers,
        },
    };
    
    // The main `api` utility handles public/private logic. Here we just add key if it exists.
    if (apiKey) {
        config.headers = { ...config.headers, 'x-api-key': apiKey };
    }


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

export async function getFinanceOverview(): Promise<FinanceOverviewData | null> {
    try {
        const response = await makeApiRequest('/finance/overview?kind=symposium');
        return response as FinanceOverviewData;
    } catch (e) {
        console.error("Failed to fetch finance overview:", e);
        return null;
    }
}

export async function getPayments(): Promise<Payment[]> {
    const response = await makeApiRequest('/finance/transactions?populate=user&limit=100', {
        next: { revalidate: 0 } // No caching
    });
    return (response as ApiSuccessResponse<{ data: Payment[] }>).data || [];
}
