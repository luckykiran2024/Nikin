import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import {
  Wallet,
  TrendingUp,
  Calendar,
  ChevronRight,
  Package,
  IndianRupee,
  Clock,
  CheckCircle,
  AlertCircle,
} from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Colors from '@/constants/colors';
import { useAuth } from '@/contexts/AuthContext';
import { useDataStore } from '@/contexts/DataStoreContext';

const months = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

export default function EarningsScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const { shipments } = useDataStore();
  const [refreshing, setRefreshing] = useState(false);
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());
  const [selectedYear] = useState(new Date().getFullYear());

  const onRefresh = () => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 1000);
  };

  const travelerShipments = useMemo(() => {
    if (!user) return [];
    return shipments.filter(s => s.assignedTravelerId === user.id);
  }, [shipments, user]);

  const monthlyEarnings = useMemo(() => {
    const earnings: Record<number, { total: number; count: number; pending: number }> = {};
    
    for (let i = 0; i < 12; i++) {
      earnings[i] = { total: 0, count: 0, pending: 0 };
    }

    travelerShipments.forEach(shipment => {
      const date = new Date(shipment.updatedAt);
      if (date.getFullYear() === selectedYear) {
        const month = date.getMonth();
        if (shipment.status === 'completed' && shipment.acceptedQuoteAmount) {
          const travelerAmount = shipment.acceptedQuoteAmount * 0.8;
          earnings[month].total += travelerAmount;
          earnings[month].count += 1;
        } else if (shipment.status === 'delivered' && shipment.acceptedQuoteAmount) {
          const travelerAmount = shipment.acceptedQuoteAmount * 0.8;
          earnings[month].pending += travelerAmount;
        }
      }
    });

    return earnings;
  }, [travelerShipments, selectedYear]);

  const currentMonthEarnings = monthlyEarnings[selectedMonth];
  
  const totalEarnings = useMemo(() => {
    return Object.values(monthlyEarnings).reduce((sum, m) => sum + m.total, 0);
  }, [monthlyEarnings]);

  const totalDeliveries = useMemo(() => {
    return Object.values(monthlyEarnings).reduce((sum, m) => sum + m.count, 0);
  }, [monthlyEarnings]);

  const selectedMonthShipments = useMemo(() => {
    return travelerShipments.filter(s => {
      const date = new Date(s.updatedAt);
      return date.getMonth() === selectedMonth && 
             date.getFullYear() === selectedYear &&
             (s.status === 'completed' || s.status === 'delivered');
    });
  }, [travelerShipments, selectedMonth, selectedYear]);

  if (!user) {
    return (
      <View style={styles.container}>
        <SafeAreaView edges={['top']} style={styles.header}>
          <Text style={styles.headerTitle}>Earnings</Text>
        </SafeAreaView>
        <View style={styles.emptyState}>
          <Wallet size={64} color={Colors.textTertiary} />
          <Text style={styles.emptyTitle}>Sign in to view earnings</Text>
        </View>
      </View>
    );
  }

  if (user.kycStatus !== 'approved') {
    return (
      <View style={styles.container}>
        <SafeAreaView edges={['top']} style={styles.header}>
          <Text style={styles.headerTitle}>Earnings</Text>
        </SafeAreaView>
        <View style={styles.kycRequired}>
          <AlertCircle size={64} color={Colors.warning} />
          <Text style={styles.kycTitle}>Complete KYC to Start Earning</Text>
          <Text style={styles.kycSubtitle}>
            You need to complete KYC verification to accept deliveries and start earning.
          </Text>
          <TouchableOpacity
            style={styles.kycButton}
            onPress={() => router.push('/kyc')}
          >
            <Text style={styles.kycButtonText}>Complete KYC</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['#10B981', '#059669']}
        style={styles.headerGradient}
      >
        <SafeAreaView edges={['top']}>
          <View style={styles.headerContent}>
            <Text style={styles.headerTitle}>Earnings</Text>
          </View>
          
          <View style={styles.earningsCard}>
            <View style={styles.earningsMain}>
              <Text style={styles.earningsLabel}>Total Earnings ({selectedYear})</Text>
              <View style={styles.earningsAmount}>
                <IndianRupee size={28} color={Colors.textInverse} />
                <Text style={styles.earningsValue}>{totalEarnings.toLocaleString()}</Text>
              </View>
            </View>
            <View style={styles.earningsStats}>
              <View style={styles.statBox}>
                <Package size={18} color="rgba(255,255,255,0.8)" />
                <Text style={styles.statValue}>{totalDeliveries}</Text>
                <Text style={styles.statLabel}>Deliveries</Text>
              </View>
              <View style={styles.statDivider} />
              <View style={styles.statBox}>
                <TrendingUp size={18} color="rgba(255,255,255,0.8)" />
                <Text style={styles.statValue}>₹{totalDeliveries > 0 ? Math.round(totalEarnings / totalDeliveries) : 0}</Text>
                <Text style={styles.statLabel}>Avg/Delivery</Text>
              </View>
            </View>
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
        <View style={styles.monthSelector}>
          <Text style={styles.sectionTitle}>Monthly Breakdown</Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.monthList}
          >
            {months.map((month, index) => (
              <TouchableOpacity
                key={month}
                style={[
                  styles.monthChip,
                  selectedMonth === index && styles.monthChipActive,
                ]}
                onPress={() => setSelectedMonth(index)}
              >
                <Text style={[
                  styles.monthChipText,
                  selectedMonth === index && styles.monthChipTextActive,
                ]}>
                  {month.slice(0, 3)}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        <View style={styles.monthSummary}>
          <View style={styles.summaryHeader}>
            <Calendar size={20} color={Colors.primary} />
            <Text style={styles.summaryTitle}>{months[selectedMonth]} {selectedYear}</Text>
          </View>
          <View style={styles.summaryContent}>
            <View style={styles.summaryItem}>
              <Text style={styles.summaryLabel}>Earned</Text>
              <Text style={styles.summaryValue}>₹{currentMonthEarnings.total.toLocaleString()}</Text>
            </View>
            <View style={styles.summaryItem}>
              <Text style={styles.summaryLabel}>Pending</Text>
              <Text style={[styles.summaryValue, { color: Colors.warning }]}>₹{currentMonthEarnings.pending.toLocaleString()}</Text>
            </View>
            <View style={styles.summaryItem}>
              <Text style={styles.summaryLabel}>Deliveries</Text>
              <Text style={styles.summaryValue}>{currentMonthEarnings.count}</Text>
            </View>
          </View>
        </View>

        <View style={styles.transactionsSection}>
          <Text style={styles.sectionTitle}>Delivery History</Text>
          {selectedMonthShipments.length === 0 ? (
            <View style={styles.emptyTransactions}>
              <Package size={40} color={Colors.textTertiary} />
              <Text style={styles.emptyTransactionsText}>No deliveries in {months[selectedMonth]}</Text>
            </View>
          ) : (
            selectedMonthShipments.map((shipment) => {
              const amount = shipment.acceptedQuoteAmount ? shipment.acceptedQuoteAmount * 0.8 : 0;
              return (
                <TouchableOpacity
                  key={shipment.id}
                  style={styles.transactionCard}
                  onPress={() => router.push(`/shipment/${shipment.id}`)}
                >
                  <View style={styles.transactionIcon}>
                    {shipment.status === 'completed' ? (
                      <CheckCircle size={24} color={Colors.success} />
                    ) : (
                      <Clock size={24} color={Colors.warning} />
                    )}
                  </View>
                  <View style={styles.transactionDetails}>
                    <Text style={styles.transactionTitle}>
                      {shipment.pickupCity} → {shipment.destinationCity}
                    </Text>
                    <Text style={styles.transactionId}>{shipment.parcelRequestId}</Text>
                    <Text style={styles.transactionDate}>
                      {new Date(shipment.updatedAt).toLocaleDateString('en-IN', {
                        day: '2-digit',
                        month: 'short',
                        year: 'numeric',
                      })}
                    </Text>
                  </View>
                  <View style={styles.transactionAmount}>
                    <Text style={[
                      styles.amountText,
                      shipment.status === 'completed' ? styles.amountCompleted : styles.amountPending
                    ]}>
                      +₹{amount.toLocaleString()}
                    </Text>
                    <Text style={styles.amountStatus}>
                      {shipment.status === 'completed' ? 'Paid' : 'Pending'}
                    </Text>
                  </View>
                  <ChevronRight size={18} color={Colors.textTertiary} />
                </TouchableOpacity>
              );
            })
          )}
        </View>

        <View style={styles.infoCard}>
          <Text style={styles.infoTitle}>How Earnings Work</Text>
          <View style={styles.infoItem}>
            <View style={styles.infoDot} />
            <Text style={styles.infoText}>You receive 80% of the agreed quote amount</Text>
          </View>
          <View style={styles.infoItem}>
            <View style={styles.infoDot} />
            <Text style={styles.infoText}>20% platform fee is deducted automatically</Text>
          </View>
          <View style={styles.infoItem}>
            <View style={styles.infoDot} />
            <Text style={styles.infoText}>Payment is released after successful delivery</Text>
          </View>
        </View>
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
    paddingHorizontal: 20,
    paddingBottom: 12,
    backgroundColor: Colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  headerGradient: {
    paddingBottom: 20,
  },
  headerContent: {
    paddingHorizontal: 20,
    paddingTop: 8,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '700' as const,
    color: Colors.textInverse,
  },
  earningsCard: {
    marginHorizontal: 20,
    marginTop: 20,
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderRadius: 16,
    padding: 20,
  },
  earningsMain: {
    marginBottom: 16,
  },
  earningsLabel: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.8)',
    marginBottom: 8,
  },
  earningsAmount: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  earningsValue: {
    fontSize: 36,
    fontWeight: '700' as const,
    color: Colors.textInverse,
  },
  earningsStats: {
    flexDirection: 'row',
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.2)',
    paddingTop: 16,
  },
  statBox: {
    flex: 1,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 18,
    fontWeight: '600' as const,
    color: Colors.textInverse,
    marginTop: 4,
  },
  statLabel: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.7)',
    marginTop: 2,
  },
  statDivider: {
    width: 1,
    backgroundColor: 'rgba(255,255,255,0.2)',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 100,
  },
  monthSelector: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600' as const,
    color: Colors.text,
    marginBottom: 12,
  },
  monthList: {
    gap: 8,
  },
  monthChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: Colors.surfaceSecondary,
  },
  monthChipActive: {
    backgroundColor: Colors.primary,
  },
  monthChipText: {
    fontSize: 14,
    fontWeight: '500' as const,
    color: Colors.textSecondary,
  },
  monthChipTextActive: {
    color: Colors.textInverse,
  },
  monthSummary: {
    backgroundColor: Colors.surface,
    borderRadius: 16,
    padding: 16,
    marginBottom: 20,
  },
  summaryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 16,
  },
  summaryTitle: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: Colors.text,
  },
  summaryContent: {
    flexDirection: 'row',
  },
  summaryItem: {
    flex: 1,
    alignItems: 'center',
  },
  summaryLabel: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginBottom: 4,
  },
  summaryValue: {
    fontSize: 18,
    fontWeight: '600' as const,
    color: Colors.text,
  },
  transactionsSection: {
    marginBottom: 20,
  },
  emptyTransactions: {
    alignItems: 'center',
    padding: 32,
    backgroundColor: Colors.surface,
    borderRadius: 16,
  },
  emptyTransactionsText: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginTop: 12,
  },
  transactionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
  },
  transactionIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: Colors.surfaceSecondary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  transactionDetails: {
    flex: 1,
  },
  transactionTitle: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: Colors.text,
  },
  transactionId: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  transactionDate: {
    fontSize: 11,
    color: Colors.textTertiary,
    marginTop: 2,
  },
  transactionAmount: {
    alignItems: 'flex-end',
    marginRight: 8,
  },
  amountText: {
    fontSize: 15,
    fontWeight: '600' as const,
  },
  amountCompleted: {
    color: Colors.success,
  },
  amountPending: {
    color: Colors.warning,
  },
  amountStatus: {
    fontSize: 11,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  infoCard: {
    backgroundColor: Colors.infoLight,
    borderRadius: 16,
    padding: 16,
  },
  infoTitle: {
    fontSize: 15,
    fontWeight: '600' as const,
    color: Colors.info,
    marginBottom: 12,
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    marginBottom: 8,
  },
  infoDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: Colors.info,
    marginTop: 6,
  },
  infoText: {
    flex: 1,
    fontSize: 13,
    color: Colors.info,
    lineHeight: 20,
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600' as const,
    color: Colors.text,
    marginTop: 16,
  },
  kycRequired: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  kycTitle: {
    fontSize: 20,
    fontWeight: '700' as const,
    color: Colors.text,
    marginTop: 20,
    marginBottom: 12,
    textAlign: 'center',
  },
  kycSubtitle: {
    fontSize: 14,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 20,
  },
  kycButton: {
    backgroundColor: Colors.primary,
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 12,
  },
  kycButtonText: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: Colors.textInverse,
  },
});
