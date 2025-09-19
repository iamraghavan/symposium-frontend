
'use server'

import { revalidatePath } from 'next/cache';
import { cookies } from 'next/headers';
import { formDataToObject } from '@/lib/utils';
import type { Department, ApiErrorResponse } from '@/lib/types';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;
const API_KEY = process.env.NEXT_PUBLIC_API_KEY;

async function makeApiRequest(endpoint: string, options: RequestInit = {}, authenticated: boolean = false) {
    const defaultHeaders: Record<string, string> = {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
    };
    if (API_KEY) {
        defaultHeaders['x-api-key'] = API_KEY;
    }
    
    if (authenticated) {
        const token = cookies().get('jwt')?.value;
        if (token) {
            defaultHeaders['Authorization'] = `Bearer ${token}`;
        } else {
            throw new Error("Authentication required.");
        }
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
        throw new Error((responseData as ApiErrorResponse).message);
    }
    
    return responseData;
}


export async function getDepartments(): Promise<Department[]> {
  const response = await makeApiRequest('/departments');
  return response.data.departments;
}

export async function createDepartment(formData: FormData) {
  const departmentData = {
    id: formData.get("id") as string,
    name: formData.get("name") as string,
    head: {
        name: formData.get("headName") as string,
        email: formData.get("headEmail") as string,
    }
  }

  if (!departmentData.id || !departmentData.name || !departmentData.head.name || !departmentData.head.email) {
      throw new Error("Missing required fields.");
  }

  await makeApiRequest('/departments', {
    method: 'POST',
    body: JSON.stringify(departmentData),
  }, true);

  revalidatePath('/u/s/portal/departments');
}

export async function updateDepartment(departmentId: string, formData: FormData) {
  const updatedData = {
    name: formData.get("name") as string,
    head: {
        name: formData.get("headName") as string,
        email: formData.get("headEmail") as string,
    }
  }

  await makeApiRequest(`/departments/${departmentId}`, {
      method: 'PUT',
      body: JSON.stringify(updatedData)
  }, true);
  
  revalidatePath('/u/s/portal/departments');
}

export async function deleteDepartment(departmentId: string) {
    await makeApiRequest(`/departments/${departmentId}`, { method: 'DELETE' }, true);
    revalidatePath('/u/s/portal/departments');
}
