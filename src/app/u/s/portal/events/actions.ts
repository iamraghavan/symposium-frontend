
'use server'

import { revalidatePath } from 'next/cache';
import type { Event, ApiSuccessResponse, LoggedInUser, Department } from '@/lib/types';
import { formDataToObject } from '@/lib/utils';

const API_BASE_URL = 'https://symposium-backend.onrender.com';

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
    return [];
  } catch (error) {
    console.error("[getDepartments] Failed to fetch departments:", error);
    throw new Error("Could not fetch departments.");
  }
}

export async function createEvent(userId: string, apiKey: string, prevState: any, formData: FormData) {
  if (!userId || !apiKey) {
    return { message: 'Authentication error. User or API Key not provided.', success: false };
  }

  const payload: Record<string, any> = {
    name: formData.get('name'),
    description: formData.get('description'),
    thumbnailUrl: formData.get('thumbnailUrl'),
    mode: formData.get('mode'),
    startAt: formData.get('startAt'),
    endAt: formData.get('endAt'),
    departmentId: formData.get('departmentId'), // Super admin will provide this
    status: formData.get('status'),
    payment: {
      method: formData.get('payment.method') || 'free',
      price: Number(formData.get('payment.price') || 0),
      currency: formData.get('payment.currency') || 'INR'
    },
    contacts: [{
      name: formData.get('contacts[0].name'),
      email: formData.get('contacts[0].email'),
      phone: formData.get('contacts[0].phone'),
    }]
  };

  if (payload.mode === 'online') {
      payload.online = {
          provider: formData.get('online.provider'),
          url: formData.get('online.url')
      };
  } else if (payload.mode === 'offline') {
      payload.offline = {
          venueName: formData.get('offline.venueName'),
          address: formData.get('offline.address')
      };
  }
    
    try {
        await makeApiRequest('/events', apiKey, {
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
    
    // This action needs to be fully implemented with API key handling like createEvent
    // For now, it's a placeholder to avoid breaking the form.
    console.log("Updating event (not implemented)", eventData);

    return { message: 'Update not fully implemented.', success: false };
}

export async function deleteEvent(eventId: string): Promise<{ success: boolean; message: string }> {
    if (!eventId) {
        return { success: false, message: 'Event ID is missing.' };
    }

    // This action also needs API key handling.
    console.log("Deleting event (not implemented)", eventId);

    return { success: false, message: 'Delete not fully implemented.' };
}
