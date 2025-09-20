
'use server'

import { revalidatePath } from 'next/cache';
import { cookies } from 'next/headers';
import type { Event, ApiSuccessResponse, LoggedInUser, Department, ApiErrorResponse } from '@/lib/types';
import { formDataToObject } from '@/lib/utils';

const API_BASE_URL = process.env.API_BASE_URL;

async function makeApiRequest(endpoint: string, options: RequestInit = {}) {
    const userApiKey = cookies().get('apiKey')?.value;
    const key = userApiKey || process.env.API_KEY;

    console.log(`[makeApiRequest] Using API Key: ${key ? 'found' : 'NOT FOUND'}`);

    if (!key) {
        throw new Error("API key is missing.");
    }
    
    const defaultHeaders: Record<string, string> = {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'x-api-key': key,
    };
    
    const config: RequestInit = {
        ...options,
        headers: {
            ...defaultHeaders,
            ...options.headers,
        },
    };

    console.log(`[makeApiRequest] Calling endpoint: ${endpoint}`);
    console.log(`[makeApiRequest] With headers:`, JSON.stringify(config.headers, null, 2));


    try {
        const response = await fetch(`${API_BASE_URL}/api/v1${endpoint}`, config);
        const responseData = await response.json();

        if (!response.ok || responseData.success === false) {
             const errorMessage = responseData.message || `API request failed with status: ${response.status}`;
             console.error("[makeApiRequest] API Error Details:", JSON.stringify(responseData, null, 2));
             throw new Error(errorMessage);
        }
        
        console.log('[makeApiRequest] API Success Response:', JSON.stringify(responseData, null, 2).substring(0, 500) + '...');
        return responseData;
    } catch (error) {
        console.error('[makeApiRequest] Full API Request Error in action:', error);
        if (error instanceof Error) {
            throw error;
        }
        throw new Error('An unknown error occurred during the API request.');
    }
}

export async function getEvents(): Promise<Event[]> {
  try {
    const userCookie = cookies().get('loggedInUser');
    if (!userCookie) {
        throw new Error("User not logged in.");
    }

    const user: LoggedInUser = JSON.parse(userCookie.value);
    console.log(`[getEvents] Fetching events for user: ${user.email}, role: ${user.role}`);

    let endpoint = '/events/admin'; // Default for super admin

    if (user.role === 'department_admin') {
      console.log(`[getEvents] Department admin detected. User ID: ${user._id}`);
      endpoint = `/events/admin/created-by/${user._id}`;
    } else {
      console.log(`[getEvents] Super admin detected. Using general admin endpoint.`);
    }

    const response: ApiSuccessResponse<{ events?: Event[], data?: Event[] }> = await makeApiRequest(endpoint);
    // API returns 'data' field, not 'events'
    return response.data || [];
  } catch (error) {
    console.error("[getEvents] Failed to fetch events:", error);
    // Re-throw to be caught by the page component
    throw new Error("Could not fetch events.");
  }
}

export async function getDepartments(): Promise<Department[]> {
  try {
    const response: ApiSuccessResponse<{ departments: Department[] }> = await makeApiRequest('/departments?limit=100');
    return response.data?.departments || [];
  } catch (error) {
    console.error("[getDepartments] Failed to fetch departments:", error);
    throw new Error("Could not fetch departments.");
  }
}


export async function createEvent(prevState: any, formData: FormData) {
    const eventData = formDataToObject(formData);
    
    const userCookie = cookies().get('loggedInUser');
    if (!userCookie) return { message: 'Authentication error', success: false };
    const user: LoggedInUser = JSON.parse(userCookie.value);

    // Manual reconstruction for complex nested objects from flat form data
    const payload: Record<string, any> = {
      name: eventData.name,
      description: eventData.description,
      thumbnailUrl: eventData.thumbnailUrl,
      mode: eventData.mode,
      startAt: eventData.startAt,
      endAt: eventData.endAt,
      departmentId: user.role === 'department_admin' ? user.department : eventData.departmentId,
      status: eventData.status,
      payment: {
        method: eventData['payment.method'],
        price: Number(eventData['payment.price'] || 0),
        currency: eventData['payment.currency']
      },
      contacts: [{
        name: eventData['contacts[0].name'],
        email: eventData['contacts[0].email'],
        phone: eventData['contacts[0].phone'],
      }]
    };

    if (payload.mode === 'online') {
        payload.online = {
            provider: eventData['online.provider'],
            url: eventData['online.url']
        };
    } else if (payload.mode === 'offline') {
        payload.offline = {
            venueName: eventData['offline.venueName'],
            address: eventData['offline.address']
        };
    }
    
    try {
        console.log("[createEvent] Payload:", JSON.stringify(payload, null, 2));
        await makeApiRequest('/events', {
            method: 'POST',
            body: JSON.stringify(payload),
        });

        revalidatePath('/u/s/portal/events');
        return { message: 'Event created successfully.', success: true };
    } catch (error) {
        console.error("[createEvent] Failed to create event:", error);
        return { message: (error as Error).message, success: false };
    }
}
