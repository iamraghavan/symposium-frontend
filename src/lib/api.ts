
'use client';

import type { ApiErrorResponse, ApiSuccessResponse } from './types';

const API_BASE_URL = 'https://symposium-backend.onrender.com';

const publicRoutes = [
    '/analytics/statistics/overview',
    '/analytics/statistics/participants',
    '/analytics/statistics/events/registration-summary',
    '/analytics/statistics/departments', // Covers /:departmentId/totals as well
    '/analytics/users/analytics/first-week',
    '/finance/overview',
    '/finance/transactions',
    '/finance/revenue-by-department',
    '/departments',
    '/events',
    '/symposium-payments/symposium/status'
];

type ApiOptions = {
  method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  body?: Record<string, any>;
  authenticated?: boolean;
  headers?: Record<string, string>;
};

function isPublicRoute(endpoint: string): boolean {
    return publicRoutes.some(route => endpoint.startsWith(route));
}

async function api<T extends ApiSuccessResponse<any> | ApiErrorResponse>(endpoint: string, options: ApiOptions = {}): Promise<T> {
  const { method = 'GET', body, authenticated = false, headers = {} } = options;
  const finalEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
  
  const finalHeaders: Record<string, string> = {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      ...headers,
  };

  const isPublic = isPublicRoute(finalEndpoint);

  // If authenticated is explicitly true, or if it's not a public route, require API key.
  if (authenticated || !isPublic) {
    let apiKey: string | null = null;
    if (typeof window !== 'undefined') {
      apiKey = localStorage.getItem('userApiKey');
    }
    
    if (!apiKey) {
      const errorMsg = "API key is missing for a private route.";
      console.error(errorMsg, `Endpoint: ${finalEndpoint}`);
      throw new Error(JSON.stringify({ message: errorMsg, success: false, code: "API_KEY_MISSING" }));
    }
    finalHeaders['x-api-key'] = apiKey;
  }
  
  const config: RequestInit = {
    method,
    headers: finalHeaders,
  };

  if (body) {
    config.body = JSON.stringify(body);
  }

  try {
    const response = await fetch(`${API_BASE_URL}/api/v1${finalEndpoint}`, config);

    const contentType = response.headers.get("content-type");
    if (!contentType || !contentType.includes("application/json")) {
        const responseText = await response.text();
        if (response.status === 402) {
             try {
                const errorJson = JSON.parse(responseText);
                throw new Error(JSON.stringify(errorJson));
             } catch(e) {
                throw new TypeError(`Server returned 402 with non-JSON response: ${responseText}`);
             }
        }
        throw new TypeError(`Server returned non-JSON response: ${response.status} ${response.statusText} \nResponse: ${responseText}`);
    }

    const responseData = await response.json();
    
    if (!response.ok) {
      throw new Error(JSON.stringify(responseData));
    }
    
    if (responseData.success === false) {
      throw new Error(JSON.stringify(responseData));
    }
    
    return responseData as T;

  } catch (error) {
    console.error(`API call to '${finalEndpoint}' failed:`, error);
    if (error instanceof Error) {
        throw error;
    }
    throw new Error(JSON.stringify({ message: 'An unknown network error occurred.', success: false }));
  }
}

export default api;
