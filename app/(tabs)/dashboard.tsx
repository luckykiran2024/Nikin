import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Platform,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import {
  Package,
  MapPin,
  Navigation,
  Shield,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  IndianRupee,
  TrendingUp,
  Wallet,
  Star,
  ChevronRight,
  Filter,
} from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import * as Location from 'expo-location';
import Colors from '@/constants/colors';
import { useAuth } from '@/contexts/AuthContext';
import { useDataStore } from '@/contexts/DataStoreContext';

export default function DashboardScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const { shipments, quotes } = useDataStore();
  const [refreshing, setRefreshing] = useState(false);
  const [currentCity, setCurrentCity] = useState<string | null>(null);
  const [locationLoading, setLocationLoading] = useState(false);

  useEffect(() => {
    requestLocation();
  }, []);

  const requestLocation = async () => {
    setLocationLoading(true);
    try {
      if (Platform.OS === 'web') {
        setCurrentCity('Mumbai');
        setLocationLoading(false);
        return;
      }
      
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert(
          'Location Permission',
          'Please enable location to see shipments near you.',
          [{ text: 'OK' }]
        );
        setLocationLoading(false);
        return;
      }

      const location = await Location.getCurrentPositionAsync({});
      const [address] = await Location.reverseGeocodeAsync({
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
      });

      if (address?.city) {
        setCurrentCity(address.city);
      } else if (address?.subregion) {
        setCurrentCity(address.subregion);
      }
    } catch (error) {
      console.log('Location error:', error);
      setCurrentCity(null);
    } finally {
      setLocationLoading(false);
    }
  };

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    requestLocation();
    setTimeout(() => setRefreshing(false), 1000);
  }, []);

  const availableShipments = shipments.filter(s => {
    if (s.status !== 'created' && s.status !== 'quoted') return false;
    if (currentCity) {
      const cityLower = currentCity.toLowerCase();
      return s.pickupCity.toLowerCase().includes(cityLower) ||
             s.destinationCity.toLowerCase().includes(cityLower);
    }
    return true;
  });

  const userShipments = shipments.filter(s => s.assignedTravelerId === user?.id);
  const activeDeliveries = userShipments.filter(s => 
    s.status !== 'completed' && s.status !== 'created'
  );

  const travelerQuotes = quotes.filter(q => q.travelerId === user?.id);
  const pendingQuotes = travelerQuotes.filter(q => q.status === 'pending');
  const acceptedQuotes = travelerQuotes.filter(q => q.status === 'accepted');

  const travelerEarnings = userShipments
    .filter(s => s.status === 'completed' && s.acceptedQuoteAmount)
    .reduce((sum, s) => sum + (s.acceptedQuoteAmount || 0) * 0.8, 0);

  const getKYCBadgeStyle = () => {
    switch (user?.kycStatus) {
      case 'approved':
        return styles.kycBadgeVerified;
      case 'pending':
        return styles.kycBadgePending;
      case 'rejected':
        return styles.kycBadgeRejected;
      default:
        return styles.kycBadgeNotSubmitted;
    }
  };

  const getKYCIcon = () => {
    switch (user?.kycStatus) {
      case 'approved':
        return <CheckCircle size={16} color={Colors.textInverse} />;
      case 'pending':
        return <Clock size={16} color="#92400E" />;
      case 'rejected':
        return <XCircle size={16} color={Colors.textInverse} />;
      default:
        return <AlertCircle size={16} color={Colors.textInverse} />;
    }
  };

  const getKYCText = () => {
    switch (user?.kycStatus) {
      case 'approved':
        return 'Verified';
      case 'pending':
        return 'Pending';
      case 'rejected':
        return 'Rejected';
      default:
        return 'KYC Required';
    }
  };

  const handleKYCPress = () => {
    router.push('/kyc');
  };

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={[Colors.primary, Colors.primaryDark]}
        style={styles.header}
      >
        <SafeAreaView edges={['top']} style={styles.headerSafeArea}>
          <View style={styles.headerContent}>
            <View>
              <Text style={styles.headerTitle}>Dashboard</Text>
              <Text style={styles.headerSubtitle}>Traveler Overview</Text>
            </View>
            <TouchableOpacity 
              style={[styles.kycBadge, getKYCBadgeStyle()]}
              onPress={handleKYCPress}
            >
              {getKYCIcon()}
              <Text style={[
                styles.kycBadgeText,
                user?.kycStatus === 'pending' && styles.kycBadgeTextPending,
              ]}>
                {getKYCText()}
              </Text>
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </LinearGradient>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={Colors.primary}
          />
        }
      >
        {user?.kycStatus !== 'approved' && (
          <TouchableOpacity 
            style={styles.kycAlertCard}
            onPress={handleKYCPress}
          >
            <View style={styles.kycAlertIcon}>
              <Shield size={32} color={user?.kycStatus === 'pending' ? Colors.warning : Colors.error} />
            </View>
            <View style={styles.kycAlertContent}>
              <Text style={styles.kycAlertTitle}>
                {user?.kycStatus === 'pending' 
                  ? 'KYC Verification Pending' 
                  : 'Complete KYC to Start'}
              </Text>
              <Text style={styles.kycAlertSubtitle}>
                {user?.kycStatus === 'pending'
                  ? 'Your documents are under review. Tap to view status.'
                  : 'Verify your identity to receive parcel delivery requests.'}
              </Text>
            </View>
            <ChevronRight size={24} color={Colors.textSecondary} />
          </TouchableOpacity>
        )}

        <View style={styles.statsGrid}>
          <View style={styles.statCard}>
            <View style={[styles.statIconContainer, { backgroundColor: Colors.primaryLight + '30' }]}>
              <Package size={24} color={Colors.primary} />
            </View>
            <Text style={styles.statValue}>{availableShipments.length}</Text>
            <Text style={styles.statLabel}>Available</Text>
          </View>
          <View style={styles.statCard}>
            <View style={[styles.statIconContainer, { backgroundColor: Colors.warningLight }]}>
              <Clock size={24} color={Colors.warning} />
            </View>
            <Text style={styles.statValue}>{pendingQuotes.length}</Text>
            <Text style={styles.statLabel}>Pending Quotes</Text>
          </View>
          <View style={styles.statCard}>
            <View style={[styles.statIconContainer, { backgroundColor: Colors.successLight }]}>
              <CheckCircle size={24} color={Colors.success} />
            </View>
            <Text style={styles.statValue}>{activeDeliveries.length}</Text>
            <Text style={styles.statLabel}>Active</Text>
          </View>
        </View>

        {user?.kycStatus === 'approved' && (
          <TouchableOpacity
            style={styles.earningsCard}
            onPress={() => router.push('/(tabs)/earnings')}
          >
            <View style={styles.earningsLeft}>
              <View style={styles.earningsIconContainer}>
                <TrendingUp size={28} color={Colors.success} />
              </View>
              <View>
                <Text style={styles.earningsLabel}>Total Earnings</Text>
                <Text style={styles.earningsAmount}>₹{Math.round(travelerEarnings).toLocaleString()}</Text>
              </View>
            </View>
            <View style={styles.earningsRight}>
              <Wallet size={20} color={Colors.textSecondary} />
              <ChevronRight size={20} color={Colors.textSecondary} />
            </View>
          </TouchableOpacity>
        )}

        <View style={styles.locationCard}>
          <View style={styles.locationHeader}>
            <Navigation size={20} color={Colors.primary} />
            <Text style={styles.locationTitle}>Your Location</Text>
          </View>
          {locationLoading ? (
            <Text style={styles.locationText}>Detecting location...</Text>
          ) : currentCity ? (
            <View style={styles.locationContent}>
              <MapPin size={16} color={Colors.success} />
              <Text style={styles.locationCity}>{currentCity}</Text>
              <TouchableOpacity onPress={requestLocation}>
                <Text style={styles.refreshLocation}>Refresh</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <TouchableOpacity style={styles.enableLocation} onPress={requestLocation}>
              <Text style={styles.enableLocationText}>Enable location to see nearby shipments</Text>
            </TouchableOpacity>
          )}
        </View>

        {user?.kycStatus === 'approved' && (
          <>
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>
                  {currentCity ? `Requests near ${currentCity}` : 'Available Requests'}
                </Text>
                <TouchableOpacity 
                  style={styles.filterButton}
                  onPress={() => router.push('/(tabs)/shipments')}
                >
                  <Filter size={16} color={Colors.primary} />
                  <Text style={styles.filterText}>View All</Text>
                </TouchableOpacity>
              </View>

              {availableShipments.length === 0 ? (
                <View style={styles.emptyState}>
                  <Package size={48} color={Colors.textTertiary} />
                  <Text style={styles.emptyText}>
                    {currentCity ? `No requests near ${currentCity}` : 'No requests available'}
                  </Text>
                  <Text style={styles.emptySubtext}>Pull to refresh or check all requests</Text>
                </View>
              ) : (
                availableShipments.slice(0, 4).map((shipment) => (
                  <TouchableOpacity
                    key={shipment.id}
                    style={styles.shipmentCard}
                    onPress={() => router.push(`/shipment/${shipment.id}`)}
                  >
                    <View style={styles.shipmentHeader}>
                      <Text style={styles.shipmentId}>{shipment.parcelRequestId}</Text>
                      <View style={styles.shipmentMeta}>
                        <Text style={styles.shipmentWeight}>{shipment.parcelDetails.weight} kg</Text>
                        {shipment.quotesCount > 0 && (
                          <View style={styles.quotesCountBadge}>
                            <Text style={styles.quotesCountText}>{shipment.quotesCount} quotes</Text>
                          </View>
                        )}
                      </View>
                    </View>
                    <View style={styles.routeRow}>
                      <View style={styles.routeDot} />
                      <Text style={styles.cityText}>{shipment.pickupCity}</Text>
                      <View style={styles.routeLine} />
                      <View style={[styles.routeDot, { backgroundColor: Colors.success }]} />
                      <Text style={styles.cityText}>{shipment.destinationCity}</Text>
                    </View>
                    <Text style={styles.shipmentDescription} numberOfLines={1}>
                      {shipment.parcelDetails.description}
                    </Text>
                    <View style={styles.shipmentFooter}>
                      <Text style={styles.preferredDate}>Deliver by: {shipment.preferredDate}</Text>
                      <TouchableOpacity 
                        style={styles.submitQuoteBtn}
                        onPress={() => router.push(`/submit-quote?shipmentId=${shipment.id}`)}
                      >
                        <IndianRupee size={14} color={Colors.textInverse} />
                        <Text style={styles.submitQuoteBtnText}>Quote</Text>
                      </TouchableOpacity>
                    </View>
                  </TouchableOpacity>
                ))
              )}
            </View>

            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>Your Activity</Text>
              </View>
              <View style={styles.activityGrid}>
                <View style={styles.activityItem}>
                  <View style={[styles.activityIcon, { backgroundColor: Colors.warningLight }]}>
                    <Clock size={20} color={Colors.warning} />
                  </View>
                  <Text style={styles.activityValue}>{pendingQuotes.length}</Text>
                  <Text style={styles.activityLabel}>Pending</Text>
                </View>
                <View style={styles.activityItem}>
                  <View style={[styles.activityIcon, { backgroundColor: Colors.successLight }]}>
                    <CheckCircle size={20} color={Colors.success} />
                  </View>
                  <Text style={styles.activityValue}>{acceptedQuotes.length}</Text>
                  <Text style={styles.activityLabel}>Accepted</Text>
                </View>
                <View style={styles.activityItem}>
                  <View style={[styles.activityIcon, { backgroundColor: Colors.primaryLight + '40' }]}>
                    <Package size={20} color={Colors.primary} />
                  </View>
                  <Text style={styles.activityValue}>{userShipments.filter(s => s.status === 'completed').length}</Text>
                  <Text style={styles.activityLabel}>Completed</Text>
                </View>
                <View style={styles.activityItem}>
                  <View style={[styles.activityIcon, { backgroundColor: '#FEF3C7' }]}>
                    <Star size={20} color={Colors.warning} />
                  </View>
                  <Text style={styles.activityValue}>{user?.rating?.toFixed(1) || '0.0'}</Text>
                  <Text style={styles.activityLabel}>Rating</Text>
                </View>
              </View>
            </View>
          </>
        )}

        {user?.kycStatus !== 'approved' && (
          <View style={styles.blockedContent}>
            <Shield size={64} color={Colors.textTertiary} />
            <Text style={styles.blockedTitle}>Complete KYC to Access</Text>
            <Text style={styles.blockedText}>
              {user?.kycStatus === 'pending'
                ? 'Your KYC is under review. You will be able to see and accept delivery requests once approved.'
                : 'Complete your KYC verification to view available delivery requests and start earning.'}
            </Text>
            {user?.kycStatus !== 'pending' && (
              <TouchableOpacity
                style={styles.completeKycButton}
                onPress={handleKYCPress}
              >
                <Text style={styles.completeKycButtonText}>Complete KYC Now</Text>
              </TouchableOpacity>
            )}
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    paddingBottom: 20,
  },
  headerSafeArea: {
    paddingHorizontal: 20,
    paddingTop: 8,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '700' as const,
    color: Colors.textInverse,
  },
  headerSubtitle: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.8)',
    marginTop: 2,
  },
  kycBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 6,
  },
  kycBadgeVerified: {
    backgroundColor: Colors.success,
  },
  kycBadgePending: {
    backgroundColor: '#FEF3C7',
  },
  kycBadgeRejected: {
    backgroundColor: Colors.error,
  },
  kycBadgeNotSubmitted: {
    backgroundColor: Colors.textTertiary,
  },
  kycBadgeText: {
    fontSize: 13,
    fontWeight: '600' as const,
    color: Colors.textInverse,
  },
  kycBadgeTextPending: {
    color: '#92400E',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 100,
  },
  kycAlertCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderRadius: 16,
    padding: 16,
    marginBottom: 20,
    borderWidth: 2,
    borderColor: Colors.warning,
  },
  kycAlertIcon: {
    width: 56,
    height: 56,
    borderRadius: 14,
    backgroundColor: Colors.warningLight,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  kycAlertContent: {
    flex: 1,
  },
  kycAlertTitle: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: Colors.text,
  },
  kycAlertSubtitle: {
    fontSize: 13,
    color: Colors.textSecondary,
    marginTop: 4,
    lineHeight: 18,
  },
  statsGrid: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 20,
  },
  statCard: {
    flex: 1,
    backgroundColor: Colors.surface,
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 2,
  },
  statIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
  },
  statValue: {
    fontSize: 24,
    fontWeight: '700' as const,
    color: Colors.text,
  },
  statLabel: {
    fontSize: 11,
    color: Colors.textSecondary,
    marginTop: 4,
    textAlign: 'center',
  },
  earningsCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Colors.surface,
    borderRadius: 16,
    padding: 18,
    marginBottom: 20,
    borderLeftWidth: 4,
    borderLeftColor: Colors.success,
  },
  earningsLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  earningsIconContainer: {
    width: 56,
    height: 56,
    borderRadius: 14,
    backgroundColor: Colors.successLight,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  earningsLabel: {
    fontSize: 13,
    color: Colors.textSecondary,
  },
  earningsAmount: {
    fontSize: 26,
    fontWeight: '700' as const,
    color: Colors.success,
    marginTop: 2,
  },
  earningsRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  locationCard: {
    backgroundColor: Colors.surface,
    borderRadius: 14,
    padding: 16,
    marginBottom: 20,
  },
  locationHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 10,
  },
  locationTitle: {
    fontSize: 15,
    fontWeight: '600' as const,
    color: Colors.text,
  },
  locationText: {
    fontSize: 14,
    color: Colors.textSecondary,
  },
  locationContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  locationCity: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: Colors.text,
    flex: 1,
  },
  refreshLocation: {
    fontSize: 14,
    color: Colors.primary,
    fontWeight: '500' as const,
  },
  enableLocation: {
    paddingVertical: 4,
  },
  enableLocationText: {
    fontSize: 14,
    color: Colors.primary,
  },
  section: {
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600' as const,
    color: Colors.text,
  },
  filterButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: Colors.primaryLight + '30',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  filterText: {
    fontSize: 13,
    fontWeight: '500' as const,
    color: Colors.primary,
  },
  emptyState: {
    alignItems: 'center',
    padding: 32,
    backgroundColor: Colors.surface,
    borderRadius: 16,
  },
  emptyText: {
    fontSize: 15,
    color: Colors.textSecondary,
    marginTop: 14,
  },
  emptySubtext: {
    fontSize: 13,
    color: Colors.textTertiary,
    marginTop: 6,
  },
  shipmentCard: {
    backgroundColor: Colors.surface,
    borderRadius: 14,
    padding: 16,
    marginBottom: 12,
  },
  shipmentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  shipmentId: {
    fontSize: 12,
    fontWeight: '600' as const,
    color: Colors.textSecondary,
  },
  shipmentMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  shipmentWeight: {
    fontSize: 12,
    color: Colors.textSecondary,
  },
  quotesCountBadge: {
    backgroundColor: Colors.primaryLight + '30',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  quotesCountText: {
    fontSize: 11,
    fontWeight: '600' as const,
    color: Colors.primary,
  },
  routeRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  routeDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.primary,
  },
  routeLine: {
    flex: 1,
    height: 2,
    backgroundColor: Colors.border,
    marginHorizontal: 8,
  },
  cityText: {
    fontSize: 14,
    fontWeight: '500' as const,
    color: Colors.text,
    marginLeft: 8,
  },
  shipmentDescription: {
    fontSize: 13,
    color: Colors.textSecondary,
    marginTop: 10,
  },
  shipmentFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  preferredDate: {
    fontSize: 12,
    color: Colors.textSecondary,
  },
  submitQuoteBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.primary,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 8,
    gap: 4,
  },
  submitQuoteBtnText: {
    fontSize: 13,
    fontWeight: '600' as const,
    color: Colors.textInverse,
  },
  activityGrid: {
    flexDirection: 'row',
    backgroundColor: Colors.surface,
    borderRadius: 16,
    padding: 16,
  },
  activityItem: {
    flex: 1,
    alignItems: 'center',
  },
  activityIcon: {
    width: 40,
    height: 40,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  activityValue: {
    fontSize: 20,
    fontWeight: '700' as const,
    color: Colors.text,
  },
  activityLabel: {
    fontSize: 11,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  blockedContent: {
    alignItems: 'center',
    padding: 40,
    backgroundColor: Colors.surface,
    borderRadius: 20,
    marginTop: 20,
  },
  blockedTitle: {
    fontSize: 20,
    fontWeight: '700' as const,
    color: Colors.text,
    marginTop: 20,
    marginBottom: 12,
  },
  blockedText: {
    fontSize: 15,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
  },
  completeKycButton: {
    backgroundColor: Colors.primary,
    paddingHorizontal: 28,
    paddingVertical: 14,
    borderRadius: 12,
    marginTop: 24,
  },
  completeKycButtonText: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: Colors.textInverse,
  },
});
