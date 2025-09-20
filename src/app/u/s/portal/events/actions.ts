
'use server'

import { revalidatePath } from 'next/cache';
import { cookies } from 'next/headers';
import type { Event, ApiSuccessResponse } from '@/lib/types';
import { formDataToObject } from '@/lib/utils';

const API_BASE_URL = process.env.API_BASE_URL;
const API_KEY = process.env.API_KEY;

async function makeApiRequest(endpoint: string, options: RequestInit = {}) {
    const userApiKey = cookies().get('apiKey')?.value;
    const key = userApiKey || API_KEY;

    const defaultHeaders: Record<string, string> = {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
    };
    
    if (key) {
        defaultHeaders['x-api-key'] = key;
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
             console.error("API Error Details:", JSON.stringify(responseData, null, 2));
             throw new Error(errorMessage);
        }
        
        return responseData;
    } catch (error) {
        console.error('Full API Request Error in action:', error);
        if (error instanceof Error) {
            throw error;
        }
        throw new Error('An unknown error occurred during the API request.');
    }
}

export async function getEvents(): Promise<Event[]> {
  try {
    const response: ApiSuccessResponse<{ events: Event[]}> = await makeApiRequest('/events/admin');
    return response.data || [];
  } catch (error) {
    console.error("Failed to fetch events in getEvents():", error);
    throw new Error("Could not fetch events.");
  }
}


export async function createEvent(prevState: any, formData: FormData) {
    const eventData = formDataToObject(formData);
    
    // Manual reconstruction for complex nested objects from flat form data
    const payload: Record<string, any> = {
      name: eventData.name,
      description: eventData.description,
      thumbnailUrl: eventData.thumbnailUrl,
      mode: eventData.mode,
      startAt: eventData.startAt,
      endAt: eventData.endAt,
      departmentId: eventData.departmentId,
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
        console.error("Failed to create event:", error);
        return { message: (error as Error).message, success: false };
    }
}


export async function updateEvent(eventId: string, formData: FormData) {
  const eventData = formDataToObject(formData);

  try {
    await makeApiRequest(`/events/${eventId}`, {
      method: 'PATCH',
      body: JSON.stringify(eventData),
    });
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
    });
    revalidatePath('/u/s/portal/events');
  } catch (error) {
    console.error("Failed to delete event:", error);
    throw error;
  }
}
