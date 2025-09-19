
'use server'

import { revalidatePath } from 'next/cache';
import type { Event, ApiSuccessResponse, ApiErrorResponse } from '@/lib/types';
import { cookies } from 'next/headers';
import { formDataToObject } from '@/lib/utils';

const API_BASE_URL = 'https://symposium-backend.onrender.com';

async function makeApiRequest(endpoint: string, options: RequestInit = {}) {
    const API_KEY = process.env.API_KEY;
    const token = cookies().get('jwt')?.value;

    console.log("--- [makeApiRequest Diagnostics] ---");
    console.log("Endpoint:", endpoint);
    console.log("API_KEY from process.env:", API_KEY ? `Found (length: ${API_KEY.length})` : "NOT FOUND");
    console.log("JWT Token from cookies:", token ? `Found (length: ${token.length})` : "NOT FOUND");

    const defaultHeaders: Record<string, string> = {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
    };
    
    if (API_KEY) {
        defaultHeaders['x-api-key'] = API_KEY;
    }
    
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

    console.log("Final Request Headers:", JSON.stringify(config.headers, null, 2));

    try {
        const response = await fetch(`${API_BASE_URL}/api/v1${endpoint}`, config);
        const responseData = await response.json();

        console.log("API Response Status:", response.status);
        console.log("API Response Data:", JSON.stringify(responseData, null, 2));
        console.log("--- [End Diagnostics] ---");


        if (!response.ok || responseData.success === false) {
             const errorMessage = responseData.message || `API request failed with status: ${response.status}`;
             throw new Error(errorMessage);
        }
        
        return responseData;
    } catch (error) {
        console.error('Full API Request Error in action:', error);
        console.log("--- [End Diagnostics with Error] ---");
        if (error instanceof Error) {
            throw error;
        }
        throw new Error('An unknown error occurred during the API request.');
    }
}

export async function getEvents(): Promise<Event[]> {
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
    
    // Convert price to number if it exists
    if (eventData.payment && eventData.payment.price) {
        eventData.payment.price = Number(eventData.payment.price);
    }
    
    // Department ID might be nested if coming from a super_admin form
    if (eventData.departmentId) {
        eventData.department = eventData.departmentId;
    }

    try {
        await makeApiRequest('/events', {
            method: 'POST',
            body: JSON.stringify(eventData),
        });
        revalidatePath('/u/s/portal/events');
        return { error: null, success: true };
    } catch (error) {
        console.error("Failed to create event:", error);
        return { error: (error as Error).message, success: false };
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
