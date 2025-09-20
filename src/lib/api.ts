
'use client';

import type { ApiErrorResponse } from './types';

const API_BASE_URL = 'https://symposium-backend.onrender.com';
const GLOBAL_API_KEY = 'rjfqrur9L0v2XNzx574DI1Djejii70JP5S';

type ApiOptions = {
  method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  body?: Record<string, any>;
  authenticated?: boolean;
  headers?: Record<string, string>;
};

async function api<T>(endpoint: string, options: ApiOptions = {}): Promise<T> {
  const { method = 'GET', body, authenticated = false, headers = {} } = options;

  let apiKey = GLOBAL_API_KEY;
  if (authenticated) {
    let userApiKey: string | null = null;
    if (typeof window !== 'undefined') {
      userApiKey = localStorage.getItem('userApiKey');
    }
    if (!userApiKey) {
        // Fallback to global key is probably not what we want for authenticated routes.
        // It's better to fail fast.
        const errorMsg = 'API key is missing for an authenticated request.';
        console.error(errorMsg);
        throw new Error(JSON.stringify({ message: errorMsg }));
    }
    apiKey = userApiKey;
  }

  const defaultHeaders: Record<string, string> = {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
    'x-api-key': apiKey,
  };

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
