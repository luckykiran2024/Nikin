import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Stack, useRouter, useSegments } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import React, { useEffect } from "react";
import { View } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { DataStoreProvider } from "@/contexts/DataStoreContext";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { NetworkStatusBanner, useNetworkStatus } from "@/components/NetworkStatus";
import { LoadingScreen } from "@/components/LoadingScreen";
import Colors from "@/constants/colors";
import { trpc, trpcClient } from "@/lib/trpc";
import { installGlobalErrorHandlers, errorTracker } from "@/utils/errorTracking";

installGlobalErrorHandlers();

SplashScreen.preventAutoHideAsync();

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 2,
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
      staleTime: 1000 * 60,
      gcTime: 1000 * 60 * 5,
    },
    mutations: {
      retry: 1,
    },
  },
});

function RootLayoutNav() {
  const { isAuthenticated, isLoading, isAdmin } = useAuth();
  const router = useRouter();
  const segments = useSegments();
  const { isConnected } = useNetworkStatus();

  useEffect(() => {
    if (isLoading) return;

    const inAuthGroup = segments[0] === '(auth)';
    const inAdminGroup = segments[0] === '(admin)';

    if (!isAuthenticated && !inAuthGroup) {
      router.replace('/(auth)/login');
    } else if (isAuthenticated) {
      if (isAdmin && !inAdminGroup) {
        router.replace('/(admin)/dashboard' as any);
      } else if (!isAdmin && inAdminGroup) {
        router.replace('/(tabs)');
      } else if (inAuthGroup) {
        if (isAdmin) {
          router.replace('/(admin)/dashboard' as any);
        } else {
          router.replace('/(tabs)');
        }
      }
    }
  }, [isAuthenticated, isLoading, isAdmin, segments, router]);

  if (isLoading) {
    return <LoadingScreen message="Starting ParcelPeer..." />;
  }

  return (
    <View style={{ flex: 1 }}>
      <NetworkStatusBanner isConnected={isConnected} />
    <Stack screenOptions={{ headerBackTitle: "Back" }}>
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen name="(auth)" options={{ headerShown: false }} />
      <Stack.Screen name="(admin)" options={{ headerShown: false }} />
      <Stack.Screen 
        name="create-shipment" 
        options={{ 
          title: 'Create Shipment',
          headerStyle: { backgroundColor: Colors.primary },
          headerTintColor: Colors.textInverse,
          presentation: 'modal',
        }} 
      />
      <Stack.Screen 
        name="shipment/[id]" 
        options={{ 
          title: 'Shipment Details',
          headerStyle: { backgroundColor: Colors.primary },
          headerTintColor: Colors.textInverse,
        }} 
      />
      <Stack.Screen 
        name="submit-quote" 
        options={{ 
          title: 'Submit Quote',
          headerStyle: { backgroundColor: Colors.primary },
          headerTintColor: Colors.textInverse,
          presentation: 'modal',
        }} 
      />
      <Stack.Screen 
        name="create-route" 
        options={{ 
          title: 'Create Route',
          headerStyle: { backgroundColor: Colors.primary },
          headerTintColor: Colors.textInverse,
          presentation: 'modal',
        }} 
      />
      <Stack.Screen 
        name="kyc" 
        options={{ 
          title: 'KYC Verification',
          headerStyle: { backgroundColor: Colors.primary },
          headerTintColor: Colors.textInverse,
        }} 
      />
      <Stack.Screen 
        name="payment" 
        options={{ 
          title: 'Payment',
          headerStyle: { backgroundColor: Colors.primary },
          headerTintColor: Colors.textInverse,
          presentation: 'modal',
        }} 
      />
      <Stack.Screen 
        name="support" 
        options={{ 
          title: 'Support',
          headerStyle: { backgroundColor: Colors.primary },
          headerTintColor: Colors.textInverse,
        }} 
      />
      <Stack.Screen 
        name="chat/[id]" 
        options={{ 
          title: 'Chat',
          headerStyle: { backgroundColor: Colors.primary },
          headerTintColor: Colors.textInverse,
        }} 
      />
      <Stack.Screen 
        name="tracking/[id]" 
        options={{ 
          title: 'Track Shipment',
          headerStyle: { backgroundColor: Colors.primary },
          headerTintColor: Colors.textInverse,
        }} 
      />
    </Stack>
    </View>
  );
}

export default function RootLayout() {
  useEffect(() => {
    SplashScreen.hideAsync();
    errorTracker.setTag('app', 'parcelpeer');
  }, []);

  return (
    <ErrorBoundary>
      <trpc.Provider client={trpcClient} queryClient={queryClient}>
        <QueryClientProvider client={queryClient}>
          <AuthProvider>
            <DataStoreProvider>
              <GestureHandlerRootView style={{ flex: 1 }}>
                <RootLayoutNav />
              </GestureHandlerRootView>
            </DataStoreProvider>
          </AuthProvider>
        </QueryClientProvider>
      </trpc.Provider>
    </ErrorBoundary>
  );
}
