
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
      // Optionally, you could throw an error here or redirect to login
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

  if (!response.ok) {
    let errorMessage = `API request failed with status: ${response.status}`;
    try {
      const errorData: ApiErrorResponse = await response.json();
      if (errorData.message) {
          errorMessage = errorData.message;
          if (errorData.details && Array.isArray(errorData.details) && errorData.details.length > 0) {
              const details = errorData.details.map(d => `${d.field}: ${d.msg}`).join(', ');
              if (details) {
                  errorMessage += `: ${details}`;
              }
          }
      } else {
        errorMessage = response.statusText || 'Not Found';
      }
    } catch (e) {
      // Fallback if response is not JSON or has no body
      if (response.statusText) {
          errorMessage = response.statusText;
      }
    }
    throw new Error(errorMessage);
  }

  if (response.status === 204) {
    return null as T;
  }

  return response.json() as T;
}

export default api;
