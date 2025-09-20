
'use server'

import { revalidatePath } from 'next/cache';
import { cookies } from 'next/headers';
import type { Department, ApiSuccessResponse, ApiErrorResponse } from '@/lib/types';

const API_BASE_URL = process.env.API_BASE_URL;
const API_KEY = process.env.API_KEY;

async function makeApiRequest(endpoint: string, options: RequestInit = {}) {
    const userApiKey = cookies().get('apiKey')?.value;
    const key = userApiKey || API_KEY;
    
    const defaultHeaders: Record<string, string> = {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
    };
     if (key) {
        defaultHeaders['x-api-key'] = key;
    } else {
        throw new Error("API key is missing.");
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
  const response: ApiSuccessResponse<{departments: Department[]}> = await makeApiRequest('/departments?limit=100');
  return response.data?.departments || [];
}

export async function createDepartment(formData: FormData) {
  const departmentData = {
    shortcode: formData.get("id") as string,
    name: formData.get("name") as string,
    code: `EGSPEC/${formData.get("id") as string}`
  }

  if (!departmentData.shortcode || !departmentData.name) {
      throw new Error("Missing required fields: ID and Name are required.");
  }

  await makeApiRequest('/departments', {
    method: 'POST',
    body: JSON.stringify(departmentData),
  });

  revalidatePath('/u/s/portal/departments');
}

export async function updateDepartment(departmentId: string, formData: FormData) {
  const updatedData = {
    name: formData.get("name") as string,
  }

  await makeApiRequest(`/departments/${departmentId}`, {
      method: 'PATCH',
      body: JSON.stringify(updatedData)
  });
  
  revalidatePath('/u/s/portal/departments');
}

export async function deleteDepartment(departmentId: string) {
    await makeApiRequest(`/departments/${departmentId}`, { method: 'DELETE' });
    revalidatePath('/u/s/portal/departments');
}
