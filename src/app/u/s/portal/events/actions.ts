
'use server'

import { revalidatePath } from 'next/cache';
import type { Event, LoggedInUser, Department, ApiSuccessResponse } from '@/lib/types';
import { cookies } from 'next/headers';
import { formDataToObject } from '@/lib/utils';
import { getDepartments as getAllDepartments } from '../departments/actions';

const API_BASE_URL = 'https://symposium-backend.onrender.com';
const API_KEY = process.env.NEXT_PUBLIC_API_KEY;

async function makeApiRequest(endpoint: string, options: RequestInit = {}) {
    const token = cookies().get('jwt')?.value;
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


export async function getEvents(): Promise<ApiSuccessResponse<{ events: Event[] }>> {
  try {
    const userCookie = cookies().get('loggedInUser')?.value;
    const user: LoggedInUser | null = userCookie ? JSON.parse(userCookie) : null;
    
    if (!user) {
        throw new Error("Authentication required.");
    }
    
    const eventResponse = await makeApiRequest('/events') as ApiSuccessResponse<{ events: Event[] }>;

    if (user.role === 'super_admin') {
      const departmentsResponse = await getAllDepartments();
      const departmentMap = new Map(departmentsResponse.data.map(d => [d._id, d]));
      
      const eventsWithDepartments = (eventResponse.data || []).map(event => ({
        ...event,
        department: departmentMap.get(event.department as string) || event.department
      }));
      return { ...eventResponse, data: eventsWithDepartments };

    } else if (user.role === 'department_admin' && user.department) {
       const eventsWithDepartment = (eventResponse.data || []).map(event => ({
        ...event,
        department: user.department as Department
      }));
       return { ...eventResponse, data: eventsWithDepartment };
    }

    return eventResponse;

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
