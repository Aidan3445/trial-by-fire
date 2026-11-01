import { type QueryClient } from '@tanstack/query-core';

export { };

declare global {
  interface CustomJwtSessionClaims {
    userId?: string;
    // Primary email, from the session token template 
    email?: string;
  }
}

declare global {
  interface Window {
    __TANSTACK_QUERY_CLIENT__:
    QueryClient;
  }
}
