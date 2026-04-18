import React, { useCallback, useState, useEffect } from 'react';
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
import { useRouter } from 'expo-router';
import { 
  Package, 
  Plus, 
  ChevronRight, 
  Star,
  Clock,
  AlertCircle,
  CheckCircle,
  XCircle,
  MapPin,
  Navigation,
  Shield,
  MessageSquare,
  IndianRupee,
  Wallet,
  TrendingUp,
} from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import * as Location from 'expo-location';
import Colors from '@/constants/colors';
import { useAuth } from '@/contexts/AuthContext';
import { useDataStore } from '@/contexts/DataStoreContext';
import useResponsive from '@/hooks/useResponsive';

export default function HomeScreen() {
  const router = useRouter();
  const { user, isAuthenticated } = useAuth();
  const { shipments, quotes } = useDataStore();
  const [refreshing, setRefreshing] = useState(false);
  const [currentCity, setCurrentCity] = useState<string | null>(null);
  const [locationLoading, setLocationLoading] = useState(false);
  const { isDesktop, contentMaxWidth, padding } = useResponsive();

  useEffect(() => {
    if (user?.activeRole === 'traveler') {
      requestLocation();
    }
  }, [user?.activeRole]);

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
    if (user?.activeRole === 'traveler') {
      requestLocation();
    }
    setTimeout(() => setRefreshing(false), 1000);
  }, [user?.activeRole]);

  if (!isAuthenticated || !user) {
    return (
      <LinearGradient
        colors={[Colors.primary, Colors.primaryDark]}
        style={styles.authContainer}
      >
        <View style={styles.authContent}>
          <View style={styles.logoContainer}>
            <Package size={64} color={Colors.textInverse} />
          </View>
          <Text style={styles.authTitle}>ParcelPeer</Text>
          <Text style={styles.authSubtitle}>
            Connect with travelers to send parcels across cities
          </Text>
          <TouchableOpacity
            style={styles.authButton}
            onPress={() => router.push('/(auth)/login')}
          >
            <Text style={styles.authButtonText}>Get Started</Text>
          </TouchableOpacity>

          <TouchableOpacity
            testID="admin-login-shortcut"
            style={styles.adminShortcut}
            onPress={() => router.push({ pathname: '/(auth)/login', params: { role: 'admin' } })}
            activeOpacity={0.85}
          >
            <Shield size={14} color={Colors.textInverse} />
            <Text style={styles.adminShortcutText}>Admin Login</Text>
          </TouchableOpacity>
        </View>
      </LinearGradient>
    );
  }

  const isTraveler = user.activeRole === 'traveler';

  // Get user's shipments
  const userShipments = shipments.filter(s => {
    if (isTraveler) {
      return s.assignedTravelerId === user.id;
    }
    return s.senderId === user.id;
  });

  // Get active shipments (not completed)
  const activeShipments = userShipments.filter(s => s.status !== 'completed');

  // For travelers: get available shipments to bid on (filtered by location if available)
  const availableShipments = shipments.filter(s => {
    if (s.status !== 'created' && s.status !== 'quoted') return false;
    if (currentCity) {
      const cityLower = currentCity.toLowerCase();
      return s.pickupCity.toLowerCase().includes(cityLower) ||
             s.destinationCity.toLowerCase().includes(cityLower);
    }
    return true;
  });

  // Get traveler's submitted quotes
  const travelerQuotes = quotes.filter(q => q.travelerId === user?.id);
  const pendingQuotes = travelerQuotes.filter(q => q.status === 'pending');
  const acceptedQuotes = travelerQuotes.filter(q => q.status === 'accepted');

  // Calculate traveler earnings
  const travelerEarnings = userShipments
    .filter(s => s.status === 'completed' && s.acceptedQuoteAmount)
    .reduce((sum, s) => sum + (s.acceptedQuoteAmount || 0) * 0.8, 0);

  const pendingEarnings = userShipments
    .filter(s => s.status === 'delivered' && s.acceptedQuoteAmount)
    .reduce((sum, s) => sum + (s.acceptedQuoteAmount || 0) * 0.8, 0);

  // Get shipments with pending quotes for sender
  const shipmentsWithQuotes = shipments.filter(s => 
    s.senderId === user.id && s.quotesCount > 0 && s.status !== 'assigned'
  );

  const getStatusColor = (status: string): string => {
    const colors: Record<string, string> = {
      created: Colors.info,
      quoted: Colors.warning,
      assigned: Colors.primary,
      picked_up: '#8B5CF6',
      in_transit: Colors.info,
      delivered: Colors.success,
      completed: Colors.success,
    };
    return colors[status] || Colors.textSecondary;
  };

  const formatStatus = (status: string): string => {
    return status.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  };

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={[Colors.primary, Colors.primaryDark]}
        style={[styles.header, isDesktop && styles.headerDesktop]}
      >
        <View style={styles.headerContent}>
          <View>
            <Text style={styles.greeting}>Hello, {user.name.split(' ')[0]}!</Text>
            <Text style={styles.roleText}>
              {isTraveler ? 'Traveler Mode' : 'Sender Mode'}
            </Text>
          </View>
          {isTraveler && user.kycStatus && (
            <TouchableOpacity 
              style={[
                styles.kycBadge,
                user.kycStatus === 'approved' && styles.kycBadgeVerified,
                user.kycStatus === 'pending' && styles.kycBadgePending,
                user.kycStatus === 'rejected' && styles.kycBadgeRejected,
                user.kycStatus === 'not_submitted' && styles.kycBadgeNotSubmitted,
              ]}
              onPress={() => router.push('/kyc')}
            >
              {user.kycStatus === 'approved' && <CheckCircle size={14} color={Colors.textInverse} />}
              {user.kycStatus === 'pending' && <Clock size={14} color="#92400E" />}
              {user.kycStatus === 'rejected' && <XCircle size={14} color={Colors.textInverse} />}
              {user.kycStatus === 'not_submitted' && <AlertCircle size={14} color={Colors.textInverse} />}
              <Text style={[
                styles.kycBadgeText,
                user.kycStatus === 'pending' && styles.kycBadgeTextPending,
              ]}>
                {user.kycStatus === 'approved' ? 'Verified' : 
                 user.kycStatus === 'pending' ? 'Pending' : 
                 user.kycStatus === 'rejected' ? 'Rejected' : 'KYC Required'}
              </Text>
            </TouchableOpacity>
          )}
        </View>
      </LinearGradient>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[
          styles.scrollContent,
          { maxWidth: contentMaxWidth, alignSelf: 'center', width: '100%', paddingHorizontal: padding }
        ]}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={Colors.primary}
          />
        }
      >
        {/* Stats Cards */}
        <View style={[styles.statsContainer, isDesktop && styles.statsContainerDesktop]}>
          {isTraveler ? (
            <>
              <View style={styles.statCard}>
                <Package size={24} color={Colors.primary} />
                <Text style={styles.statValue}>{userShipments.length}</Text>
                <Text style={styles.statLabel}>Deliveries</Text>
              </View>
              <View style={styles.statCard}>
                <Wallet size={24} color={Colors.success} />
                <Text style={styles.statValue}>₹{Math.round(travelerEarnings)}</Text>
                <Text style={styles.statLabel}>Earned</Text>
              </View>
              <View style={styles.statCard}>
                <Star size={24} color={Colors.warning} />
                <Text style={styles.statValue}>{user.rating?.toFixed(1) || '0.0'}</Text>
                <Text style={styles.statLabel}>Rating</Text>
              </View>
            </>
          ) : (
            <>
              <View style={styles.statCard}>
                <Package size={24} color={Colors.primary} />
                <Text style={styles.statValue}>{userShipments.length}</Text>
                <Text style={styles.statLabel}>Shipments</Text>
              </View>
              <View style={styles.statCard}>
                <Clock size={24} color={Colors.warning} />
                <Text style={styles.statValue}>{activeShipments.length}</Text>
                <Text style={styles.statLabel}>Active</Text>
              </View>
              <View style={styles.statCard}>
                <Star size={24} color={Colors.warning} />
                <Text style={styles.statValue}>{user.rating?.toFixed(1) || '0.0'}</Text>
                <Text style={styles.statLabel}>Rating</Text>
              </View>
            </>
          )}
        </View>

        {/* Quick Actions */}
        {!isTraveler && (
          <TouchableOpacity
            style={styles.actionCard}
            onPress={() => router.push('/create-shipment')}
          >
            <LinearGradient
              colors={[Colors.primary, Colors.primaryDark]}
              style={styles.actionGradient}
            >
              <View style={styles.actionIcon}>
                <Plus size={24} color={Colors.primary} />
              </View>
              <View style={styles.actionText}>
                <Text style={styles.actionTitle}>Create Shipment</Text>
                <Text style={styles.actionSubtitle}>Send a new parcel</Text>
              </View>
              <ChevronRight size={24} color={Colors.textInverse} />
            </LinearGradient>
          </TouchableOpacity>
        )}

        {/* Traveler Earnings Quick View */}
        {isTraveler && user.kycStatus === 'approved' && (
          <TouchableOpacity
            style={styles.earningsCard}
            onPress={() => router.push('/(tabs)/earnings')}
          >
            <View style={styles.earningsHeader}>
              <View style={styles.earningsIconContainer}>
                <TrendingUp size={24} color={Colors.success} />
              </View>
              <View style={styles.earningsContent}>
                <Text style={styles.earningsTitle}>Your Earnings</Text>
                <View style={styles.earningsRow}>
                  <Text style={styles.earningsAmount}>₹{Math.round(travelerEarnings).toLocaleString()}</Text>
                  {pendingEarnings > 0 && (
                    <Text style={styles.earningsPending}>+₹{Math.round(pendingEarnings)} pending</Text>
                  )}
                </View>
              </View>
              <ChevronRight size={20} color={Colors.textSecondary} />
            </View>
          </TouchableOpacity>
        )}

        {/* KYC Required Block for Travelers */}
        {isTraveler && user.kycStatus !== 'approved' && (
          <View style={styles.kycBlockCard}>
            <View style={styles.kycBlockIcon}>
              <Shield size={48} color={Colors.warning} />
            </View>
            <Text style={styles.kycBlockTitle}>Complete KYC to Receive Orders</Text>
            <Text style={styles.kycBlockSubtitle}>
              {user.kycStatus === 'pending' 
                ? 'Your KYC verification is under review. You will be notified once approved.'
                : 'Verify your identity to start accepting parcel delivery requests and earn money.'}
            </Text>
            {user.kycStatus !== 'pending' && (
              <TouchableOpacity
                style={styles.kycBlockButton}
                onPress={() => router.push('/kyc')}
              >
                <Text style={styles.kycBlockButtonText}>Complete KYC Now</Text>
              </TouchableOpacity>
            )}
            {user.kycStatus === 'pending' && (
              <View style={styles.kycPendingBadge}>
                <Clock size={16} color={Colors.warning} />
                <Text style={styles.kycPendingText}>Verification Pending</Text>
              </View>
            )}
          </View>
        )}

        {/* Location Card for Travelers */}
        {isTraveler && user.kycStatus === 'approved' && (
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
        )}

        {/* Pending Quotes Section for Senders */}
        {!isTraveler && shipmentsWithQuotes.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Pending Quotes</Text>
              <View style={styles.badge}>
                <Text style={styles.badgeText}>{shipmentsWithQuotes.length}</Text>
              </View>
            </View>
            {shipmentsWithQuotes.slice(0, 3).map((shipment) => (
              <TouchableOpacity
                key={shipment.id}
                style={styles.quoteCard}
                onPress={() => router.push(`/shipment/${shipment.id}`)}
              >
                <View style={styles.quoteHeader}>
                  <Text style={styles.quoteRoute}>
                    {shipment.pickupCity} → {shipment.destinationCity}
                  </Text>
                  <View style={styles.quoteCountBadge}>
                    <Text style={styles.quoteCountText}>{shipment.quotesCount} quotes</Text>
                  </View>
                </View>
                <Text style={styles.quoteDescription} numberOfLines={1}>
                  {shipment.parcelDetails.description}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        )}

        {/* Active Shipments */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>
              {isTraveler ? 'Your Deliveries' : 'Active Shipments'}
            </Text>
            <TouchableOpacity onPress={() => router.push('/(tabs)/shipments')}>
              <Text style={styles.seeAll}>See All</Text>
            </TouchableOpacity>
          </View>

          {activeShipments.length === 0 ? (
            <View style={styles.emptyState}>
              <Package size={48} color={Colors.textTertiary} />
              <Text style={styles.emptyText}>
                {isTraveler ? 'No active deliveries' : 'No active shipments'}
              </Text>
            </View>
          ) : (
            activeShipments.slice(0, 3).map((shipment) => (
              <TouchableOpacity
                key={shipment.id}
                style={styles.shipmentCard}
                onPress={() => router.push(`/shipment/${shipment.id}`)}
              >
                <View style={styles.shipmentHeader}>
                  <Text style={styles.shipmentId}>
                    {shipment.parcelRequestId || `#${shipment.id.slice(-6)}`}
                  </Text>
                  <View style={[styles.statusBadge, { backgroundColor: getStatusColor(shipment.status) + '20' }]}>
                    <Text style={[styles.statusText, { color: getStatusColor(shipment.status) }]}>
                      {formatStatus(shipment.status)}
                    </Text>
                  </View>
                </View>
                <View style={styles.routeRow}>
                  <View style={styles.routeDot} />
                  <Text style={styles.cityText}>{shipment.pickupCity}</Text>
                  <View style={styles.routeLine} />
                  <View style={[styles.routeDot, { backgroundColor: Colors.success }]} />
                  <Text style={styles.cityText}>{shipment.destinationCity}</Text>
                </View>
              </TouchableOpacity>
            ))
          )}
        </View>

        {/* Traveler Quotes Summary */}
        {isTraveler && user.kycStatus === 'approved' && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Your Quotes</Text>
            </View>
            <View style={styles.quoteSummaryRow}>
              <View style={styles.quoteSummaryItem}>
                <View style={[styles.quoteSummaryIcon, { backgroundColor: Colors.warningLight }]}>
                  <Clock size={18} color={Colors.warning} />
                </View>
                <Text style={styles.quoteSummaryValue}>{pendingQuotes.length}</Text>
                <Text style={styles.quoteSummaryLabel}>Pending</Text>
              </View>
              <View style={styles.quoteSummaryItem}>
                <View style={[styles.quoteSummaryIcon, { backgroundColor: Colors.successLight }]}>
                  <CheckCircle size={18} color={Colors.success} />
                </View>
                <Text style={styles.quoteSummaryValue}>{acceptedQuotes.length}</Text>
                <Text style={styles.quoteSummaryLabel}>Accepted</Text>
              </View>
              <View style={styles.quoteSummaryItem}>
                <View style={[styles.quoteSummaryIcon, { backgroundColor: Colors.primaryLight + '40' }]}>
                  <MessageSquare size={18} color={Colors.primary} />
                </View>
                <Text style={styles.quoteSummaryValue}>{travelerQuotes.length}</Text>
                <Text style={styles.quoteSummaryLabel}>Total</Text>
              </View>
            </View>
          </View>
        )}

        {/* Available Shipments for Travelers */}
        {isTraveler && user.kycStatus === 'approved' && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>
                {currentCity ? `Shipments near ${currentCity}` : 'Available Shipments'}
              </Text>
              <TouchableOpacity onPress={() => router.push('/(tabs)/shipments')}>
                <Text style={styles.seeAll}>See All</Text>
              </TouchableOpacity>
            </View>

            {availableShipments.length === 0 ? (
              <View style={[styles.emptyState, isDesktop && styles.emptyStateDesktop]}>
                <Package size={48} color={Colors.textTertiary} />
                <Text style={styles.emptyText}>
                  {currentCity ? `No shipments near ${currentCity}` : 'No shipments available'}
                </Text>
                <Text style={styles.emptySubtext}>Pull to refresh or check all shipments</Text>
              </View>
            ) : (
              <View style={isDesktop ? styles.shipmentGridDesktop : undefined}>
              {availableShipments.slice(0, isDesktop ? 6 : 5).map((shipment) => (
                <TouchableOpacity
                  key={shipment.id}
                  style={[styles.shipmentCard, isDesktop && styles.shipmentCardDesktop]}
                  onPress={() => router.push(`/shipment/${shipment.id}`)}
                >
                  <View style={styles.shipmentHeader}>
                    <Text style={styles.shipmentId}>{shipment.parcelRequestId}</Text>
                    <View style={styles.shipmentMeta}>
                      <Text style={styles.shipmentWeight}>
                        {shipment.parcelDetails.weight} kg
                      </Text>
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
              ))}
              </View>
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
  authContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  authContent: {
    alignItems: 'center',
    padding: 40,
  },
  logoContainer: {
    width: 100,
    height: 100,
    borderRadius: 25,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  authTitle: {
    fontSize: 32,
    fontWeight: '700' as const,
    color: Colors.textInverse,
    marginBottom: 8,
  },
  authSubtitle: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.8)',
    textAlign: 'center',
    marginBottom: 32,
  },
  authButton: {
    backgroundColor: Colors.textInverse,
    paddingHorizontal: 32,
    paddingVertical: 16,
    borderRadius: 12,
  },
  authButtonText: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: Colors.primary,
  },
  adminShortcut: {
    marginTop: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.35)',
    backgroundColor: 'rgba(255,255,255,0.1)',
  },
  adminShortcutText: {
    fontSize: 13,
    fontWeight: '700' as const,
    color: Colors.textInverse,
    letterSpacing: 0.5,
  },
  header: {
    paddingTop: 60,
    paddingBottom: 20,
    paddingHorizontal: 20,
  },
  headerDesktop: {
    paddingTop: 40,
    paddingBottom: 24,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  greeting: {
    fontSize: 24,
    fontWeight: '700' as const,
    color: Colors.textInverse,
  },
  roleText: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.8)',
    marginTop: 4,
  },
  kycBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    gap: 4,
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
    fontSize: 12,
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
  statsContainer: {
    flexDirection: 'row',
    gap: 12,
    marginTop: -40,
    marginBottom: 20,
  },
  statsContainerDesktop: {
    gap: 16,
    justifyContent: 'center',
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
  statValue: {
    fontSize: 24,
    fontWeight: '700' as const,
    color: Colors.text,
    marginTop: 8,
  },
  statLabel: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginTop: 4,
  },
  actionCard: {
    marginBottom: 20,
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 4,
  },
  actionGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
  },
  actionIcon: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: Colors.textInverse,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  actionText: {
    flex: 1,
  },
  actionTitle: {
    fontSize: 18,
    fontWeight: '600' as const,
    color: Colors.textInverse,
  },
  actionSubtitle: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.8)',
    marginTop: 2,
  },
  section: {
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600' as const,
    color: Colors.text,
  },
  seeAll: {
    fontSize: 14,
    color: Colors.primary,
    fontWeight: '500' as const,
  },
  badge: {
    backgroundColor: Colors.primary,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  badgeText: {
    fontSize: 12,
    fontWeight: '600' as const,
    color: Colors.textInverse,
  },
  emptyState: {
    alignItems: 'center',
    padding: 32,
    backgroundColor: Colors.surface,
    borderRadius: 16,
  },
  emptyStateDesktop: {
    padding: 48,
  },
  shipmentGridDesktop: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
  },
  shipmentCardDesktop: {
    width: '48%',
    marginBottom: 0,
  },
  emptyText: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginTop: 12,
  },
  shipmentCard: {
    backgroundColor: Colors.surface,
    borderRadius: 12,
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
  shipmentWeight: {
    fontSize: 12,
    color: Colors.textSecondary,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  statusText: {
    fontSize: 11,
    fontWeight: '600' as const,
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
    marginTop: 8,
  },
  quoteCard: {
    backgroundColor: Colors.surface,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderLeftWidth: 4,
    borderLeftColor: Colors.warning,
  },
  quoteHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  quoteRoute: {
    fontSize: 15,
    fontWeight: '600' as const,
    color: Colors.text,
  },
  quoteCountBadge: {
    backgroundColor: Colors.warningLight,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  quoteCountText: {
    fontSize: 12,
    fontWeight: '600' as const,
    color: Colors.warning,
  },
  quoteDescription: {
    fontSize: 13,
    color: Colors.textSecondary,
  },
  kycBlockCard: {
    backgroundColor: Colors.surface,
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    marginBottom: 20,
    borderWidth: 2,
    borderColor: Colors.warningLight,
  },
  kycBlockIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: Colors.warningLight,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  kycBlockTitle: {
    fontSize: 18,
    fontWeight: '700' as const,
    color: Colors.text,
    marginBottom: 8,
    textAlign: 'center',
  },
  kycBlockSubtitle: {
    fontSize: 14,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 16,
  },
  kycBlockButton: {
    backgroundColor: Colors.primary,
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 12,
  },
  kycBlockButtonText: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: Colors.textInverse,
  },
  kycPendingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.warningLight,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    gap: 8,
  },
  kycPendingText: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: Colors.warning,
  },
  locationCard: {
    backgroundColor: Colors.surface,
    borderRadius: 12,
    padding: 14,
    marginBottom: 16,
  },
  locationHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  locationTitle: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: Colors.text,
  },
  locationText: {
    fontSize: 13,
    color: Colors.textSecondary,
  },
  locationContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  locationCity: {
    fontSize: 15,
    fontWeight: '600' as const,
    color: Colors.text,
    flex: 1,
  },
  refreshLocation: {
    fontSize: 13,
    color: Colors.primary,
    fontWeight: '500' as const,
  },
  enableLocation: {
    paddingVertical: 6,
  },
  enableLocationText: {
    fontSize: 13,
    color: Colors.primary,
  },
  quoteSummaryRow: {
    flexDirection: 'row',
    backgroundColor: Colors.surface,
    borderRadius: 12,
    padding: 12,
  },
  quoteSummaryItem: {
    flex: 1,
    alignItems: 'center',
  },
  quoteSummaryIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 6,
  },
  quoteSummaryValue: {
    fontSize: 18,
    fontWeight: '700' as const,
    color: Colors.text,
  },
  quoteSummaryLabel: {
    fontSize: 11,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  shipmentMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  quotesCountBadge: {
    backgroundColor: Colors.primaryLight + '30',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  quotesCountText: {
    fontSize: 11,
    fontWeight: '600' as const,
    color: Colors.primary,
  },
  shipmentFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 10,
    paddingTop: 10,
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
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    gap: 4,
  },
  submitQuoteBtnText: {
    fontSize: 13,
    fontWeight: '600' as const,
    color: Colors.textInverse,
  },
  emptySubtext: {
    fontSize: 12,
    color: Colors.textTertiary,
    marginTop: 4,
  },
  earningsCard: {
    backgroundColor: Colors.surface,
    borderRadius: 16,
    padding: 16,
    marginBottom: 20,
    borderLeftWidth: 4,
    borderLeftColor: Colors.success,
  },
  earningsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  earningsIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: Colors.successLight,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  earningsContent: {
    flex: 1,
  },
  earningsTitle: {
    fontSize: 13,
    color: Colors.textSecondary,
    marginBottom: 2,
  },
  earningsRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 8,
  },
  earningsAmount: {
    fontSize: 22,
    fontWeight: '700' as const,
    color: Colors.success,
  },
  earningsPending: {
    fontSize: 12,
    color: Colors.warning,
  },
});
