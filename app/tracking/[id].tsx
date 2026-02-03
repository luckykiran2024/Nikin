import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Platform,
} from 'react-native';
import { useLocalSearchParams, Stack, useRouter } from 'expo-router';
import MapView, { Marker, Polyline, PROVIDER_DEFAULT } from 'react-native-maps';
import {
  Package,
  MapPin,
  Navigation,
  Phone,
  MessageCircle,
  Clock,
  CheckCircle,
  Truck,
  User,
} from 'lucide-react-native';
import Colors from '@/constants/colors';
import { useDataStore } from '@/contexts/DataStoreContext';
import { GeoCoordinates, ShipmentStatus } from '@/types';



const cityCoordinates: Record<string, GeoCoordinates> = {
  'Mumbai': { latitude: 19.0760, longitude: 72.8777 },
  'Delhi': { latitude: 28.6139, longitude: 77.2090 },
  'Bangalore': { latitude: 12.9716, longitude: 77.5946 },
  'Hyderabad': { latitude: 17.3850, longitude: 78.4867 },
  'Chennai': { latitude: 13.0827, longitude: 80.2707 },
  'Kolkata': { latitude: 22.5726, longitude: 88.3639 },
  'Pune': { latitude: 18.5204, longitude: 73.8567 },
  'Ahmedabad': { latitude: 23.0225, longitude: 72.5714 },
  'Jaipur': { latitude: 26.9124, longitude: 75.7873 },
  'Patna': { latitude: 25.5941, longitude: 85.1376 },
  'Lucknow': { latitude: 26.8467, longitude: 80.9462 },
  'Chandigarh': { latitude: 30.7333, longitude: 76.7794 },
};

const statusSteps: { key: ShipmentStatus; label: string; icon: typeof Package }[] = [
  { key: 'created', label: 'Request Created', icon: Package },
  { key: 'quoted', label: 'Quotes Received', icon: Clock },
  { key: 'assigned', label: 'Traveler Assigned', icon: User },
  { key: 'picked_up', label: 'Parcel Picked Up', icon: CheckCircle },
  { key: 'in_transit', label: 'In Transit', icon: Truck },
  { key: 'delivered', label: 'Delivered', icon: CheckCircle },
];

export default function TrackingScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { getShipmentById } = useDataStore();
  
  const shipment = getShipmentById(id || '');
  const [currentPosition, setCurrentPosition] = useState<GeoCoordinates | null>(null);

  const pickupCoords = shipment?.pickupCoords || 
    (shipment?.pickupCity ? cityCoordinates[shipment.pickupCity] : null);
  const destinationCoords = shipment?.destinationCoords || 
    (shipment?.destinationCity ? cityCoordinates[shipment.destinationCity] : null);

  useEffect(() => {
    if (shipment?.currentLocation) {
      setCurrentPosition(shipment.currentLocation);
    } else if (pickupCoords && destinationCoords && shipment?.status === 'in_transit') {
      const midLat = (pickupCoords.latitude + destinationCoords.latitude) / 2;
      const midLng = (pickupCoords.longitude + destinationCoords.longitude) / 2;
      setCurrentPosition({ latitude: midLat, longitude: midLng });
    }
  }, [shipment, pickupCoords, destinationCoords]);

  if (!shipment) {
    return (
      <View style={styles.container}>
        <Stack.Screen options={{ title: 'Track Shipment' }} />
        <View style={styles.notFound}>
          <Package size={64} color={Colors.textTertiary} />
          <Text style={styles.notFoundText}>Shipment not found</Text>
        </View>
      </View>
    );
  }

  const currentStepIndex = statusSteps.findIndex(s => s.key === shipment.status);

  const getRegion = () => {
    if (currentPosition) {
      return {
        latitude: currentPosition.latitude,
        longitude: currentPosition.longitude,
        latitudeDelta: 5,
        longitudeDelta: 5,
      };
    }
    if (pickupCoords && destinationCoords) {
      return {
        latitude: (pickupCoords.latitude + destinationCoords.latitude) / 2,
        longitude: (pickupCoords.longitude + destinationCoords.longitude) / 2,
        latitudeDelta: Math.abs(pickupCoords.latitude - destinationCoords.latitude) * 1.5,
        longitudeDelta: Math.abs(pickupCoords.longitude - destinationCoords.longitude) * 1.5,
      };
    }
    return {
      latitude: 20.5937,
      longitude: 78.9629,
      latitudeDelta: 15,
      longitudeDelta: 15,
    };
  };

  return (
    <View style={styles.container}>
      <Stack.Screen 
        options={{ 
          title: `Track #${shipment.parcelRequestId.slice(-6)}`,
          headerStyle: { backgroundColor: Colors.primary },
          headerTintColor: Colors.textInverse,
        }} 
      />

      <View style={styles.mapContainer}>
        {Platform.OS !== 'web' ? (
          <MapView
            style={styles.map}
            provider={PROVIDER_DEFAULT}
            initialRegion={getRegion()}
            showsUserLocation={false}
            showsMyLocationButton={false}
          >
            {pickupCoords && (
              <Marker
                coordinate={pickupCoords}
                title="Pickup Location"
                description={shipment.pickupCity}
              >
                <View style={[styles.markerContainer, styles.pickupMarker]}>
                  <MapPin size={20} color={Colors.textInverse} />
                </View>
              </Marker>
            )}

            {destinationCoords && (
              <Marker
                coordinate={destinationCoords}
                title="Destination"
                description={shipment.destinationCity}
              >
                <View style={[styles.markerContainer, styles.destinationMarker]}>
                  <MapPin size={20} color={Colors.textInverse} />
                </View>
              </Marker>
            )}

            {currentPosition && shipment.status === 'in_transit' && (
              <Marker
                coordinate={currentPosition}
                title="Current Location"
                description="Traveler's current position"
              >
                <View style={[styles.markerContainer, styles.currentMarker]}>
                  <Navigation size={20} color={Colors.textInverse} />
                </View>
              </Marker>
            )}

            {pickupCoords && destinationCoords && (
              <Polyline
                coordinates={[
                  pickupCoords,
                  ...(currentPosition ? [currentPosition] : []),
                  destinationCoords,
                ]}
                strokeColor={Colors.primary}
                strokeWidth={3}
                lineDashPattern={[10, 5]}
              />
            )}
          </MapView>
        ) : (
          <View style={styles.webMapPlaceholder}>
            <MapPin size={48} color={Colors.primary} />
            <Text style={styles.webMapText}>
              {shipment.pickupCity} → {shipment.destinationCity}
            </Text>
            <Text style={styles.webMapSubtext}>
              Live map tracking available on mobile
            </Text>
          </View>
        )}
      </View>

      <ScrollView style={styles.detailsContainer} showsVerticalScrollIndicator={false}>
        <View style={styles.routeCard}>
          <View style={styles.routePoint}>
            <View style={[styles.routeDot, { backgroundColor: Colors.primary }]} />
            <View style={styles.routeInfo}>
              <Text style={styles.routeLabel}>From</Text>
              <Text style={styles.routeCity}>{shipment.pickupCity}</Text>
            </View>
          </View>
          <View style={styles.routeLine} />
          <View style={styles.routePoint}>
            <View style={[styles.routeDot, { backgroundColor: Colors.success }]} />
            <View style={styles.routeInfo}>
              <Text style={styles.routeLabel}>To</Text>
              <Text style={styles.routeCity}>{shipment.destinationCity}</Text>
            </View>
          </View>
        </View>

        {shipment.assignedTravelerName && (
          <View style={styles.travelerCard}>
            <View style={styles.travelerInfo}>
              <View style={styles.travelerAvatar}>
                <User size={24} color={Colors.textInverse} />
              </View>
              <View>
                <Text style={styles.travelerName}>{shipment.assignedTravelerName}</Text>
                <Text style={styles.travelerRole}>Travel Partner</Text>
              </View>
            </View>
            <View style={styles.travelerActions}>
              <TouchableOpacity style={styles.travelerAction}>
                <Phone size={20} color={Colors.primary} />
              </TouchableOpacity>
              <TouchableOpacity 
                style={styles.travelerAction}
                onPress={() => {
                  if (shipment.chatId) {
                    router.push(`/chat/${shipment.chatId}`);
                  }
                }}
              >
                <MessageCircle size={20} color={Colors.primary} />
              </TouchableOpacity>
            </View>
          </View>
        )}

        <View style={styles.statusCard}>
          <Text style={styles.statusTitle}>Shipment Status</Text>
          <View style={styles.timeline}>
            {statusSteps.map((step, index) => {
              const isCompleted = index <= currentStepIndex;
              const isCurrent = index === currentStepIndex;
              const StepIcon = step.icon;

              return (
                <View key={step.key} style={styles.timelineItem}>
                  <View style={styles.timelineLeft}>
                    <View style={[
                      styles.timelineIcon,
                      isCompleted && styles.timelineIconCompleted,
                      isCurrent && styles.timelineIconCurrent,
                    ]}>
                      <StepIcon 
                        size={16} 
                        color={isCompleted ? Colors.textInverse : Colors.textTertiary} 
                      />
                    </View>
                    {index < statusSteps.length - 1 && (
                      <View style={[
                        styles.timelineLine,
                        isCompleted && styles.timelineLineCompleted,
                      ]} />
                    )}
                  </View>
                  <View style={styles.timelineContent}>
                    <Text style={[
                      styles.timelineLabel,
                      isCompleted && styles.timelineLabelCompleted,
                    ]}>
                      {step.label}
                    </Text>
                    {isCurrent && (
                      <Text style={styles.timelineStatus}>Current Status</Text>
                    )}
                  </View>
                </View>
              );
            })}
          </View>
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  notFound: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  notFoundText: {
    fontSize: 16,
    color: Colors.textSecondary,
    marginTop: 12,
  },
  mapContainer: {
    height: 280,
    backgroundColor: Colors.surfaceSecondary,
  },
  map: {
    flex: 1,
  },
  webMapPlaceholder: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.surfaceSecondary,
  },
  webMapText: {
    fontSize: 18,
    fontWeight: '600' as const,
    color: Colors.text,
    marginTop: 12,
  },
  webMapSubtext: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginTop: 4,
  },
  markerContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  pickupMarker: {
    backgroundColor: Colors.primary,
  },
  destinationMarker: {
    backgroundColor: Colors.success,
  },
  currentMarker: {
    backgroundColor: Colors.warning,
  },
  detailsContainer: {
    flex: 1,
    padding: 16,
  },
  routeCard: {
    backgroundColor: Colors.surface,
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
  },
  routePoint: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  routeDot: {
    width: 14,
    height: 14,
    borderRadius: 7,
  },
  routeInfo: {
    flex: 1,
  },
  routeLabel: {
    fontSize: 12,
    color: Colors.textTertiary,
    textTransform: 'uppercase' as const,
  },
  routeCity: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: Colors.text,
  },
  routeLine: {
    width: 2,
    height: 20,
    backgroundColor: Colors.border,
    marginLeft: 6,
    marginVertical: 4,
  },
  travelerCard: {
    backgroundColor: Colors.surface,
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  travelerInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  travelerAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  travelerName: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: Colors.text,
  },
  travelerRole: {
    fontSize: 13,
    color: Colors.textSecondary,
  },
  travelerActions: {
    flexDirection: 'row',
    gap: 8,
  },
  travelerAction: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Colors.primaryLight + '20',
    justifyContent: 'center',
    alignItems: 'center',
  },
  statusCard: {
    backgroundColor: Colors.surface,
    borderRadius: 16,
    padding: 16,
  },
  statusTitle: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: Colors.text,
    marginBottom: 16,
  },
  timeline: {
    paddingLeft: 4,
  },
  timelineItem: {
    flexDirection: 'row',
    minHeight: 50,
  },
  timelineLeft: {
    alignItems: 'center',
    marginRight: 12,
  },
  timelineIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Colors.surfaceSecondary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  timelineIconCompleted: {
    backgroundColor: Colors.success,
  },
  timelineIconCurrent: {
    backgroundColor: Colors.primary,
  },
  timelineLine: {
    width: 2,
    flex: 1,
    backgroundColor: Colors.border,
    marginVertical: 4,
  },
  timelineLineCompleted: {
    backgroundColor: Colors.success,
  },
  timelineContent: {
    flex: 1,
    paddingBottom: 16,
  },
  timelineLabel: {
    fontSize: 14,
    color: Colors.textTertiary,
  },
  timelineLabelCompleted: {
    color: Colors.text,
    fontWeight: '500' as const,
  },
  timelineStatus: {
    fontSize: 12,
    color: Colors.primary,
    marginTop: 2,
  },
});
