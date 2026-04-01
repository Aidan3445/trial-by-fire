import { useAuth } from '@clerk/expo';

/**
 * A custom hook to perform authenticated fetch requests.
 * It automatically includes the user's auth token in the request headers.
 * @param fetchMethod - The HTTP method to use for the request (default is 'GET').
 * this will be overridden by [options.method] if provided for a specific request.
 * @param debug - If true, logs debug information to the console (default is false).
 * @returns A function that takes an endpoint and options, performs the fetch, and returns the response.
 */
export function useFetch(fetchMethod: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE' = 'GET', debug = false) {
  const { getToken } = useAuth();

  return async (
    endpoint: string,
    options?: {
      method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
      headers?: Record<string, string>;
      body?: any;
    }
  ) => {
    const opts = { method: fetchMethod, ...options };
    if (debug) console.log('Fetching:', endpoint, opts);

    const token = await getToken();
    if (!token) {
      if (debug) console.log('No auth token available');
      throw new Error('User is not authenticated');
    }

    if (debug) console.log(`Auth token acquired: ${token.substring(0, 10)}...`);

    const { method, headers = {}, body } = opts || {};

    const response = await fetch(`${process.env.EXPO_PUBLIC_API_URL}${endpoint}`, {
      method: method || fetchMethod,
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
        ...headers
      },
      ...(body && { body: JSON.stringify(body) })
    });

    if (debug) console.log(`Response from ${endpoint}: `, response.status, response.statusText);

    return response;
  };
}
