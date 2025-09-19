
'use client';

import type { ApiErrorResponse } from './types';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;
const API_KEY = process.env.NEXT_PUBLIC_API_KEY;

type ApiOptions = {
  method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  body?: Record<string, any>;
  authenticated?: boolean;
  headers?: Record<string, string>;
};

async function api<T>(endpoint: string, options: ApiOptions = {}): Promise<T> {
  const { method = 'GET', body, authenticated = false, headers = {} } = options;

  const defaultHeaders: Record<string, string> = {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  };
  
  if (API_KEY) {
      defaultHeaders['x-api-key'] = API_KEY;
  }

  if (authenticated) {
    const token = localStorage.getItem('jwt');
    if (token) {
      defaultHeaders['Authorization'] = `Bearer ${token}`;
    } else {
      // Don't throw an error, let the server decide if the endpoint is protected
      console.warn('Authenticated request intended but no token found.');
    }
  }

  const config: RequestInit = {
    method,
    headers: { ...defaultHeaders, ...headers },
  };

  if (body) {
    config.body = JSON.stringify(body);
  }

  const response = await fetch(`${API_BASE_URL}/api/v1${endpoint}`, config);

  const responseData = await response.json();

  if (!response.ok) {
     const errorMsg = responseData.message || `API request failed with status: ${response.status}`;
     const error = new Error(errorMsg);
     (error as any).details = responseData.details;
     throw error;
  }
  
  if (responseData.success === false) {
      const errorMsg = responseData.message || `API returned success: false`;
      const error = new Error(errorMsg);
      (error as any).details = responseData.details;
      throw error;
  }

  return responseData as T;
}

export default api;

    