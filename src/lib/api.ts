
'use client';

import type { ApiErrorResponse, ApiSuccessResponse } from './types';

const API_BASE_URL = 'https://symposium-backend.onrender.com';

type ApiOptions = {
  method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  body?: Record<string, any>;
  authenticated?: boolean;
  headers?: Record<string, string>;
};

async function api<T extends ApiSuccessResponse<any> | ApiErrorResponse>(endpoint: string, options: ApiOptions = {}): Promise<T> {
  const { method = 'GET', body, authenticated = false, headers = {} } = options;

  let apiKey: string | null = null;
  if (authenticated) {
    if (typeof window !== 'undefined') {
      apiKey = localStorage.getItem('userApiKey');
    }
    if (!apiKey) {
        const errorMsg = 'API key is missing for an authenticated request.';
        console.error(errorMsg);
        // This makes sure the error is a JSON string so it can be parsed by the caller
        throw new Error(JSON.stringify({ message: errorMsg, success: false }));
    }
  }

  const config: RequestInit = {
    method,
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      ...headers,
    },
  };
  
  if (apiKey) {
      (config.headers as Record<string, string>)['x-api-key'] = apiKey;
  }

  if (body) {
    config.body = JSON.stringify(body);
  }
  
  const finalEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;

  try {
    const response = await fetch(`${API_BASE_URL}/api/v1${finalEndpoint}`, config);

    const contentType = response.headers.get("content-type");
    if (!contentType || !contentType.includes("application/json")) {
        const responseText = await response.text();
        // This handles the specific 402 error from the backend which needs to be parsed
        if (response.status === 402) {
             try {
                const errorJson = JSON.parse(responseText);
                throw new Error(JSON.stringify(errorJson));
             } catch(e) {
                 // Fallback if the 402 body is not JSON for some reason
                throw new TypeError(`Server returned 402 with non-JSON response: ${responseText}`);
             }
        }
        throw new TypeError(`Server returned non-JSON response: ${response.status} ${response.statusText} \nResponse: ${responseText}`);
    }

    const responseData = await response.json();
    
    // Treat non-ok responses as errors, but pass the body for parsing
    if (!response.ok) {
      throw new Error(JSON.stringify(responseData));
    }
    
    // If the response is ok, but the backend explicitly says success: false
    if (responseData.success === false) {
      throw new Error(JSON.stringify(responseData));
    }
    
    return responseData as T;

  } catch (error) {
    console.error(`API call to '${finalEndpoint}' failed:`, error);
    if (error instanceof Error) {
        // Re-throw the original error which might be our stringified JSON
        throw error;
    }
    // Fallback for unknown network errors
    throw new Error(JSON.stringify({ message: 'An unknown network error occurred.', success: false }));
  }
}

export default api;
