
'use server'

import { cookies } from 'next/headers';
import type { ApiSuccessResponse, LoggedInUser } from '@/lib/types';
import { revalidatePath } from 'next/cache';

const API_BASE_URL = 'https://symposium-backend.onrender.com';

export type StatsOverview = {
    scope: Record<string, any>;
    kpis: {
        users: number;
        events: number;
        registrations: number;
        participants: number;
        paidPasses: number;
    };
    sparklines: {
        registrationsDaily: { date: string, count: number }[];
    };
};

export type FinanceOverview = {
    filters: Record<string, any>;
    grossInr: number;
    paidCount: number;
    avgTicketInr: number;
    byDay: { date: string, amountInr: number, count: number }[];
}

export type Participant = {
    _id: string;
    name: string;
    email: string;
    picture: string;
    college: string;
    department: string;
    createdAt: string;
}

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
        next: { revalidate: 60 } // Revalidate every 60 seconds
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


export async function getStatisticsOverview(): Promise<StatsOverview | null> {
    const userCookie = cookies().get('loggedInUser')?.value;
    
    let url = '/analytics/statistics/overview';
    if (userCookie) {
        const user: LoggedInUser = JSON.parse(userCookie);
        if (user.role === 'department_admin' && user.department) {
            const departmentId = typeof user.department === 'string' ? user.department : (user.department as any)._id;
            url += `?departmentId=${departmentId}`;
        }
    }

    try {
        const response = await makeApiRequest(url);
        return response as StatsOverview;
    } catch(e) {
        console.error("Failed to fetch stats overview:", e);
        return null;
    }
}


export async function getFinanceOverview(): Promise<FinanceOverview | null> {
    try {
        const response = await makeApiRequest('/finance/overview?kind=symposium');
        return response as FinanceOverview;
    } catch(e) {
        console.error("Failed to fetch finance overview:", e);
        return null;
    }
}

export async function getRecentParticipants(): Promise<Participant[]> {
    try {
        const response = await makeApiRequest('/analytics/statistics/participants?limit=5&sort=-createdAt');
        return (response as ApiSuccessResponse<Participant[]>).data || [];
    } catch(e) {
        console.error("Failed to fetch recent participants:", e);
        return [];
    }
}
