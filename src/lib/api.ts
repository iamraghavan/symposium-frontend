
'use client';

import type { ApiErrorResponse } from './types';

const API_BASE_URL = 'https://symposium-backend.onrender.com';
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
    let token: string | null = null;
    if (typeof window !== 'undefined') {
        token = localStorage.getItem('jwt');
    }

    if (token) {
      defaultHeaders['Authorization'] = `Bearer ${token}`;
    } else {
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
     const error = new Error(JSON.stringify(responseData));
     (error as any).details = responseData.details;
     throw error;
  }
  
  if (responseData.success === false) {
      const error = new Error(JSON.stringify(responseData));
      (error as any).details = responseData.details;
      throw error;
  }

  return responseData as T;
}

export default api;
