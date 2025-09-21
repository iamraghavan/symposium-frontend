
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

async function api<T>(endpoint: string, options: ApiOptions = {}): Promise<T> {
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

    // Check if the response is JSON, otherwise throw a network error.
    const contentType = response.headers.get("content-type");
    if (!contentType || !contentType.includes("application/json")) {
        const responseText = await response.text();
        throw new TypeError(`Server returned non-JSON response: ${response.status} ${response.statusText} \nResponse: ${responseText}`);
    }

    const responseData = await response.json();

    if (!response.ok) {
      // The API returned an error status code (4xx or 5xx).
      // The responseData should be an ApiErrorResponse.
      const errorMessage = responseData.message || 'An unknown API error occurred.';
       // Special handling for new google user trying to register
      if (responseData.isNewUser && responseData.profile) {
          throw new Error(JSON.stringify(responseData));
      }
       if (errorMessage.includes('You already have a registration for this event')) {
          throw new Error('You already have a registration for this event');
      }
      throw new Error(errorMessage);
    }
    
    // The response is ok (2xx status code). It should be a success.
    // The backend might not always include success:true, but if the status is ok, we treat it as success.
    // We will ensure our own success property.
    if(responseData.success === undefined) {
      responseData.success = true;
    }
    return responseData as T;

  } catch (error) {
    // This will catch network errors (e.g., failed to fetch) and errors thrown above.
    console.error(`API call to '${endpoint}' failed:`, error);
    if (error instanceof Error) {
        throw error; // Re-throw the error with its original message.
    }
    throw new Error('An unknown network error occurred.');
  }
}

export default api;
