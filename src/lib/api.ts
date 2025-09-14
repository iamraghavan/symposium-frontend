
'use client';

import type { ApiErrorResponse } from './types';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;
const API_KEY = process.env.NEXT_PUBLIC_API_KEY;

type ApiOptions = {
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE';
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
      console.warn('Authenticated request made without a token.');
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
    // Forward the structured error from the backend
    throw new Error(JSON.stringify(responseData));
  }
  
  // Also handle cases where backend returns success:false in a 200 OK response
  if (responseData.success === false) {
      throw new Error(JSON.stringify(responseData));
  }

  return responseData as T;
}

export default api;
