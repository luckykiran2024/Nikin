import React, { useState, useMemo, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Modal,
  TextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useFocusEffect } from 'expo-router';
import { Package, ChevronRight, Search, Filter, MapPin, X, Navigation, Shield, IndianRupee, User, CheckCircle2, Clock } from 'lucide-react-native';
import Colors from '@/constants/colors';
import { useAuth } from '@/contexts/AuthContext';
import { useDataStore } from '@/contexts/DataStoreContext';
import { ShipmentStatus } from '@/types';
import { searchLocations, IndianLocation } from '@/constants/indianLocations';

const statusFilters: { label: string; value: ShipmentStatus | 'all' }[] = [
  { label: 'All', value: 'all' },
  { label: 'Created', value: 'created' },
  { label: 'Quoted', value: 'quoted' },
  { label: 'Pending Payment', value: 'payment_pending' },
  { label: 'Confirmed', value: 'confirmed' },
  { label: 'In Transit', value: 'in_transit' },
  { label: 'Delivered', value: 'delivered' },
];

export default function ShipmentsScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const { shipments, isLoading, refreshData } = useDataStore();

  useFocusEffect(
    useCallback(() => {
      console.log('Shipments screen focused, refreshing data...');
      refreshData();
    }, [refreshData])
  );
  const [activeFilter, setActiveFilter] = useState<ShipmentStatus | 'all'>('all');
  const [refreshing, setRefreshing] = useState(false);
  const [showFilterModal, setShowFilterModal] = useState(false);
  const [destinationFilter, setDestinationFilter] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [locationResults, setLocationResults] = useState<IndianLocation[]>([]);

  const isTraveler = user?.activeRole === 'traveler';

  const handleLocationSearch = useCallback((query: string) => {
    setSearchQuery(query);
    if (query.length >= 2) {
      const results = searchLocations(query);
      setLocationResults(results);
    } else {
      setLocationResults([]);
    }
  }, []);

  const handleSelectDestination = useCallback((location: IndianLocation) => {
    setDestinationFilter(location.name);
    setShowFilterModal(false);
    setSearchQuery('');
    setLocationResults([]);
  }, []);

  const clearDestinationFilter = useCallback(() => {
    setDestinationFilter('');
  }, []);

  // Filter shipments based on user role
  const userShipments = useMemo(() => {
    return shipments.filter(s => {
      if (isTraveler) {
        // For travelers, show available shipments (created/quoted) or their assigned/confirmed shipments
        return s.status === 'created' || s.status === 'quoted' || s.assignedTravelerId === user?.id;
      }
      // For senders, show only their shipments
      return s.senderId === user?.id;
    });
  }, [shipments, isTraveler, user?.id]);

  // Confirmed/Assigned shipments for travelers (payment completed)
  const myConfirmedShipments = useMemo(() => {
    if (!isTraveler) return [];
    return shipments.filter(s => 
      s.assignedTravelerId === user?.id && 
      (s.status === 'assigned' || s.status === 'picked_up' || s.status === 'in_transit' || s.status === 'delivered' || s.status === 'completed')
    );
  }, [shipments, isTraveler, user?.id]);

  // Shipments needing pickup details (confirmed but not yet assigned)
  const myNeedingPickupDetails = useMemo(() => {
    if (!isTraveler) return [];
    return shipments.filter(s => 
      s.assignedTravelerId === user?.id && 
      s.status === 'confirmed' && 
      !s.pickupDetailsCompleted
    );
  }, [shipments, isTraveler, user?.id]);

  // Pending payment shipments for travelers (quote accepted, awaiting payment)
  const myPendingPaymentShipments = useMemo(() => {
    if (!isTraveler) return [];
    return shipments.filter(s => 
      s.assignedTravelerId === user?.id && s.status === 'payment_pending'
    );
  }, [shipments, isTraveler, user?.id]);

  // Available shipments for travelers (not assigned to anyone)
  const availableShipments = useMemo(() => {
    if (!isTraveler) return [];
    return shipments.filter(s => s.status === 'created' || s.status === 'quoted');
  }, [shipments, isTraveler]);

  const filteredShipments = useMemo(() => {
    let filtered = activeFilter === 'all'
      ? userShipments
      : userShipments.filter(s => s.status === activeFilter);
    
    // Apply destination filter for travelers
    if (isTraveler && destinationFilter) {
      filtered = filtered.filter(s => 
        s.destinationCity.toLowerCase().includes(destinationFilter.toLowerCase()) ||
        s.pickupCity.toLowerCase().includes(destinationFilter.toLowerCase())
      );
    }
    
    return filtered;
  }, [activeFilter, userShipments, isTraveler, destinationFilter]);

  const onRefresh = () => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 1000);
  };

  const getStatusColor = (status: string): string => {
    const colors: Record<string, string> = {
      created: Colors.info,
      quoted: Colors.warning,
      payment_pending: '#F59E0B',
      confirmed: Colors.primary,
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
      <SafeAreaView edges={['top']} style={styles.header}>
        <Text style={styles.headerTitle}>
          {isTraveler ? 'Available Shipments' : 'My Shipments'}
        </Text>
        <View style={styles.headerActions}>
          {isTraveler && (
            <TouchableOpacity 
              style={[styles.iconButton, destinationFilter && styles.iconButtonActive]}
              onPress={() => setShowFilterModal(true)}
            >
              <MapPin size={22} color={destinationFilter ? Colors.textInverse : Colors.text} />
            </TouchableOpacity>
          )}
          <TouchableOpacity style={styles.iconButton}>
            <Filter size={22} color={Colors.text} />
          </TouchableOpacity>
        </View>
      </SafeAreaView>

      {/* Destination Filter Badge */}
      {isTraveler && destinationFilter && (
        <View style={styles.filterBadgeContainer}>
          <View style={styles.filterBadge}>
            <MapPin size={14} color={Colors.primary} />
            <Text style={styles.filterBadgeText}>Destination: {destinationFilter}</Text>
            <TouchableOpacity onPress={clearDestinationFilter}>
              <X size={16} color={Colors.textSecondary} />
            </TouchableOpacity>
          </View>
        </View>
      )}

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.filterScroll}
        contentContainerStyle={styles.filterContainer}
      >
        {statusFilters.map((filter) => (
          <TouchableOpacity
            key={filter.value}
            style={[
              styles.filterChip,
              activeFilter === filter.value && styles.filterChipActive,
            ]}
            onPress={() => setActiveFilter(filter.value)}
          >
            <Text
              style={[
                styles.filterChipText,
                activeFilter === filter.value && styles.filterChipTextActive,
              ]}
            >
              {filter.label}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

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
        {/* KYC Block for Travelers */}
        {isTraveler && user?.kycStatus !== 'approved' && (
          <View style={styles.kycBlockCard}>
            <View style={styles.kycBlockIcon}>
              <Shield size={40} color={Colors.warning} />
            </View>
            <Text style={styles.kycBlockTitle}>Complete KYC to View Requests</Text>
            <Text style={styles.kycBlockSubtitle}>
              {user?.kycStatus === 'pending'
                ? 'Your KYC verification is under review. You will be notified once approved.'
                : 'Verify your identity to browse and accept delivery requests.'}
            </Text>
            {user?.kycStatus !== 'pending' && (
              <TouchableOpacity
                style={styles.kycBlockButton}
                onPress={() => router.push('/kyc')}
              >
                <Text style={styles.kycBlockButtonText}>Complete KYC</Text>
              </TouchableOpacity>
            )}
          </View>
        )}

        {isLoading ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyTitle}>Loading...</Text>
          </View>
        ) : (isTraveler && user?.kycStatus !== 'approved') ? null : (
          <>
            {/* Shipments Needing Pickup Details */}
            {isTraveler && myNeedingPickupDetails.length > 0 && (activeFilter === 'all' || activeFilter === 'confirmed') && (
              <View style={styles.sectionContainer}>
                <View style={styles.sectionHeader}>
                  <Package size={20} color={Colors.primary} />
                  <Text style={styles.sectionTitle}>Complete Pickup Details</Text>
                  <View style={[styles.sectionBadge, { backgroundColor: Colors.primaryLight + '30' }]}>
                    <Text style={[styles.sectionBadgeText, { color: Colors.primary }]}>{myNeedingPickupDetails.length}</Text>
                  </View>
                </View>
                {myNeedingPickupDetails.map((shipment) => (
                  <TouchableOpacity
                    key={shipment.id}
                    style={[styles.shipmentCard, styles.needsDetailsCard]}
                    onPress={() => router.push(`/shipment/${shipment.id}`)}
                  >
                    <View style={styles.needsDetailsBanner}>
                      <Package size={14} color={Colors.primary} />
                      <Text style={styles.needsDetailsBannerText}>Complete Pickup Details Required</Text>
                    </View>
                    <View style={styles.cardHeader}>
                      <View style={styles.shipmentId}>
                        <Text style={styles.shipmentIdText}>
                          {shipment.parcelRequestId || `#${shipment.id.slice(-6)}`}
                        </Text>
                      </View>
                      <View
                        style={[
                          styles.statusBadge,
                          { backgroundColor: Colors.primaryLight + '20' },
                        ]}
                      >
                        <Text style={[styles.statusText, { color: Colors.primary }]}>Payment Received</Text>
                      </View>
                    </View>

                    <View style={styles.routeContainer}>
                      <View style={styles.routePoint}>
                        <View style={[styles.routeDot, { backgroundColor: Colors.primary }]} />
                        <Text style={styles.routeCity}>{shipment.pickupCity}</Text>
                      </View>
                      <View style={styles.routeLine} />
                      <View style={styles.routePoint}>
                        <View style={[styles.routeDot, { backgroundColor: Colors.success }]} />
                        <Text style={styles.routeCity}>{shipment.destinationCity}</Text>
                      </View>
                    </View>

                    <View style={styles.senderInfoCard}>
                      <View style={styles.senderAvatar}>
                        <User size={16} color={Colors.textInverse} />
                      </View>
                      <View style={styles.senderDetails}>
                        <Text style={styles.senderLabel}>Sender</Text>
                        <Text style={styles.senderName}>{shipment.senderName || 'Unknown'}</Text>
                      </View>
                      {shipment.acceptedQuoteAmount && (
                        <View style={styles.earningsBox}>
                          <Text style={styles.earningsLabel}>Your Earnings</Text>
                          <Text style={styles.earningsAmount}>₹{Math.round(shipment.acceptedQuoteAmount * 0.8)}</Text>
                        </View>
                      )}
                    </View>

                    <View style={styles.cardDivider} />

                    <View style={styles.detailsRow}>
                      <View style={styles.detailItem}>
                        <Text style={styles.detailLabel}>Weight</Text>
                        <Text style={styles.detailValue}>{shipment.parcelDetails.weight} kg</Text>
                      </View>
                      <View style={styles.detailItem}>
                        <Text style={styles.detailLabel}>Category</Text>
                        <Text style={styles.detailValue}>{shipment.parcelDetails.category}</Text>
                      </View>
                      <View style={styles.detailItem}>
                        <Text style={styles.detailLabel}>Amount</Text>
                        <Text style={[styles.detailValue, { color: Colors.success }]}>
                          ₹{shipment.acceptedQuoteAmount || '-'}
                        </Text>
                      </View>
                    </View>

                    <View style={styles.cardFooter}>
                      <Text style={styles.dateText}>
                        {shipment.preferredDate || 'No date set'}
                      </Text>
                      <View style={styles.fillDetailsBtn}>
                        <Text style={styles.fillDetailsBtnText}>Fill Details</Text>
                        <ChevronRight size={16} color={Colors.textInverse} />
                      </View>
                    </View>
                  </TouchableOpacity>
                ))}
              </View>
            )}

            {/* Pending Payment Shipments Section for Travelers */}
            {isTraveler && myPendingPaymentShipments.length > 0 && (activeFilter === 'all' || activeFilter === 'payment_pending') && (
              <View style={styles.sectionContainer}>
                <View style={styles.sectionHeader}>
                  <Clock size={20} color="#F59E0B" />
                  <Text style={styles.sectionTitle}>Awaiting Payment</Text>
                  <View style={[styles.sectionBadge, { backgroundColor: '#FEF3C7' }]}>
                    <Text style={[styles.sectionBadgeText, { color: '#F59E0B' }]}>{myPendingPaymentShipments.length}</Text>
                  </View>
                </View>
                {myPendingPaymentShipments.map((shipment) => (
                  <TouchableOpacity
                    key={shipment.id}
                    style={[styles.shipmentCard, styles.pendingPaymentCard]}
                    onPress={() => router.push(`/shipment/${shipment.id}`)}
                  >
                    <View style={styles.pendingPaymentBanner}>
                      <Clock size={14} color="#F59E0B" />
                      <Text style={styles.pendingPaymentBannerText}>Waiting for Sender Payment</Text>
                    </View>
                    <View style={styles.cardHeader}>
                      <View style={styles.shipmentId}>
                        <Text style={styles.shipmentIdText}>
                          {shipment.parcelRequestId || `#${shipment.id.slice(-6)}`}
                        </Text>
                      </View>
                      <View
                        style={[
                          styles.statusBadge,
                          { backgroundColor: '#FEF3C7' },
                        ]}
                      >
                        <Text style={[styles.statusText, { color: '#F59E0B' }]}>Payment Pending</Text>
                      </View>
                    </View>

                    <View style={styles.routeContainer}>
                      <View style={styles.routePoint}>
                        <View style={[styles.routeDot, { backgroundColor: Colors.primary }]} />
                        <Text style={styles.routeCity}>{shipment.pickupCity}</Text>
                      </View>
                      <View style={styles.routeLine} />
                      <View style={styles.routePoint}>
                        <View style={[styles.routeDot, { backgroundColor: Colors.success }]} />
                        <Text style={styles.routeCity}>{shipment.destinationCity}</Text>
                      </View>
                    </View>

                    <View style={styles.senderInfoCard}>
                      <View style={styles.senderAvatar}>
                        <User size={16} color={Colors.textInverse} />
                      </View>
                      <View style={styles.senderDetails}>
                        <Text style={styles.senderLabel}>Sender</Text>
                        <Text style={styles.senderName}>{shipment.senderName || 'Unknown'}</Text>
                      </View>
                      {shipment.acceptedQuoteAmount && (
                        <View style={styles.earningsBox}>
                          <Text style={styles.earningsLabel}>Potential Earnings</Text>
                          <Text style={[styles.earningsAmount, { color: '#F59E0B' }]}>₹{Math.round(shipment.acceptedQuoteAmount * 0.8)}</Text>
                        </View>
                      )}
                    </View>

                    <View style={styles.cardDivider} />

                    <View style={styles.detailsRow}>
                      <View style={styles.detailItem}>
                        <Text style={styles.detailLabel}>Weight</Text>
                        <Text style={styles.detailValue}>{shipment.parcelDetails.weight} kg</Text>
                      </View>
                      <View style={styles.detailItem}>
                        <Text style={styles.detailLabel}>Category</Text>
                        <Text style={styles.detailValue}>{shipment.parcelDetails.category}</Text>
                      </View>
                      <View style={styles.detailItem}>
                        <Text style={styles.detailLabel}>Quote</Text>
                        <Text style={[styles.detailValue, { color: '#F59E0B' }]}>
                          ₹{shipment.acceptedQuoteAmount || '-'}
                        </Text>
                      </View>
                    </View>

                    <View style={styles.cardFooter}>
                      <Text style={styles.dateText}>
                        {shipment.preferredDate || 'No date set'}
                      </Text>
                      <View style={styles.viewDetailsBtn}>
                        <Text style={styles.viewDetailsBtnText}>View Details</Text>
                        <ChevronRight size={16} color={Colors.primary} />
                      </View>
                    </View>
                  </TouchableOpacity>
                ))}
              </View>
            )}

            {/* My Confirmed Shipments Section for Travelers */}
            {isTraveler && myConfirmedShipments.length > 0 && (activeFilter === 'all' || activeFilter === 'confirmed' || activeFilter === 'picked_up' || activeFilter === 'in_transit' || activeFilter === 'delivered') && (
              <View style={styles.sectionContainer}>
                <View style={styles.sectionHeader}>
                  <CheckCircle2 size={20} color={Colors.success} />
                  <Text style={styles.sectionTitle}>My Confirmed Shipments</Text>
                  <View style={styles.sectionBadge}>
                    <Text style={styles.sectionBadgeText}>{myConfirmedShipments.length}</Text>
                  </View>
                </View>
                {myConfirmedShipments
                  .filter(s => activeFilter === 'all' || s.status === activeFilter)
                  .map((shipment) => (
                  <TouchableOpacity
                    key={shipment.id}
                    style={[styles.shipmentCard, styles.assignedCard]}
                    onPress={() => router.push(`/shipment/${shipment.id}`)}
                  >
                    <View style={styles.assignedBanner}>
                      <CheckCircle2 size={14} color={Colors.success} />
                      <Text style={styles.assignedBannerText}>Assigned to You</Text>
                    </View>
                    <View style={styles.cardHeader}>
                      <View style={styles.shipmentId}>
                        <Text style={styles.shipmentIdText}>
                          {shipment.parcelRequestId || `#${shipment.id.slice(-6)}`}
                        </Text>
                      </View>
                      <View
                        style={[
                          styles.statusBadge,
                          { backgroundColor: getStatusColor(shipment.status) + '20' },
                        ]}
                      >
                        <Text
                          style={[
                            styles.statusText,
                            { color: getStatusColor(shipment.status) },
                          ]}
                        >
                          {formatStatus(shipment.status)}
                        </Text>
                      </View>
                    </View>

                    <View style={styles.routeContainer}>
                      <View style={styles.routePoint}>
                        <View style={[styles.routeDot, { backgroundColor: Colors.primary }]} />
                        <Text style={styles.routeCity}>{shipment.pickupCity}</Text>
                      </View>
                      <View style={styles.routeLine} />
                      <View style={styles.routePoint}>
                        <View style={[styles.routeDot, { backgroundColor: Colors.success }]} />
                        <Text style={styles.routeCity}>{shipment.destinationCity}</Text>
                      </View>
                    </View>

                    {/* Sender Info */}
                    <View style={styles.senderInfoCard}>
                      <View style={styles.senderAvatar}>
                        <User size={16} color={Colors.textInverse} />
                      </View>
                      <View style={styles.senderDetails}>
                        <Text style={styles.senderLabel}>Sender</Text>
                        <Text style={styles.senderName}>{shipment.senderName || 'Unknown'}</Text>
                      </View>
                      {shipment.acceptedQuoteAmount && (
                        <View style={styles.earningsBox}>
                          <Text style={styles.earningsLabel}>Your Earnings</Text>
                          <Text style={styles.earningsAmount}>₹{Math.round(shipment.acceptedQuoteAmount * 0.8)}</Text>
                        </View>
                      )}
                    </View>

                    <View style={styles.cardDivider} />

                    <View style={styles.detailsRow}>
                      <View style={styles.detailItem}>
                        <Text style={styles.detailLabel}>Weight</Text>
                        <Text style={styles.detailValue}>{shipment.parcelDetails.weight} kg</Text>
                      </View>
                      <View style={styles.detailItem}>
                        <Text style={styles.detailLabel}>Category</Text>
                        <Text style={styles.detailValue}>{shipment.parcelDetails.category}</Text>
                      </View>
                      <View style={styles.detailItem}>
                        <Text style={styles.detailLabel}>Amount</Text>
                        <Text style={[styles.detailValue, { color: Colors.success }]}>
                          ₹{shipment.acceptedQuoteAmount || '-'}
                        </Text>
                      </View>
                    </View>

                    <View style={styles.cardFooter}>
                      <Text style={styles.dateText}>
                        {shipment.preferredDate || 'No date set'}
                      </Text>
                      <View style={styles.viewDetailsBtn}>
                        <Text style={styles.viewDetailsBtnText}>View Details</Text>
                        <ChevronRight size={16} color={Colors.primary} />
                      </View>
                    </View>
                  </TouchableOpacity>
                ))}
                {myConfirmedShipments.filter(s => activeFilter === 'all' || s.status === activeFilter).length === 0 && (
                  <View style={styles.emptySection}>
                    <Package size={40} color={Colors.textTertiary} />
                    <Text style={styles.emptySectionText}>No confirmed shipments</Text>
                  </View>
                )}
              </View>
            )}

            {/* Available Shipments Section for Travelers */}
            {isTraveler && (activeFilter === 'all' || activeFilter === 'created' || activeFilter === 'quoted') && (
              <View style={styles.sectionContainer}>
                <View style={styles.sectionHeader}>
                  <Clock size={20} color={Colors.warning} />
                  <Text style={styles.sectionTitle}>Available for Pickup</Text>
                  <View style={[styles.sectionBadge, { backgroundColor: Colors.warningLight }]}>
                    <Text style={[styles.sectionBadgeText, { color: Colors.warning }]}>
                      {availableShipments.filter(s => activeFilter === 'all' || s.status === activeFilter).length}
                    </Text>
                  </View>
                </View>
                {availableShipments
                  .filter(s => {
                    if (activeFilter === 'all') return true;
                    return s.status === activeFilter;
                  })
                  .filter(s => {
                    if (!destinationFilter) return true;
                    return s.destinationCity.toLowerCase().includes(destinationFilter.toLowerCase()) ||
                           s.pickupCity.toLowerCase().includes(destinationFilter.toLowerCase());
                  })
                  .map((shipment) => (
                  <TouchableOpacity
                    key={shipment.id}
                    style={styles.shipmentCard}
                    onPress={() => router.push(`/shipment/${shipment.id}`)}
                  >
                    <View style={styles.cardHeader}>
                      <View style={styles.shipmentId}>
                        <Text style={styles.shipmentIdText}>
                          {shipment.parcelRequestId || `#${shipment.id.slice(-6)}`}
                        </Text>
                      </View>
                      <View
                        style={[
                          styles.statusBadge,
                          { backgroundColor: getStatusColor(shipment.status) + '20' },
                        ]}
                      >
                        <Text
                          style={[
                            styles.statusText,
                            { color: getStatusColor(shipment.status) },
                          ]}
                        >
                          {formatStatus(shipment.status)}
                        </Text>
                      </View>
                    </View>

                    <View style={styles.routeContainer}>
                      <View style={styles.routePoint}>
                        <View style={[styles.routeDot, { backgroundColor: Colors.primary }]} />
                        <Text style={styles.routeCity}>{shipment.pickupCity}</Text>
                      </View>
                      <View style={styles.routeLine} />
                      <View style={styles.routePoint}>
                        <View style={[styles.routeDot, { backgroundColor: Colors.success }]} />
                        <Text style={styles.routeCity}>{shipment.destinationCity}</Text>
                      </View>
                    </View>

                    <View style={styles.cardDivider} />

                    <View style={styles.detailsRow}>
                      <View style={styles.detailItem}>
                        <Text style={styles.detailLabel}>Weight</Text>
                        <Text style={styles.detailValue}>{shipment.parcelDetails.weight} kg</Text>
                      </View>
                      <View style={styles.detailItem}>
                        <Text style={styles.detailLabel}>Category</Text>
                        <Text style={styles.detailValue}>{shipment.parcelDetails.category}</Text>
                      </View>
                      {shipment.quotesCount > 0 && (
                        <View style={styles.detailItem}>
                          <Text style={styles.detailLabel}>Quotes</Text>
                          <Text style={[styles.detailValue, { color: Colors.primary }]}>
                            {shipment.quotesCount}
                          </Text>
                        </View>
                      )}
                    </View>

                    <View style={styles.cardFooter}>
                      <Text style={styles.dateText}>
                        {shipment.preferredDate || 'No date set'}
                      </Text>
                      <TouchableOpacity 
                        style={styles.quoteBtn}
                        onPress={() => router.push(`/submit-quote?shipmentId=${shipment.id}`)}
                      >
                        <IndianRupee size={14} color={Colors.textInverse} />
                        <Text style={styles.quoteBtnText}>Quote</Text>
                      </TouchableOpacity>
                    </View>
                  </TouchableOpacity>
                ))}
                {availableShipments.filter(s => activeFilter === 'all' || s.status === activeFilter).length === 0 && (
                  <View style={styles.emptySection}>
                    <Package size={40} color={Colors.textTertiary} />
                    <Text style={styles.emptySectionText}>No available shipments</Text>
                  </View>
                )}
              </View>
            )}

            {/* Sender Shipments */}
            {!isTraveler && (
              filteredShipments.length === 0 ? (
                <View style={styles.emptyState}>
                  <Package size={64} color={Colors.textTertiary} />
                  <Text style={styles.emptyTitle}>No shipments found</Text>
                  <Text style={styles.emptySubtitle}>
                    Create your first shipment to get started
                  </Text>
                  <TouchableOpacity
                    style={styles.createButton}
                    onPress={() => router.push('/create-shipment')}
                  >
                    <Text style={styles.createButtonText}>Create Shipment</Text>
                  </TouchableOpacity>
                </View>
              ) : (
                filteredShipments.map((shipment) => (
                  <TouchableOpacity
                    key={shipment.id}
                    style={styles.shipmentCard}
                    onPress={() => router.push(`/shipment/${shipment.id}`)}
                  >
                    <View style={styles.cardHeader}>
                      <View style={styles.shipmentId}>
                        <Text style={styles.shipmentIdText}>
                          {shipment.parcelRequestId || `#${shipment.id.slice(-6)}`}
                        </Text>
                      </View>
                      <View
                        style={[
                          styles.statusBadge,
                          { backgroundColor: getStatusColor(shipment.status) + '20' },
                        ]}
                      >
                        <Text
                          style={[
                            styles.statusText,
                            { color: getStatusColor(shipment.status) },
                          ]}
                        >
                          {formatStatus(shipment.status)}
                        </Text>
                      </View>
                    </View>

                    {/* Show Assigned Traveler for Sender */}
                    {shipment.assignedTravelerId && shipment.assignedTravelerName && (
                      <View style={styles.assignedTravelerInfo}>
                        <View style={styles.travelerAvatar}>
                          <User size={14} color={Colors.textInverse} />
                        </View>
                        <Text style={styles.assignedTravelerText}>
                          Assigned to: <Text style={styles.assignedTravelerName}>{shipment.assignedTravelerName}</Text>
                        </Text>
                      </View>
                    )}

                    <View style={styles.routeContainer}>
                      <View style={styles.routePoint}>
                        <View style={[styles.routeDot, { backgroundColor: Colors.primary }]} />
                        <Text style={styles.routeCity}>{shipment.pickupCity}</Text>
                      </View>
                      <View style={styles.routeLine} />
                      <View style={styles.routePoint}>
                        <View style={[styles.routeDot, { backgroundColor: Colors.success }]} />
                        <Text style={styles.routeCity}>{shipment.destinationCity}</Text>
                      </View>
                    </View>

                    <View style={styles.cardDivider} />

                    <View style={styles.detailsRow}>
                      <View style={styles.detailItem}>
                        <Text style={styles.detailLabel}>Weight</Text>
                        <Text style={styles.detailValue}>{shipment.parcelDetails.weight} kg</Text>
                      </View>
                      <View style={styles.detailItem}>
                        <Text style={styles.detailLabel}>Category</Text>
                        <Text style={styles.detailValue}>{shipment.parcelDetails.category}</Text>
                      </View>
                      {shipment.quotesCount > 0 && !shipment.assignedTravelerId && (
                        <View style={styles.detailItem}>
                          <Text style={styles.detailLabel}>Quotes</Text>
                          <Text style={[styles.detailValue, { color: Colors.primary }]}>
                            {shipment.quotesCount}
                          </Text>
                        </View>
                      )}
                      {shipment.acceptedQuoteAmount && (
                        <View style={styles.detailItem}>
                          <Text style={styles.detailLabel}>Amount</Text>
                          <Text style={[styles.detailValue, { color: Colors.success }]}>
                            ₹{shipment.acceptedQuoteAmount}
                          </Text>
                        </View>
                      )}
                    </View>

                    <View style={styles.cardFooter}>
                      <Text style={styles.dateText}>
                        {shipment.preferredDate || 'No date set'}
                      </Text>
                      <ChevronRight size={20} color={Colors.textTertiary} />
                    </View>
                  </TouchableOpacity>
                ))
              )
            )}
          </>
        )}
      </ScrollView>

      {/* Destination Filter Modal */}
      <Modal
        visible={showFilterModal}
        animationType="slide"
        transparent
        onRequestClose={() => setShowFilterModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Filter by Destination</Text>
              <TouchableOpacity onPress={() => setShowFilterModal(false)}>
                <X size={24} color={Colors.text} />
              </TouchableOpacity>
            </View>

            <View style={styles.searchContainer}>
              <Search size={20} color={Colors.textSecondary} />
              <TextInput
                style={styles.searchInput}
                placeholder="Search city or state..."
                placeholderTextColor={Colors.textTertiary}
                value={searchQuery}
                onChangeText={handleLocationSearch}
                autoFocus
              />
              {searchQuery.length > 0 && (
                <TouchableOpacity onPress={() => handleLocationSearch('')}>
                  <X size={18} color={Colors.textSecondary} />
                </TouchableOpacity>
              )}
            </View>

            <ScrollView style={styles.locationList} keyboardShouldPersistTaps="handled">
              {locationResults.length > 0 ? (
                locationResults.map((location) => (
                  <TouchableOpacity
                    key={location.id}
                    style={styles.locationItem}
                    onPress={() => handleSelectDestination(location)}
                  >
                    <MapPin size={18} color={Colors.primary} />
                    <View style={styles.locationTextContainer}>
                      <Text style={styles.locationName}>{location.name}</Text>
                      <Text style={styles.locationState}>{location.state}</Text>
                    </View>
                  </TouchableOpacity>
                ))
              ) : searchQuery.length >= 2 ? (
                <View style={styles.noResults}>
                  <Navigation size={48} color={Colors.textTertiary} />
                  <Text style={styles.noResultsText}>No locations found</Text>
                </View>
              ) : (
                <View style={styles.hintContainer}>
                  <Navigation size={48} color={Colors.primary} />
                  <Text style={styles.hintTitle}>Search Destinations</Text>
                  <Text style={styles.hintText}>
                    Type at least 2 characters to search for cities across India
                  </Text>
                </View>
              )}
            </ScrollView>

            {destinationFilter && (
              <TouchableOpacity
                style={styles.clearFilterButton}
                onPress={() => {
                  clearDestinationFilter();
                  setShowFilterModal(false);
                }}
              >
                <Text style={styles.clearFilterText}>Clear Filter</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
    backgroundColor: Colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '700' as const,
    color: Colors.text,
  },
  headerActions: {
    flexDirection: 'row',
    gap: 8,
  },
  iconButton: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: Colors.surfaceSecondary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  filterScroll: {
    maxHeight: 60,
    backgroundColor: Colors.surface,
  },
  filterContainer: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    gap: 8,
  },
  filterChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: Colors.surfaceSecondary,
    marginRight: 8,
  },
  filterChipActive: {
    backgroundColor: Colors.primary,
  },
  filterChipText: {
    fontSize: 14,
    fontWeight: '500' as const,
    color: Colors.textSecondary,
  },
  filterChipTextActive: {
    color: Colors.textInverse,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 100,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600' as const,
    color: Colors.text,
    marginTop: 16,
  },
  emptySubtitle: {
    fontSize: 14,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginTop: 8,
    paddingHorizontal: 40,
  },
  createButton: {
    backgroundColor: Colors.primary,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
    marginTop: 20,
  },
  createButtonText: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: Colors.textInverse,
  },
  shipmentCard: {
    backgroundColor: Colors.surface,
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  shipmentId: {
    backgroundColor: Colors.surfaceSecondary,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
  },
  shipmentIdText: {
    fontSize: 12,
    fontWeight: '600' as const,
    color: Colors.textSecondary,
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600' as const,
  },
  routeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  routePoint: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  routeDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  routeCity: {
    fontSize: 15,
    fontWeight: '600' as const,
    color: Colors.text,
  },
  routeLine: {
    flex: 1,
    height: 2,
    backgroundColor: Colors.border,
    marginHorizontal: 12,
  },
  cardDivider: {
    height: 1,
    backgroundColor: Colors.border,
    marginBottom: 12,
  },
  detailsRow: {
    flexDirection: 'row',
    gap: 20,
    marginBottom: 12,
  },
  detailItem: {},
  detailLabel: {
    fontSize: 11,
    color: Colors.textTertiary,
    marginBottom: 2,
  },
  detailValue: {
    fontSize: 14,
    fontWeight: '500' as const,
    color: Colors.text,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  dateText: {
    fontSize: 13,
    color: Colors.textSecondary,
  },
  iconButtonActive: {
    backgroundColor: Colors.primary,
  },
  filterBadgeContainer: {
    paddingHorizontal: 20,
    paddingVertical: 8,
    backgroundColor: Colors.surface,
  },
  filterBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.primaryLight + '30',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    alignSelf: 'flex-start',
    gap: 6,
  },
  filterBadgeText: {
    fontSize: 13,
    color: Colors.primary,
    fontWeight: '500' as const,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: Colors.surface,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '80%',
    minHeight: '50%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600' as const,
    color: Colors.text,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surfaceSecondary,
    margin: 16,
    borderRadius: 12,
    paddingHorizontal: 14,
    borderWidth: 1,
    borderColor: Colors.border,
    gap: 10,
  },
  searchInput: {
    flex: 1,
    paddingVertical: 14,
    fontSize: 16,
    color: Colors.text,
  },
  locationList: {
    flex: 1,
    paddingHorizontal: 16,
  },
  locationItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    gap: 12,
  },
  locationTextContainer: {
    flex: 1,
  },
  locationName: {
    fontSize: 16,
    fontWeight: '500' as const,
    color: Colors.text,
  },
  locationState: {
    fontSize: 13,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  noResults: {
    alignItems: 'center',
    padding: 32,
  },
  noResultsText: {
    fontSize: 16,
    color: Colors.textSecondary,
    marginTop: 12,
  },
  hintContainer: {
    alignItems: 'center',
    padding: 32,
  },
  hintTitle: {
    fontSize: 18,
    fontWeight: '600' as const,
    color: Colors.text,
    marginTop: 16,
  },
  hintText: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginTop: 8,
    textAlign: 'center',
    lineHeight: 20,
  },
  clearFilterButton: {
    margin: 16,
    padding: 16,
    backgroundColor: Colors.surfaceSecondary,
    borderRadius: 12,
    alignItems: 'center',
  },
  clearFilterText: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: Colors.error,
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
    width: 72,
    height: 72,
    borderRadius: 36,
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
  quoteBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.primary,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    gap: 4,
  },
  quoteBtnText: {
    fontSize: 13,
    fontWeight: '600' as const,
    color: Colors.textInverse,
  },
  sectionContainer: {
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 8,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: Colors.text,
    flex: 1,
  },
  sectionBadge: {
    backgroundColor: Colors.successLight,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  sectionBadgeText: {
    fontSize: 12,
    fontWeight: '600' as const,
    color: Colors.success,
  },
  assignedCard: {
    borderWidth: 2,
    borderColor: Colors.success + '40',
  },
  assignedBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.successLight,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    marginBottom: 12,
    alignSelf: 'flex-start',
    gap: 6,
  },
  assignedBannerText: {
    fontSize: 12,
    fontWeight: '600' as const,
    color: Colors.success,
  },
  pendingPaymentCard: {
    borderWidth: 2,
    borderColor: '#FCD34D',
  },
  pendingPaymentBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    marginBottom: 12,
    alignSelf: 'flex-start',
    gap: 6,
  },
  pendingPaymentBannerText: {
    fontSize: 12,
    fontWeight: '600' as const,
    color: '#F59E0B',
  },
  senderInfoCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surfaceSecondary,
    borderRadius: 10,
    padding: 12,
    marginTop: 12,
    marginBottom: 12,
  },
  senderAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  senderDetails: {
    flex: 1,
    marginLeft: 10,
  },
  senderLabel: {
    fontSize: 10,
    color: Colors.textTertiary,
    textTransform: 'uppercase' as const,
  },
  senderName: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: Colors.text,
  },
  earningsBox: {
    alignItems: 'flex-end',
  },
  earningsLabel: {
    fontSize: 10,
    color: Colors.textTertiary,
  },
  earningsAmount: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: Colors.success,
  },
  viewDetailsBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  viewDetailsBtnText: {
    fontSize: 13,
    fontWeight: '600' as const,
    color: Colors.primary,
  },
  needsDetailsCard: {
    borderWidth: 2,
    borderColor: Colors.primary + '40',
  },
  needsDetailsBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.primaryLight + '30',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    marginBottom: 12,
    alignSelf: 'flex-start',
    gap: 6,
  },
  needsDetailsBannerText: {
    fontSize: 12,
    fontWeight: '600' as const,
    color: Colors.primary,
  },
  fillDetailsBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.primary,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    gap: 4,
  },
  fillDetailsBtnText: {
    fontSize: 13,
    fontWeight: '600' as const,
    color: Colors.textInverse,
  },
  emptySection: {
    alignItems: 'center',
    paddingVertical: 32,
    backgroundColor: Colors.surface,
    borderRadius: 16,
  },
  emptySectionText: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginTop: 8,
  },
  assignedTravelerInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.primaryLight + '20',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    marginBottom: 12,
    gap: 8,
  },
  travelerAvatar: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  assignedTravelerText: {
    fontSize: 12,
    color: Colors.textSecondary,
  },
  assignedTravelerName: {
    fontWeight: '600' as const,
    color: Colors.primary,
  },
});
