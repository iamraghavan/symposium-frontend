
'use server'

import { revalidatePath } from 'next/cache';
import { cookies } from 'next/headers';
import type { Event, ApiSuccessResponse, LoggedInUser, Department } from '@/lib/types';
import { formDataToObject } from '@/lib/utils';

// Hardcode the API_BASE_URL to ensure it's available in the server action.
const API_BASE_URL = 'https://symposium-backend.onrender.com';

async function makeApiRequest(endpoint: string, options: RequestInit = {}) {
    const userApiKey = cookies().get('apiKey')?.value;
    
    if (!userApiKey) {
        // This part is for server actions that need authentication.
        // It relies on the cookie being correctly passed.
        throw new Error("API key cookie not found. Please log in again.");
    }

    const defaultHeaders: Record<string, string> = {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'x-api-key': userApiKey,
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


export async function getDepartments(): Promise<Department[]> {
  try {
    const response: ApiSuccessResponse<{ data: Department[] }> = await makeApiRequest('/departments?limit=100');
    return response.data || [];
  } catch (error) {
    console.error("[getDepartments] Failed to fetch departments:", error);
    throw new Error("Could not fetch departments.");
  }
}

export async function createEvent(prevState: any, formData: FormData) {
    const eventData = formDataToObject(formData);
    
    const userCookie = cookies().get('loggedInUser');
    if (!userCookie) return { message: 'Authentication error: User not logged in.', success: false };
    
    let user: LoggedInUser;
    try {
      user = JSON.parse(userCookie.value);
    } catch (e) {
      return { message: 'Authentication error: Invalid user data.', success: false };
    }

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
        await makeApiRequest('/events', {
            method: 'POST',
            body: JSON.stringify(payload),
        });

        revalidatePath('/u/s/portal/events');
        return { message: 'Event created successfully.', success: true };
    } catch (error) {
        return { message: (error as Error).message, success: false };
    }
}

export async function updateEvent(prevState: any, formData: FormData) {
    const eventData = formDataToObject(formData);
    const eventId = eventData.eventId;

    if (!eventId) {
        return { message: 'Event ID is missing.', success: false };
    }
    
    const payload: Record<string, any> = {
      name: eventData.name,
      description: eventData.description,
      thumbnailUrl: eventData.thumbnailUrl,
      mode: eventData.mode,
      startAt: eventData.startAt,
      endAt: eventData.endAt,
      status: eventData.status,
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
        await makeApiRequest(`/events/${eventId}`, {
            method: 'PATCH',
            body: JSON.stringify(payload),
        });

        revalidatePath('/u/s/portal/events');
        revalidatePath(`/u/s/portal/events/${eventId}`);
        return { message: 'Event updated successfully.', success: true };
    } catch (error) {
        return { message: (error as Error).message, success: false };
    }
}

export async function deleteEvent(eventId: string): Promise<{ success: boolean; message: string }> {
    if (!eventId) {
        return { success: false, message: 'Event ID is missing.' };
    }

    try {
        await makeApiRequest(`/events/${eventId}`, {
            method: 'DELETE',
        });

        revalidatePath('/u/s/portal/events');
        return { success: true, message: 'Event deleted successfully.' };
    } catch (error) {
        return { success: false, message: (error as Error).message };
    }
}
