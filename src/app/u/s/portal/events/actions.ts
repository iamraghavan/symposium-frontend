
'use server'

import { revalidatePath } from 'next/cache';
import api from '@/lib/api';
import type { Event } from '@/lib/types';
import { cookies } from 'next/headers';

type EventApiResponse = {
    data: Event[];
    meta: {
        total: number;
        page: number;
        limit: number;
        hasMore: boolean;
    }
}

export async function getEvents(): Promise<EventApiResponse> {
  try {
    const token = cookies().get('jwt')?.value;
    const response = await api<EventApiResponse>('/events', { 
        authenticated: !!token,
        headers: token ? { 'Authorization': `Bearer ${token}` } : {}
    });
    return response;
  } catch (error) {
    console.error("Failed to fetch events:", error);
    throw new Error("Could not fetch events.");
  }
}

function formDataToObject(formData: FormData): Record<string, any> {
  const obj: Record<string, any> = {};

  formData.forEach((value, key) => {
    // Handle nested objects like 'offline.venueName'
    const keys = key.split(/\[(\d+)\]\.|\./).filter(Boolean);

    keys.reduce((acc, currentKey, index) => {
      const isLast = index === keys.length - 1;
      const isNumeric = /^\d+$/.test(currentKey);
      
      if (isLast) {
          acc[currentKey] = value;
      } else {
        const nextKey = keys[index + 1];
        const isNextNumeric = /^\d+$/.test(nextKey);
        if (!acc[currentKey]) {
            acc[currentKey] = isNextNumeric ? [] : {};
        }
      }
      return acc[currentKey];
    }, obj);
  });

  return obj;
}


export async function createEvent(formData: FormData) {
    const token = cookies().get('jwt')?.value;
    if (!token) throw new Error("Authentication required.");

    const eventData = formDataToObject(formData);
    
    // Ensure price is a number
    if (eventData.payment && eventData.payment.price) {
        eventData.payment.price = Number(eventData.payment.price);
    }
    
    // Add departmentId for department admins
    const user = JSON.parse(cookies().get('loggedInUser')?.value || '{}');
    if (user.role === 'department_admin' && user.departmentId) {
        eventData.departmentId = user.departmentId;
    }

    try {
        await api('/events', {
            method: 'POST',
            body: eventData,
            authenticated: true,
            headers: { 'Authorization': `Bearer ${token}` }
        });
        revalidatePath('/u/s/portal/events');
    } catch (error) {
        console.error("Failed to create event:", error);
        throw error;
    }
}

export async function updateEvent(eventId: string, formData: FormData) {
  const token = cookies().get('jwt')?.value;
  if (!token) throw new Error("Authentication required.");

  const eventData = formDataToObject(formData);

  try {
    await api(`/events/${eventId}`, {
      method: 'PATCH',
      body: eventData,
      authenticated: true,
       headers: { 'Authorization': `Bearer ${token}` }
    });
    revalidatePath('/u/s/portal/events');
    revalidatePath(`/u/s/portal/events/${eventId}`);
  } catch (error) {
    console.error("Failed to update event:", error);
    throw error;
  }
}

export async function deleteEvent(eventId: string) {
  const token = cookies().get('jwt')?.value;
  if (!token) throw new Error("Authentication required.");

  try {
    await api(`/events/${eventId}`, {
      method: 'DELETE',
      authenticated: true,
       headers: { 'Authorization': `Bearer ${token}` }
    });
    revalidatePath('/u/s/portal/events');
  } catch (error) {
    console.error("Failed to delete event:", error);
    throw error;
  }
}

    