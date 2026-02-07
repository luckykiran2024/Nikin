import { httpLink } from "@trpc/client";
import { createTRPCReact } from "@trpc/react-query";
import superjson from "superjson";
import AsyncStorage from "@react-native-async-storage/async-storage";

import type { AppRouter } from "@/backend/trpc/app-router";

export const trpc = createTRPCReact<AppRouter>();

const getBaseUrl = (): string => {
  const supabaseApiUrl = process.env.EXPO_PUBLIC_API_URL;
  if (supabaseApiUrl && supabaseApiUrl.length > 0) {
    console.log('[tRPC] Using Supabase API URL');
    return supabaseApiUrl;
  }

  const rorkUrl = process.env.EXPO_PUBLIC_RORK_API_BASE_URL;
  if (rorkUrl && rorkUrl.length > 0) {
    console.log('[tRPC] Using Rork backend URL');
    return rorkUrl;
  }

  console.warn('[tRPC] No API URL configured - backend features may not work');
  return '';
};

const getTrpcEndpoint = (): string => {
  const baseUrl = getBaseUrl();
  if (!baseUrl) {
    return '/api/trpc';
  }

  const supabaseApiUrl = process.env.EXPO_PUBLIC_API_URL;
  if (supabaseApiUrl && supabaseApiUrl.length > 0) {
    return `${supabaseApiUrl}/trpc`;
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
          const token = await AsyncStorage.getItem("auth_token");
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
