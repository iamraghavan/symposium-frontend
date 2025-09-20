
'use server'

import { revalidatePath } from 'next/cache';
import type { Event, ApiSuccessResponse, LoggedInUser, Department } from '@/lib/types';
import { formDataToObject } from '@/lib/utils';
import { cookies } from 'next/headers';

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
             console.error("API Error Details:", responseData.details);
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


export async function getDepartments(apiKey: string): Promise<Department[]> {
  if (!apiKey) {
    console.error("[getDepartments] API key is missing.");
    return [];
  }
  try {
    const response = await makeApiRequest('/departments?limit=100', apiKey);
    return (response as ApiSuccessResponse<{departments: Department[]}>).data?.departments || [];
  } catch (error) {
    console.error("[getDepartments] Failed to fetch departments:", error);
    return [];
  }
}

export async function createEvent(apiKey: string, prevState: any, formData: FormData) {
  const createdBy = formData.get('createdBy') as string;
  if (!createdBy) {
    return { message: 'Authentication error. User ID not provided.', success: false };
  }
   if (!apiKey) {
    return { message: 'Authentication error: API Key is missing.', success: false };
  }

  const payload: Record<string, any> = {
    name: formData.get('name'),
    description: formData.get('description'),
    thumbnailUrl: formData.get('thumbnailUrl'),
    mode: formData.get('mode'),
    startAt: formData.get('startAt'),
    endAt: formData.get('endAt'),
    department: formData.get('department'),
    createdBy: createdBy,
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
    const apiKey = cookies().get('apiKey')?.value;
     if (!apiKey) {
      return { message: 'Authentication error: API Key is missing.', success: false };
    }
    const eventId = formData.get('eventId');
     if (!eventId) {
        return { message: 'Event ID is missing.', success: false };
    }

    const payload: Record<string, any> = {
        name: formData.get('name'),
        description: formData.get('description'),
        thumbnailUrl: formData.get('thumbnailUrl'),
        mode: formData.get('mode'),
        startAt: formData.get('startAt'),
        endAt: formData.get('endAt'),
        status: formData.get('status'),
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
        await makeApiRequest(`/events/${eventId}`, apiKey, {
            method: 'PATCH',
            body: JSON.stringify(payload),
        });

        revalidatePath('/u/s/portal/events');
        return { message: 'Event updated successfully.', success: true };
    } catch (error) {
        return { message: (error as Error).message, success: false };
    }
}

export async function deleteEvent(eventId: string): Promise<{ success: boolean; message: string }> {
    const apiKey = cookies().get('apiKey')?.value;
     if (!apiKey) {
      return { success: false, message: 'Authentication error: API Key is missing.' };
    }
    if (!eventId) {
        return { success: false, message: 'Event ID is missing.' };
    }

    try {
        await makeApiRequest(`/events/${eventId}`, apiKey, { method: 'DELETE' });
        revalidatePath('/u/s/portal/events');
        return { success: true, message: 'Event deleted successfully.' };
    } catch (error) {
        return { success: false, message: (error as Error).message };
    }
}
