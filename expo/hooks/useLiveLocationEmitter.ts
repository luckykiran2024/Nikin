import { useEffect, useRef } from 'react';
import { Platform } from 'react-native';
import * as Location from 'expo-location';
import { useDataStore } from '@/contexts/DataStoreContext';
import { GeoCoordinates } from '@/types';

type Options = {
  shipmentId: string;
  enabled: boolean;
  intervalMs?: number;
};

export function useLiveLocationEmitter({ shipmentId, enabled, intervalMs = 15000 }: Options) {
  const { updateShipmentLocation } = useDataStore();
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const lastEmitRef = useRef<number>(0);

  useEffect(() => {
    if (!enabled || !shipmentId) {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
      return;
    }

    let cancelled = false;

    const emit = async () => {
      try {
        let coords: GeoCoordinates | null = null;

        if (Platform.OS === 'web') {
          if (typeof navigator !== 'undefined' && navigator.geolocation) {
            coords = await new Promise<GeoCoordinates | null>((resolve) => {
              navigator.geolocation.getCurrentPosition(
                (pos) => resolve({ latitude: pos.coords.latitude, longitude: pos.coords.longitude }),
                () => resolve(null),
                { enableHighAccuracy: true, timeout: 8000, maximumAge: 10000 }
              );
            });
          }
        } else {
          const { status } = await Location.getForegroundPermissionsAsync();
          let granted = status === 'granted';
          if (!granted) {
            const req = await Location.requestForegroundPermissionsAsync();
            granted = req.status === 'granted';
          }
          if (!granted) {
            console.log('[LiveLocation] permission not granted');
            return;
          }
          const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
          coords = { latitude: loc.coords.latitude, longitude: loc.coords.longitude };
        }

        if (cancelled || !coords) return;

        const now = Date.now();
        if (now - lastEmitRef.current < 3000) return;
        lastEmitRef.current = now;

        console.log('[LiveLocation] emitting', shipmentId, coords);
        await updateShipmentLocation(shipmentId, coords);
      } catch (err) {
        console.log('[LiveLocation] error', err);
      }
    };

    emit();
    timerRef.current = setInterval(emit, intervalMs);

    return () => {
      cancelled = true;
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [shipmentId, enabled, intervalMs, updateShipmentLocation]);
}
