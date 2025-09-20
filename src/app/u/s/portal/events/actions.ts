
'use server'

import { revalidatePath } from 'next/cache';
import type { Event, ApiSuccessResponse, LoggedInUser, Department } from '@/lib/types';
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
             console.error("API Error Details:", responseData); // LOG THE ERROR RESPONSE
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


export async function getAdminEvents(apiKey: string, user: LoggedInUser): Promise<Event[]> {
  if (!apiKey) {
    throw new Error("API Key is missing.");
  }
  if (!user) {
    throw new Error("User not found.");
  }
  
  let endpoint = '/events/admin';
    if (user.role === 'department_admin' && user._id) {
      endpoint = `/events/admin/created-by/${user._id}`;
    }

  const response = await makeApiRequest(endpoint, apiKey);
  return (response as ApiSuccessResponse<{data: Event[]}>).data || [];
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
    return { message: 'Authentication error. User not logged in.', success: false };
  }
   if (!apiKey) {
    return { message: 'Authentication error: API Key is missing.', success: false };
  }
  
  try {
    const startAt = formData.get('startAt') ? new Date(formData.get('startAt') as string).toISOString() : new Date().toISOString();
    const endAt = formData.get('endAt') ? new Date(formData.get('endAt') as string).toISOString() : new Date().toISOString();

    const payload: Record<string, any> = {
      name: formData.get('name'),
      description: formData.get('description'),
      thumbnailUrl: formData.get('thumbnailUrl'),
      mode: formData.get('mode'),
      startAt: startAt,
      endAt: endAt,
      department: formData.get('department'),
      createdBy: createdBy,
      status: formData.get('status'),
      departmentSite: formData.get('departmentSite'),
      contactEmail: formData.get('contactEmail'),
      extra: {},
    };

    // Contacts
    const contactName = formData.get('contacts[0].name');
    const contactEmail = formData.get('contacts[0].email');
    const contactPhone = formData.get('contacts[0].phone');
    if(contactName || contactEmail || contactPhone) {
        payload.contacts = [{
            name: contactName || undefined,
            email: contactEmail || undefined,
            phone: contactPhone || undefined
        }];
    }

    // Payment
    const paymentMethod = formData.get('payment.method') as string;
    payload.payment = { method: paymentMethod };
     if (paymentMethod === 'gateway') {
        payload.payment.price = Number(formData.get('payment.price') || 0);
        payload.payment.currency = formData.get('payment.currency') || 'INR';
        payload.payment.gatewayProvider = formData.get('payment.gatewayProvider')
    } else if (paymentMethod === 'qr_code') { // Note: your schema has 'qr', not 'qr_code'
        payload.payment.method = 'qr';
        payload.payment.price = Number(formData.get('payment.price') || 0);
        payload.payment.currency = formData.get('payment.currency') || 'INR';
    }


    if (payload.mode === 'online') {
        payload.online = {
            provider: formData.get('online.provider'),
            url: formData.get('online.url')
        };
    } else if (payload.mode === 'offline') {
        payload.offline = {
            venueName: formData.get('offline.venueName'),
            address: formData.get('offline.address'),
            mapLink: formData.get('offline.mapLink')
        };
    }
      
      console.log('Payload being sent to API:', JSON.stringify(payload, null, 2)); // LOG THE PAYLOAD
      
      await makeApiRequest('/events', apiKey, {
          method: 'POST',
          body: JSON.stringify(payload),
      });

      revalidatePath('/u/s/portal/events');
      return { message: 'Event created successfully.', success: true };
  } catch (error) {
      console.error('Error in createEvent action:', error); // LOG THE ERROR
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
