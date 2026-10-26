import { httpLink } from "@trpc/client";
import { createTRPCReact } from "@trpc/react-query";
import superjson from "superjson";
import { getSupabaseClient } from "@/lib/supabase";

import type { AppRouter } from "@/backend/trpc/app-router";

export const trpc = createTRPCReact<AppRouter>();

const getBaseUrl = (): string => {
  const rorkUrl = process.env.EXPO_PUBLIC_RORK_API_BASE_URL;
  if (rorkUrl && rorkUrl.length > 0) {
    console.log('[tRPC] Using Rork backend URL');
    return rorkUrl;
  }

  const customApiUrl = process.env.EXPO_PUBLIC_API_URL;
  if (customApiUrl && customApiUrl.length > 0) {
    console.log('[tRPC] Using custom API URL');
    return customApiUrl;
  }

  console.warn('[tRPC] No API URL configured - backend features may not work');
  return '';
};

const getTrpcEndpoint = (): string => {
  const baseUrl = getBaseUrl();
  if (!baseUrl) {
    return '/api/trpc';
  }
  return `${baseUrl}/api/trpc`;
};

export const trpcClient = trpc.createClient({
  links: [
    httpLink({
      url: getTrpcEndpoint(),
      transformer: superjson,
      async headers() {
        try {
          const { data } = await getSupabaseClient()?.auth.getSession() ?? { data: { session: null } };
          const token = data.session?.access_token;
          return token ? { Authorization: `Bearer ${token}` } : {};
        } catch (error) {
          console.warn('[tRPC] Error getting auth token:', error);
          return {};
        }
      },
    }),
  ],
});

export const isTrpcConfigured = (): boolean => {
  return Boolean(getBaseUrl());
};
