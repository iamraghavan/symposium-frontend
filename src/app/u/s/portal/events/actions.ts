
'use server'

import { revalidatePath } from 'next/cache';
import type { Event, LoggedInUser, Department } from '@/lib/types';
import { cookies } from 'next/headers';
import { formDataToObject } from '@/lib/utils';
import { getDepartments } from '../departments/actions';

const API_BASE_URL = 'https://symposium-backend.onrender.com';
const API_KEY = process.env.API_KEY;

async function makeApiRequest(endpoint: string, options: RequestInit = {}) {
    console.log('--- Initiating API Request ---');
    console.log(`Endpoint: ${endpoint}`);
    
    const defaultHeaders: Record<string, string> = {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
    };

    console.log(`Retrieved API_KEY from process.env: ${API_KEY ? 'found' : 'NOT FOUND'}`);
    if (API_KEY) {
        defaultHeaders['x-api-key'] = API_KEY;
    } else {
        console.error('CRITICAL: API_KEY is not defined in the server environment.');
    }
    
    const token = cookies().get('jwt')?.value;
    console.log(`Retrieved JWT from cookies: ${token ? 'found' : 'NOT FOUND'}`);
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

    console.log('Final Request Headers:', JSON.stringify(config.headers, null, 2));

    try {
        const response = await fetch(`${API_BASE_URL}/api/v1${endpoint}`, config);
        const responseText = await response.text();
        console.log(`API Response Status: ${response.status}`);
        console.log('Raw API Response Body:', responseText);

        const responseData = JSON.parse(responseText);

        if (!response.ok) {
            console.error('API request failed with status:', response.status);
            throw new Error(responseData.message || `API request failed with status: ${response.status}`);
        }

        if (responseData.success === false) {
            console.error('API returned success: false');
            throw new Error(responseData.message);
        }
        
        console.log('--- API Request Successful ---');
        return responseData;
    } catch (error) {
        console.error('--- API Request Exception ---');
        console.error('Error during fetch:', error);
        throw error; // Re-throw the error after logging
    }
}


export async function getEvents(): Promise<{ success: boolean; data: Event[] }> {
  try {
    const userCookie = cookies().get('loggedInUser')?.value;
    if (!userCookie) {
      throw new Error("User not logged in");
    }
    const user: LoggedInUser = JSON.parse(userCookie);
    
    const response = await makeApiRequest('/events/admin');
    let events = response.data;

    if (user.role === 'super_admin') {
      const allDepartments = await getDepartments();
      const deptMap = new Map(allDepartments.map(d => [d._id, d.name]));
      events = events.map((event: Event) => ({
        ...event,
        department: {
          ...event.department,
          name: deptMap.get(typeof event.department === 'string' ? event.department : event.department._id) || 'Unknown',
        }
      }));
    } else if (user.role === 'department_admin' && user.department) {
       const deptName = typeof user.department === 'object' ? user.department.name : 'Department';
        events = events.map((event: Event) => ({
            ...event,
            department: {
                ...event.department,
                name: deptName,
            }
        }));
    }

    return { success: true, data: events };

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
