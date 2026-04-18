import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import {
  Package,
  ChevronRight,
  User,
  Star,
  Clock,
  CheckCircle,
  XCircle,
  MessageSquare,
  Sparkles,
} from 'lucide-react-native';
import Colors from '@/constants/colors';
import { useAuth } from '@/contexts/AuthContext';
import { useDataStore } from '@/contexts/DataStoreContext';
import { Quote, Shipment } from '@/types';

interface QuotationGroup {
  shipment: Shipment;
  quotes: Quote[];
}

export default function QuotationsScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const { shipments, quotes, acceptQuote, createConversation } = useDataStore();
  const [refreshing, setRefreshing] = useState(false);
  const [acceptingQuoteId, setAcceptingQuoteId] = useState<string | null>(null);

  const quotationGroups = useMemo(() => {
    if (!user) return [];

    const userShipments = shipments.filter(s => s.senderId === user.id);
    const groups: QuotationGroup[] = [];

    userShipments.forEach(shipment => {
      const shipmentQuotes = quotes.filter(q => q.shipmentId === shipment.id);
      if (shipmentQuotes.length > 0) {
        groups.push({ shipment, quotes: shipmentQuotes });
      }
    });

    return groups.sort((a, b) => 
      new Date(b.shipment.updatedAt).getTime() - new Date(a.shipment.updatedAt).getTime()
    );
  }, [shipments, quotes, user]);

  const onRefresh = () => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 1000);
  };

  const handleAcceptQuote = async (quote: Quote, shipment: Shipment) => {
    Alert.alert(
      'Accept Quote',
      `Accept quote of ₹${quote.amount} from ${quote.travelerName}?\n\nEstimated delivery: ${formatDate(quote.estimatedDelivery)}\n\nThe traveler must confirm the job within 15 minutes before payment.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Accept Quote',
          onPress: async () => {
            setAcceptingQuoteId(quote.id);
            try {
              await acceptQuote(quote.id, createConversation);
              Alert.alert(
                'Quote Accepted',
                'Waiting for the traveler to confirm. You\u2019ll be notified to pay once they accept.',
                [{ text: 'OK', onPress: () => router.push(`/shipment/${shipment.id}` as any) }]
              );
            } catch {
              Alert.alert('Error', 'Failed to accept quote. Please try again.');
            } finally {
              setAcceptingQuoteId(null);
            }
          },
        },
      ]
    );
  };

  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  };

  const getQuoteStatusColor = (status: string): string => {
    const colors: Record<string, string> = {
      pending: Colors.warning,
      accepted: Colors.success,
      rejected: Colors.error,
      expired: Colors.textTertiary,
    };
    return colors[status] || Colors.textSecondary;
  };

  const getQuoteStatusIcon = (status: string) => {
    switch (status) {
      case 'accepted':
        return <CheckCircle size={16} color={Colors.success} />;
      case 'rejected':
        return <XCircle size={16} color={Colors.error} />;
      default:
        return <Clock size={16} color={Colors.warning} />;
    }
  };

  if (!user || user.activeRole === 'traveler') {
    return (
      <View style={styles.container}>
        <View style={styles.emptyState}>
          <Package size={64} color={Colors.textTertiary} />
          <Text style={styles.emptyTitle}>Not Available</Text>
          <Text style={styles.emptySubtitle}>
            Quotations are only available for senders
          </Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>My Quotations</Text>
        <View style={styles.headerBadge}>
          <Text style={styles.headerBadgeText}>
            {quotationGroups.reduce((acc, g) => acc + g.quotes.filter(q => q.status === 'pending').length, 0)} pending
          </Text>
        </View>
      </View>

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
        {quotationGroups.length === 0 ? (
          <View style={styles.emptyState}>
            <MessageSquare size={64} color={Colors.textTertiary} />
            <Text style={styles.emptyTitle}>No Quotations Yet</Text>
            <Text style={styles.emptySubtitle}>
              Create a shipment and travelers will send you quotes
            </Text>
            <TouchableOpacity
              style={styles.createButton}
              onPress={() => router.push('/create-shipment')}
            >
              <Text style={styles.createButtonText}>Create Shipment</Text>
            </TouchableOpacity>
          </View>
        ) : (
          quotationGroups.map((group) => (
            <View key={group.shipment.id} style={styles.groupCard}>
              <TouchableOpacity
                style={styles.shipmentHeader}
                onPress={() => router.push(`/shipment/${group.shipment.id}`)}
              >
                <View style={styles.shipmentInfo}>
                  <View style={styles.parcelIdBadge}>
                    <Text style={styles.parcelIdText}>
                      {group.shipment.parcelRequestId}
                    </Text>
                  </View>
                  <View style={styles.routeInfo}>
                    <View style={styles.routeDot} />
                    <Text style={styles.cityText}>{group.shipment.pickupCity}</Text>
                    <View style={styles.routeLine} />
                    <View style={[styles.routeDot, { backgroundColor: Colors.success }]} />
                    <Text style={styles.cityText}>{group.shipment.destinationCity}</Text>
                  </View>
                </View>
                <ChevronRight size={20} color={Colors.textTertiary} />
              </TouchableOpacity>

              <View style={styles.shipmentDetails}>
                <View style={styles.detailItem}>
                  <Text style={styles.detailLabel}>Weight</Text>
                  <Text style={styles.detailValue}>{group.shipment.parcelDetails.weight} kg</Text>
                </View>
                <View style={styles.detailItem}>
                  <Text style={styles.detailLabel}>Category</Text>
                  <Text style={styles.detailValue}>{group.shipment.parcelDetails.category}</Text>
                </View>
                <View style={styles.detailItem}>
                  <Text style={styles.detailLabel}>Delivery By</Text>
                  <Text style={styles.detailValue}>{formatDate(group.shipment.preferredDate)}</Text>
                </View>
              </View>

              <TouchableOpacity
                style={styles.bestMatchCta}
                onPress={() => router.push(`/match/${group.shipment.id}` as any)}
                testID={`best-matches-${group.shipment.id}`}
              >
                <Sparkles size={16} color={Colors.accent} />
                <Text style={styles.bestMatchText}>View AI Best Matches</Text>
                <ChevronRight size={16} color={Colors.accent} />
              </TouchableOpacity>

              <View style={styles.quotesSection}>
                <Text style={styles.quotesSectionTitle}>
                  {group.quotes.length} Quote{group.quotes.length !== 1 ? 's' : ''} Received
                </Text>

                {group.quotes.map((quote) => (
                  <View key={quote.id} style={styles.quoteCard}>
                    <View style={styles.quoteHeader}>
                      <View style={styles.travelerInfo}>
                        <View style={styles.travelerAvatar}>
                          <User size={20} color={Colors.textInverse} />
                        </View>
                        <View>
                          <Text style={styles.travelerName}>{quote.travelerName}</Text>
                          <View style={styles.travelerMeta}>
                            <Star size={12} color={Colors.warning} fill={Colors.warning} />
                            <Text style={styles.travelerRating}>
                              {quote.travelerRating.toFixed(1)}
                            </Text>
                            <Text style={styles.travelerDeliveries}>
                              • {quote.travelerDeliveries} deliveries
                            </Text>
                          </View>
                        </View>
                      </View>
                      <View style={[styles.quoteStatusBadge, { backgroundColor: getQuoteStatusColor(quote.status) + '20' }]}>
                        {getQuoteStatusIcon(quote.status)}
                        <Text style={[styles.quoteStatusText, { color: getQuoteStatusColor(quote.status) }]}>
                          {quote.status.charAt(0).toUpperCase() + quote.status.slice(1)}
                        </Text>
                      </View>
                    </View>

                    <View style={styles.quoteDetails}>
                      <View style={styles.quoteAmount}>
                        <Text style={styles.quoteAmountLabel}>Quote Amount</Text>
                        <Text style={styles.quoteAmountValue}>₹{quote.amount}</Text>
                      </View>
                      <View style={styles.quoteEta}>
                        <Text style={styles.quoteEtaLabel}>Estimated Delivery</Text>
                        <Text style={styles.quoteEtaValue}>{formatDate(quote.estimatedDelivery)}</Text>
                      </View>
                    </View>

                    {quote.message && (
                      <View style={styles.quoteMessage}>
                        <Text style={styles.quoteMessageText}>&ldquo;{quote.message}&rdquo;</Text>
                      </View>
                    )}

                    {quote.status === 'pending' && group.shipment.status !== 'assigned' && group.shipment.status !== 'pending_acceptance' && (
                      <TouchableOpacity
                        style={[styles.acceptButton, acceptingQuoteId === quote.id && styles.acceptButtonDisabled]}
                        onPress={() => handleAcceptQuote(quote, group.shipment)}
                        disabled={acceptingQuoteId === quote.id}
                      >
                        {acceptingQuoteId === quote.id ? (
                          <ActivityIndicator size="small" color={Colors.textInverse} />
                        ) : (
                          <>
                            <CheckCircle size={18} color={Colors.textInverse} />
                            <Text style={styles.acceptButtonText}>Accept & Proceed to Pay</Text>
                          </>
                        )}
                      </TouchableOpacity>
                    )}

                    {quote.status === 'accepted' && (
                      <View style={styles.acceptedBanner}>
                        <CheckCircle size={18} color={Colors.success} />
                        <Text style={styles.acceptedBannerText}>Quote Accepted</Text>
                      </View>
                    )}
                  </View>
                ))}
              </View>
            </View>
          ))
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
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 16,
    backgroundColor: Colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '700' as const,
    color: Colors.text,
  },
  headerBadge: {
    backgroundColor: Colors.warningLight,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  headerBadgeText: {
    fontSize: 13,
    fontWeight: '600' as const,
    color: Colors.warning,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 100,
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 80,
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
  groupCard: {
    backgroundColor: Colors.surface,
    borderRadius: 16,
    marginBottom: 20,
    overflow: 'hidden',
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 2,
  },
  shipmentHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    backgroundColor: Colors.primaryLight + '10',
  },
  shipmentInfo: {
    flex: 1,
  },
  parcelIdBadge: {
    backgroundColor: Colors.primary,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
    alignSelf: 'flex-start',
    marginBottom: 10,
  },
  parcelIdText: {
    fontSize: 12,
    fontWeight: '600' as const,
    color: Colors.textInverse,
  },
  routeInfo: {
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
    maxWidth: 60,
  },
  cityText: {
    fontSize: 14,
    fontWeight: '500' as const,
    color: Colors.text,
    marginLeft: 8,
  },
  shipmentDetails: {
    flexDirection: 'row',
    padding: 12,
    backgroundColor: Colors.surfaceSecondary,
  },
  detailItem: {
    flex: 1,
    alignItems: 'center',
  },
  detailLabel: {
    fontSize: 11,
    color: Colors.textTertiary,
    marginBottom: 2,
  },
  detailValue: {
    fontSize: 13,
    fontWeight: '500' as const,
    color: Colors.text,
  },
  quotesSection: {
    padding: 16,
  },
  quotesSectionTitle: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: Colors.textSecondary,
    marginBottom: 12,
  },
  quoteCard: {
    backgroundColor: Colors.surfaceSecondary,
    borderRadius: 12,
    padding: 14,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  quoteHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  travelerInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  travelerAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  travelerName: {
    fontSize: 15,
    fontWeight: '600' as const,
    color: Colors.text,
  },
  travelerMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
    gap: 4,
  },
  travelerRating: {
    fontSize: 12,
    fontWeight: '500' as const,
    color: Colors.text,
  },
  travelerDeliveries: {
    fontSize: 12,
    color: Colors.textSecondary,
  },
  quoteStatusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    gap: 4,
  },
  quoteStatusText: {
    fontSize: 11,
    fontWeight: '600' as const,
  },
  quoteDetails: {
    flexDirection: 'row',
    backgroundColor: Colors.surface,
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
  },
  quoteAmount: {
    flex: 1,
    borderRightWidth: 1,
    borderRightColor: Colors.border,
  },
  quoteAmountLabel: {
    fontSize: 11,
    color: Colors.textTertiary,
  },
  quoteAmountValue: {
    fontSize: 20,
    fontWeight: '700' as const,
    color: Colors.primary,
    marginTop: 2,
  },
  quoteEta: {
    flex: 1,
    paddingLeft: 12,
  },
  quoteEtaLabel: {
    fontSize: 11,
    color: Colors.textTertiary,
  },
  quoteEtaValue: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: Colors.text,
    marginTop: 2,
  },
  quoteMessage: {
    backgroundColor: Colors.surface,
    borderRadius: 8,
    padding: 10,
    marginBottom: 12,
    borderLeftWidth: 3,
    borderLeftColor: Colors.primary,
  },
  quoteMessageText: {
    fontSize: 13,
    color: Colors.textSecondary,
    fontStyle: 'italic',
  },
  acceptButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.success,
    borderRadius: 10,
    padding: 14,
    gap: 8,
  },
  acceptButtonDisabled: {
    opacity: 0.7,
  },
  acceptButtonText: {
    fontSize: 15,
    fontWeight: '600' as const,
    color: Colors.textInverse,
  },
  acceptedBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.successLight,
    borderRadius: 10,
    padding: 12,
    gap: 8,
  },
  acceptedBannerText: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: Colors.success,
  },
  bestMatchCta: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: Colors.secondary,
    paddingVertical: 12,
    marginHorizontal: 16,
    marginTop: 12,
    borderRadius: 12,
  },
  bestMatchText: {
    color: Colors.textInverse,
    fontWeight: '700' as const,
    fontSize: 14,
  },
});
