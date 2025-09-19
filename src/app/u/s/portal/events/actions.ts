
'use server'

import { revalidatePath } from 'next/cache';
import type { Event, LoggedInUser } from '@/lib/types';
import { cookies } from 'next/headers';
import { formDataToObject } from '@/lib/utils';

type EventApiResponse = {
    success: boolean;
    data: Event[];
    meta: {
        total: number;
        page: number;
        limit: number;
        hasMore: boolean;
    }
}

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;
const API_KEY = process.env.NEXT_PUBLIC_API_KEY;

async function makeApiRequest(endpoint: string, options: RequestInit = {}, authenticated: boolean = false) {
    const token = cookies().get('jwt')?.value;
    const defaultHeaders: Record<string, string> = {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
    };
    if (API_KEY) {
        defaultHeaders['x-api-key'] = API_KEY;
    }
    
    if (authenticated) {
        if (token) {
            defaultHeaders['Authorization'] = `Bearer ${token}`;
        } else {
            throw new Error("Authentication required.");
        }
    }

    const config: RequestInit = {
        ...options,
        headers: {
            ...defaultHeaders,
            ...options.headers,
        },
    };

    const response = await fetch(`${API_BASE_URL}/api/v1${endpoint}`, config);
    const responseData = await response.json();

    if (!response.ok) {
        if (responseData.details && Array.isArray(responseData.details)) {
            const errorMessages = responseData.details.map((d: any) => d.msg).join(', ');
            throw new Error(errorMessages || responseData.message || `API request failed with status: ${response.status}`);
        }
        throw new Error(responseData.message || `API request failed with status: ${response.status}`);
    }
    
    if (responseData.success === false) {
        throw new Error(responseData.message);
    }
    
    return responseData;
}


export async function getEvents(): Promise<EventApiResponse> {
  try {
    const userCookie = cookies().get('loggedInUser')?.value;
    let endpoint = '/events';
    let isAuthenticated = false;

    if (userCookie) {
        const user: LoggedInUser = JSON.parse(userCookie);
        isAuthenticated = true; // JWT should be present if user cookie is
        if (user.role === 'department_admin' && user.department) {
            endpoint = `/events?departmentId=${user.department}`;
        }
    }
    
    const response = await makeApiRequest(endpoint, {}, isAuthenticated);
    return response;
  } catch (error) {
    console.error("Failed to fetch events:", error);
    throw new Error("Could not fetch events.");
  }
}

export async function createEvent(formData: FormData) {
    const eventData = formDataToObject(formData);
    
    if (eventData.payment && eventData.payment.price) {
        eventData.payment.price = Number(eventData.payment.price);
    }
    
    const userCookie = cookies().get('loggedInUser')?.value;
    if (userCookie) {
        const user: LoggedInUser = JSON.parse(userCookie);
        if (user.role === 'department_admin' && user.department) {
             eventData.departmentId = user.department;
        }
    } else {
        throw new Error("User information not found.");
    }

    try {
        await makeApiRequest('/events', {
            method: 'POST',
            body: JSON.stringify(eventData),
        }, true); // Authenticated request
        revalidatePath('/u/s/portal/events');
    } catch (error) {
        console.error("Failed to create event:", error);
        throw error;
    }
}

export async function updateEvent(eventId: string, formData: FormData) {
  const eventData = formDataToObject(formData);

  try {
    await makeApiRequest(`/events/${eventId}`, {
      method: 'PATCH',
      body: JSON.stringify(eventData),
    }, true);
    revalidatePath('/u/s/portal/events');
    revalidatePath(`/u/s/portal/events/${eventId}`);
  } catch (error) {
    console.error("Failed to update event:", error);
    throw error;
  }
}

export async function deleteEvent(eventId: string) {
  try {
    await makeApiRequest(`/events/${eventId}`, {
      method: 'DELETE',
    }, true);
    revalidatePath('/u/s/portal/events');
  } catch (error) {
    console.error("Failed to delete event:", error);
    throw error;
  }
}
