
'use server'

import { revalidatePath } from 'next/cache';
import type { Event, LoggedInUser, Department } from '@/lib/types';
import { cookies } from 'next/headers';
import { formDataToObject } from '@/lib/utils';
import { getDepartments } from '../departments/actions';

const API_BASE_URL = 'https://symposium-backend.onrender.com';
const API_KEY = process.env.API_KEY;

async function makeApiRequest(endpoint: string, options: RequestInit = {}) {
    const defaultHeaders: Record<string, string> = {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
    };

    if (API_KEY) {
        defaultHeaders['x-api-key'] = API_KEY;
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
             throw new Error(responseData.message || `API request failed with status: ${response.status}`);
        }
        
        return responseData;
    } catch (error) {
        console.error('API Request Error in action:', error);
        throw error;
    }
}


export async function getEvents(): Promise<{ success: boolean; data: Event[] }> {
  try {
    const response = await makeApiRequest('/events/admin');
    
    // The API now returns the full department object, so no extra mapping is needed.
    // The data is ready to be used directly.
    return { success: true, data: response.data };

  } catch (error) {
    console.error("Failed to fetch events in getEvents():", error);
    // Rethrow to be caught by the component
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
        throw new Error("User information not found.");
    }

    try {
        await makeApiRequest('/events', {
            method: 'POST',
            body: JSON.stringify(eventData),
        });
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
