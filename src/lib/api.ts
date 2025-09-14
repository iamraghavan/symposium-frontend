
'use client';

import type { LoggedInUser } from './types';

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
    'x-api-key': API_KEY || '',
  };

  if (authenticated) {
    const token = localStorage.getItem('jwt');
    if (token) {
      defaultHeaders['Authorization'] = `Bearer ${token}`;
    } else {
      // Handle case where token is required but not available
      // Maybe redirect to login
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

  const response = await fetch(`${API_BASE_URL}/v1${endpoint}`, config);

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ message: 'An unknown error occurred.' }));
    throw new Error(errorData.message || 'API request failed');
  }

  // For 204 No Content responses
  if (response.status === 204) {
    return null as T;
  }

  return response.json() as T;
}

export default api;
