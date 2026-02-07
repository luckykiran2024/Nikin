import React, { useEffect, useState } from 'react';
import { Text, StyleSheet, Animated, Platform } from 'react-native';
import { WifiOff, Wifi } from 'lucide-react-native';
import Colors from '@/constants/colors';

interface NetworkStatusProps {
  isConnected: boolean;
}

export function NetworkStatusBanner({ isConnected }: NetworkStatusProps) {
  const [showBanner, setShowBanner] = useState(false);
  const [wasDisconnected, setWasDisconnected] = useState(false);
  const translateY = useState(new Animated.Value(-60))[0];

  useEffect(() => {
    if (!isConnected) {
      setWasDisconnected(true);
      setShowBanner(true);
      Animated.timing(translateY, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }).start();
    } else if (wasDisconnected) {
      setTimeout(() => {
        Animated.timing(translateY, {
          toValue: -60,
          duration: 300,
          useNativeDriver: true,
        }).start(() => {
          setShowBanner(false);
          setWasDisconnected(false);
        });
      }, 2000);
    }
  }, [isConnected, wasDisconnected, translateY]);

  if (!showBanner) return null;

  return (
    <Animated.View
      style={[
        styles.banner,
        isConnected ? styles.connectedBanner : styles.disconnectedBanner,
        { transform: [{ translateY }] },
      ]}
    >
      {isConnected ? (
        <>
          <Wifi size={18} color={Colors.textInverse} />
          <Text style={styles.bannerText}>Back online</Text>
        </>
      ) : (
        <>
          <WifiOff size={18} color={Colors.textInverse} />
          <Text style={styles.bannerText}>No internet connection</Text>
        </>
      )}
    </Animated.View>
  );
}

export function useNetworkStatus() {
  const [isConnected, setIsConnected] = useState(true);

  useEffect(() => {
    if (Platform.OS === 'web') {
      const handleOnline = () => setIsConnected(true);
      const handleOffline = () => setIsConnected(false);

      window.addEventListener('online', handleOnline);
      window.addEventListener('offline', handleOffline);

      setIsConnected(navigator.onLine);

      return () => {
        window.removeEventListener('online', handleOnline);
        window.removeEventListener('offline', handleOffline);
      };
    }
    return undefined;
  }, []);

  return { isConnected };
}

const styles = StyleSheet.create({
  banner: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    paddingTop: Platform.OS === 'ios' ? 50 : 10,
    gap: 8,
    zIndex: 1000,
  },
  disconnectedBanner: {
    backgroundColor: Colors.error,
  },
  connectedBanner: {
    backgroundColor: Colors.success,
  },
  bannerText: {
    color: Colors.textInverse,
    fontSize: 14,
    fontWeight: '600' as const,
  },
});

export default NetworkStatusBanner;
