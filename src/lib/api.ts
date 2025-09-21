
'use client';

import type { ApiErrorResponse, ApiSuccessResponse } from './types';

const API_BASE_URL = 'https://symposium-backend.onrender.com';
const GLOBAL_API_KEY = 'rjfqrur9L0v2XNzx574DI1Djejii70JP5S';

type ApiOptions = {
  method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  body?: Record<string, any>;
  authenticated?: boolean;
  headers?: Record<string, string>;
};

async function api<T extends ApiSuccessResponse<any> | ApiErrorResponse>(endpoint: string, options: ApiOptions = {}): Promise<T> {
  const { method = 'GET', body, authenticated = false, headers = {} } = options;

  let apiKey = GLOBAL_API_KEY;
  if (authenticated) {
    let userApiKey: string | null = null;
    if (typeof window !== 'undefined') {
      userApiKey = localStorage.getItem('userApiKey');
    }
    if (!userApiKey) {
        const errorMsg = 'API key is missing for an authenticated request.';
        console.error(errorMsg);
        throw new Error(errorMsg);
    }
    apiKey = userApiKey;
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

  try {
    const response = await fetch(`${API_BASE_URL}/api/v1${endpoint}`, config);

    const contentType = response.headers.get("content-type");
    if (!contentType || !contentType.includes("application/json")) {
        const responseText = await response.text();
        throw new TypeError(`Server returned non-JSON response: ${response.status} ${response.statusText} \nResponse: ${responseText}`);
    }

    const responseData = await response.json();

    if (!response.ok) {
      const apiErrorResponse = responseData as ApiErrorResponse;
      const errorMessage = apiErrorResponse.message || 'An unknown API error occurred.';
      if (apiErrorResponse.isNewUser && apiErrorResponse.profile) {
          throw new Error(JSON.stringify(apiErrorResponse));
      }
      throw new Error(errorMessage);
    }
    
    // For successful responses (200, 201, etc.), we ensure a 'success' flag is present.
    // This makes frontend handling consistent.
    if (responseData.success === undefined) {
      responseData.success = true;
    }
    return responseData as T;

  } catch (error) {
    console.error(`API call to '${endpoint}' failed:`, error);
    if (error instanceof Error) {
        throw error;
    }
    throw new Error('An unknown network error occurred.');
  }
}

export default api;
