
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
  if (typeof window !== 'undefined') {
    // Prefer user-specific key if available and authenticated request is intended
    apiKey = localStorage.getItem('userApiKey');
  }

  // If no user-specific key, use the global public key for any request that needs it
  if (!apiKey) {
      apiKey = process.env.NEXT_PUBLIC_API_KEY || null;
  }
  
  if (!apiKey) {
      const errorMsg = "API key is missing. No user-specific or global key found.";
      console.error(errorMsg);
      throw new Error(JSON.stringify({ message: errorMsg, success: false, code: "API_KEY_MISSING" }));
  }


  const config: RequestInit = {
    method,
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      'x-api-key': apiKey,
      ...headers,
    },
  };

  if (body) {
    config.body = JSON.stringify(body);
  }
  
  const finalEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;

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
