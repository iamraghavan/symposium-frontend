
'use server'

import { revalidatePath } from 'next/cache';
import type { Event, LoggedInUser, Department, ApiSuccessResponse, ApiErrorResponse } from '@/lib/types';
import { cookies } from 'next/headers';
import { formDataToObject } from '@/lib/utils';

const API_BASE_URL = 'https://symposium-backend.onrender.com';

async function makeApiRequest(endpoint: string, options: RequestInit = {}) {
    const defaultHeaders: Record<string, string> = {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
    };

    const apiKey = process.env.API_KEY;
    if (apiKey) {
        defaultHeaders['x-api-key'] = apiKey;
    }
    
    const token = cookies().get('jwt')?.value;
    if (token) {
        defaultHeaders['Authorization'] = `Bearer ${token}`;
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
             console.error('API Request Error in action:', errorMessage, responseData.details);
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


export async function getEvents(): Promise<Event[] | null> {
  try {
    const response: ApiSuccessResponse<{events: Event[]}> = await makeApiRequest('/events/admin');
    return response.data || [];
  } catch (error) {
    console.error("Failed to fetch events in getEvents():", error);
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
             eventData.departmentId = typeof user.department === 'object' ? user.department._id : user.department;
        }
    } else {
        return { error: "User information not found." };
    }

    try {
        await makeApiRequest('/events', {
            method: 'POST',
            body: JSON.stringify(eventData),
        });
        revalidatePath('/u/s/portal/events');
        return { error: null };
    } catch (error) {
        console.error("Failed to create event:", error);
        return { error: (error as Error).message };
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
