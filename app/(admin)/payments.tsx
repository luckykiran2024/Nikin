import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { 
  Wallet,
  TrendingUp,
  ArrowUpRight,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
} from 'lucide-react-native';
import Colors from '@/constants/colors';
import { PaymentStatus } from '@/types';

interface AdminPayment {
  id: string;
  shipmentId: string;
  senderName: string;
  travelerName: string;
  totalAmount: number;
  platformFee: number;
  travelerAmount: number;
  status: PaymentStatus;
  createdAt: string;
}

const mockPayments: AdminPayment[] = [
  {
    id: 'pay_1',
    shipmentId: 'SHP-1234',
    senderName: 'Rahul Sharma',
    travelerName: 'Vikram Singh',
    totalAmount: 850,
    platformFee: 170,
    travelerAmount: 680,
    status: 'held',
    createdAt: '2026-01-14',
  },
  {
    id: 'pay_2',
    shipmentId: 'SHP-1235',
    senderName: 'Amit Kumar',
    travelerName: 'Anjali Reddy',
    totalAmount: 1200,
    platformFee: 240,
    travelerAmount: 960,
    status: 'released',
    createdAt: '2026-01-13',
  },
  {
    id: 'pay_3',
    shipmentId: 'SHP-1238',
    senderName: 'Suresh Patel',
    travelerName: 'Vikram Singh',
    totalAmount: 950,
    platformFee: 190,
    travelerAmount: 760,
    status: 'released',
    createdAt: '2026-01-10',
  },
  {
    id: 'pay_4',
    shipmentId: 'SHP-1239',
    senderName: 'Neha Gupta',
    travelerName: 'Karthik Nair',
    totalAmount: 750,
    platformFee: 150,
    travelerAmount: 600,
    status: 'initiated',
    createdAt: '2026-01-09',
  },
  {
    id: 'pay_5',
    shipmentId: 'SHP-1240',
    senderName: 'Priya Verma',
    travelerName: 'Meera Joshi',
    totalAmount: 500,
    platformFee: 100,
    travelerAmount: 400,
    status: 'failed',
    createdAt: '2026-01-08',
  },
];

const statusConfig: Record<PaymentStatus, { 
  label: string; 
  color: string; 
  bg: string; 
  icon: typeof Clock;
}> = {
  initiated: { label: 'Initiated', color: Colors.info, bg: Colors.infoLight, icon: Clock },
  held: { label: 'In Escrow', color: Colors.warning, bg: Colors.warningLight, icon: AlertCircle },
  released: { label: 'Released', color: Colors.success, bg: Colors.successLight, icon: CheckCircle },
  failed: { label: 'Failed', color: Colors.error, bg: Colors.errorLight, icon: XCircle },
  cod_pending: { label: 'COD Pending', color: '#F59E0B', bg: '#FEF3C7', icon: Clock },
};

export default function AdminPaymentsScreen() {
  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = React.useCallback(() => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 1500);
  }, []);

  const totalRevenue = mockPayments
    .filter(p => p.status === 'released')
    .reduce((acc, p) => acc + p.totalAmount, 0);
  
  const platformEarnings = mockPayments
    .filter(p => p.status === 'released')
    .reduce((acc, p) => acc + p.platformFee, 0);
  
  const heldAmount = mockPayments
    .filter(p => p.status === 'held')
    .reduce((acc, p) => acc + p.totalAmount, 0);

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['#8B5CF6', '#7C3AED']}
        style={styles.headerGradient}
      >
        <SafeAreaView edges={['top']}>
          <View style={styles.header}>
            <View style={styles.headerIcon}>
              <Wallet size={22} color="#8B5CF6" />
            </View>
            <View>
              <Text style={styles.headerTitle}>Payment Management</Text>
              <Text style={styles.headerSubtitle}>{mockPayments.length} transactions</Text>
            </View>
          </View>
        </SafeAreaView>
      </LinearGradient>

      <ScrollView
        style={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        <View style={styles.summaryCards}>
          <View style={[styles.summaryCard, { backgroundColor: '#D1FAE5' }]}>
            <View style={styles.summaryIconContainer}>
              <ArrowUpRight size={20} color={Colors.success} />
            </View>
            <Text style={styles.summaryLabel}>Total Revenue</Text>
            <Text style={[styles.summaryValue, { color: Colors.success }]}>
              ₹{totalRevenue.toLocaleString()}
            </Text>
          </View>
          <View style={[styles.summaryCard, { backgroundColor: '#EDE9FE' }]}>
            <View style={styles.summaryIconContainer}>
              <TrendingUp size={20} color="#8B5CF6" />
            </View>
            <Text style={styles.summaryLabel}>Platform Earnings</Text>
            <Text style={[styles.summaryValue, { color: '#8B5CF6' }]}>
              ₹{platformEarnings.toLocaleString()}
            </Text>
          </View>
          <View style={[styles.summaryCard, { backgroundColor: Colors.warningLight }]}>
            <View style={styles.summaryIconContainer}>
              <AlertCircle size={20} color={Colors.warning} />
            </View>
            <Text style={styles.summaryLabel}>Held in Escrow</Text>
            <Text style={[styles.summaryValue, { color: Colors.warning }]}>
              ₹{heldAmount.toLocaleString()}
            </Text>
          </View>
        </View>

        <Text style={styles.sectionTitle}>Recent Transactions</Text>

        {mockPayments.map((payment) => {
          const status = statusConfig[payment.status];
          const StatusIcon = status.icon;
          
          return (
            <TouchableOpacity key={payment.id} style={styles.paymentCard}>
              <View style={styles.cardHeader}>
                <View style={styles.shipmentInfo}>
                  <Text style={styles.shipmentId}>{payment.shipmentId}</Text>
                  <Text style={styles.dateText}>{payment.createdAt}</Text>
                </View>
                <View style={[styles.statusBadge, { backgroundColor: status.bg }]}>
                  <StatusIcon size={14} color={status.color} />
                  <Text style={[styles.statusText, { color: status.color }]}>
                    {status.label}
                  </Text>
                </View>
              </View>

              <View style={styles.partyInfo}>
                <View style={styles.partyRow}>
                  <Text style={styles.partyLabel}>Sender:</Text>
                  <Text style={styles.partyValue}>{payment.senderName}</Text>
                </View>
                <View style={styles.partyRow}>
                  <Text style={styles.partyLabel}>Traveler:</Text>
                  <Text style={styles.partyValue}>{payment.travelerName}</Text>
                </View>
              </View>

              <View style={styles.amountBreakdown}>
                <View style={styles.amountRow}>
                  <Text style={styles.amountLabel}>Total Amount</Text>
                  <Text style={styles.totalAmount}>₹{payment.totalAmount}</Text>
                </View>
                <View style={styles.amountRow}>
                  <Text style={styles.amountLabel}>Platform Fee (20%)</Text>
                  <Text style={styles.feeAmount}>₹{payment.platformFee}</Text>
                </View>
                <View style={[styles.amountRow, styles.travelerRow]}>
                  <Text style={styles.amountLabel}>Traveler Payout</Text>
                  <Text style={styles.travelerAmount}>₹{payment.travelerAmount}</Text>
                </View>
              </View>

              {payment.status === 'held' && (
                <TouchableOpacity style={styles.releaseButton}>
                  <Text style={styles.releaseButtonText}>Release Payment</Text>
                </TouchableOpacity>
              )}
            </TouchableOpacity>
          );
        })}

        <View style={{ height: 100 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  headerGradient: {
    paddingBottom: 20,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 12,
    gap: 12,
  },
  headerIcon: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: Colors.textInverse,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700' as const,
    color: Colors.textInverse,
  },
  headerSubtitle: {
    fontSize: 13,
    color: 'rgba(255, 255, 255, 0.8)',
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 16,
  },
  summaryCards: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 24,
  },
  summaryCard: {
    flex: 1,
    padding: 14,
    borderRadius: 14,
    alignItems: 'center',
  },
  summaryIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  summaryLabel: {
    fontSize: 11,
    color: Colors.textSecondary,
    marginBottom: 4,
    textAlign: 'center',
  },
  summaryValue: {
    fontSize: 16,
    fontWeight: '700' as const,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700' as const,
    color: Colors.text,
    marginBottom: 16,
  },
  paymentCard: {
    backgroundColor: Colors.surface,
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 8,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  shipmentInfo: {
    gap: 2,
  },
  shipmentId: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: Colors.text,
  },
  dateText: {
    fontSize: 12,
    color: Colors.textTertiary,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600' as const,
  },
  partyInfo: {
    marginTop: 14,
    padding: 12,
    backgroundColor: Colors.surfaceSecondary,
    borderRadius: 10,
    gap: 6,
  },
  partyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  partyLabel: {
    fontSize: 12,
    color: Colors.textSecondary,
    width: 60,
  },
  partyValue: {
    fontSize: 13,
    fontWeight: '600' as const,
    color: Colors.text,
  },
  amountBreakdown: {
    marginTop: 14,
    gap: 8,
  },
  amountRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  amountLabel: {
    fontSize: 13,
    color: Colors.textSecondary,
  },
  totalAmount: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: Colors.text,
  },
  feeAmount: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: '#8B5CF6',
  },
  travelerRow: {
    marginTop: 4,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  travelerAmount: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: Colors.success,
  },
  releaseButton: {
    marginTop: 14,
    paddingVertical: 12,
    borderRadius: 10,
    backgroundColor: Colors.success,
    alignItems: 'center',
  },
  releaseButtonText: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: Colors.textInverse,
  },
});
