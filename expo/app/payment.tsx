import React, { useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Platform,
} from 'react-native';
import { useLocalSearchParams, useRouter, Stack } from 'expo-router';
import {
  CreditCard,
  Smartphone,
  Banknote,
  CheckCircle,
  Info,
  Landmark,
  Wallet,
  Clock,
  ShieldCheck,
} from 'lucide-react-native';
import Colors from '@/constants/colors';
import { PaymentMethod } from '@/types';
import { useDataStore } from '@/contexts/DataStoreContext';
import { useAuth } from '@/contexts/AuthContext';
import { trpc } from '@/lib/trpc';
import RazorpayCheckout from '@/components/RazorpayCheckout';

const PLATFORM_COMMISSION = 0.20;

interface PaymentOption {
  id: PaymentMethod;
  name: string;
  description: string;
  icon: typeof CreditCard;
  color: string;
  tag?: string;
}

const paymentOptions: PaymentOption[] = [
  { id: 'upi', name: 'UPI', description: 'GPay, PhonePe, Paytm, BHIM & more', icon: Smartphone, color: '#5F259F', tag: 'Instant' },
  { id: 'card', name: 'Credit / Debit Card', description: 'Visa, Mastercard, RuPay, Amex', icon: CreditCard, color: '#1A73E8' },
  { id: 'netbanking', name: 'Net Banking', description: 'All major Indian banks', icon: Landmark, color: '#0E9E6E' },
  { id: 'wallet', name: 'Wallets', description: 'Paytm, Mobikwik, Freecharge, Amazon Pay', icon: Wallet, color: '#F59E0B' },
  { id: 'paylater', name: 'Pay Later', description: 'LazyPay, Simpl, ICICI PayLater', icon: Clock, color: '#8B5CF6', tag: 'No interest' },
  { id: 'emi', name: 'EMI', description: 'Card & Cardless EMI options', icon: CreditCard, color: '#EF4444' },
  { id: 'cod', name: 'Cash on Delivery', description: 'Pay the traveler on delivery', icon: Banknote, color: '#EA4335' },
];

export default function PaymentScreen() {
  const { amount, shipmentId } = useLocalSearchParams<{ amount: string; shipmentId: string }>();
  const router = useRouter();
  const { user } = useAuth();
  const { createPayment, updateShipment, getShipmentById, getPaymentByShipmentId } = useDataStore();

  const [selectedMethod, setSelectedMethod] = useState<PaymentMethod | null>(null);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [checkout, setCheckout] = useState<{
    visible: boolean;
    keyId: string;
    orderId: string;
    amountPaise: number;
    paymentId: string;
  } | null>(null);

  const shipment = shipmentId ? getShipmentById(shipmentId) : null;
  const existingPayment = shipmentId ? getPaymentByShipmentId(shipmentId) : null;
  const isAlreadyPaid = shipment?.paymentCompleted === true || existingPayment?.status === 'completed';

  const quoteAmount = parseFloat(amount || '0');
  const platformFee = Math.round(quoteAmount * PLATFORM_COMMISSION);
  const totalAmount = quoteAmount;
  const travelerAmount = quoteAmount - platformFee;

  const createOrderMutation = trpc.payments.createOrder.useMutation();
  const verifyPaymentMutation = trpc.payments.verifyPayment.useMutation();

  const prefill = useMemo(() => ({
    name: user?.name || '',
    email: user?.email || '',
    contact: user?.phone || '',
  }), [user]);

  const handlePayment = async () => {
    if (!selectedMethod) {
      Alert.alert('Select Payment Method', 'Please select a payment method to proceed.');
      return;
    }
    if (!shipmentId || !user) {
      Alert.alert('Error', 'Invalid payment request.');
      return;
    }
    if (isAlreadyPaid) {
      Alert.alert('Already Paid', `Payment for ${shipment?.parcelRequestId} is already complete.`, [
        { text: 'View Shipment', onPress: () => router.replace(`/shipment/${shipmentId}`) },
      ]);
      return;
    }

    setIsProcessing(true);
    try {
      if (selectedMethod === 'cod') {
        await createPayment({
          shipmentId,
          senderId: user.id,
          travelerId: shipment?.assignedTravelerId || '',
          amount: totalAmount,
          platformFee,
          travelerAmount,
          method: 'cod',
          status: 'pending',
          escrowHeld: false,
        });
        await updateShipment(shipmentId, {
          status: 'confirmed',
          paymentMethod: 'cod',
          paymentStatus: 'cod_pending',
          paymentCompleted: true,
        });
        setIsProcessing(false);
        Alert.alert('Order Confirmed', `Please pay ₹${totalAmount} in cash upon delivery.`, [
          { text: 'OK', onPress: () => router.replace('/(tabs)/shipments') },
        ]);
        return;
      }

      const result = await createOrderMutation.mutateAsync({
        shipmentId,
        senderId: user.id,
        travelerId: shipment?.assignedTravelerId || '',
        amount: totalAmount,
        platformFee,
        travelerAmount,
        method: selectedMethod,
      });

      if (!result.success || !('order' in result) || !result.order || !result.payment) {
        setIsProcessing(false);
        Alert.alert('Payment Error', result.error || 'Could not start payment. Try again.');
        return;
      }

      setCheckout({
        visible: true,
        keyId: result.keyId,
        orderId: result.order.id,
        amountPaise: result.order.amount,
        paymentId: result.payment.id,
      });
    } catch (error: any) {
      console.log('Payment error:', error);
      setIsProcessing(false);
      Alert.alert('Payment Failed', error?.message || 'Something went wrong. Please try again.');
    }
  };

  const handleCheckoutSuccess = async (data: {
    razorpayPaymentId: string;
    razorpayOrderId: string;
    razorpaySignature: string;
  }) => {
    if (!checkout) return;
    try {
      const verification = await verifyPaymentMutation.mutateAsync({
        paymentId: checkout.paymentId,
        razorpayOrderId: data.razorpayOrderId,
        razorpayPaymentId: data.razorpayPaymentId,
        razorpaySignature: data.razorpaySignature,
      });

      setCheckout(null);
      setIsProcessing(false);

      if (!verification.success) {
        Alert.alert('Payment Verification Failed', verification.error || 'Please contact support.');
        return;
      }

      Alert.alert(
        'Payment Successful',
        `₹${totalAmount} paid successfully. ${shipment?.assignedTravelerName || 'The traveler'} has been notified.`,
        [{ text: 'View Shipment', onPress: () => router.replace(`/shipment/${shipmentId}`) }],
      );
    } catch (error: any) {
      console.log('verify error', error);
      setCheckout(null);
      setIsProcessing(false);
      Alert.alert('Payment Error', error?.message || 'Verification failed.');
    }
  };

  const handleCheckoutDismiss = (reason?: string) => {
    console.log('Razorpay dismissed:', reason);
    setCheckout(null);
    setIsProcessing(false);
  };

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ title: 'Payment' }} />
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.amountCard}>
          <Text style={styles.amountLabel}>Total Payable</Text>
          <Text style={styles.amountValue}>₹{totalAmount}</Text>
          <View style={styles.breakdownContainer}>
            <View style={styles.breakdownRow}>
              <Text style={styles.breakdownLabel}>Quote Amount</Text>
              <Text style={styles.breakdownValue}>₹{quoteAmount}</Text>
            </View>
            <View style={styles.breakdownRow}>
              <Text style={styles.breakdownLabel}>Platform Fee (20%)</Text>
              <Text style={styles.breakdownFee}>₹{platformFee}</Text>
            </View>
            <View style={[styles.breakdownRow, styles.travelerRow]}>
              <Text style={styles.breakdownLabel}>Traveler Receives</Text>
              <Text style={styles.travelerValue}>₹{travelerAmount}</Text>
            </View>
          </View>
        </View>

        <Text style={styles.sectionTitle}>Choose Payment Method</Text>

        {paymentOptions.map((option) => {
          const Icon = option.icon;
          const isSelected = selectedMethod === option.id;
          return (
            <TouchableOpacity
              key={option.id}
              style={[styles.paymentOption, isSelected && styles.paymentOptionSelected]}
              onPress={() => setSelectedMethod(option.id)}
              testID={`pay-method-${option.id}`}
              activeOpacity={0.85}
            >
              <View style={[styles.optionIcon, { backgroundColor: option.color + '18' }]}>
                <Icon size={22} color={option.color} />
              </View>
              <View style={styles.optionInfo}>
                <View style={styles.optionNameRow}>
                  <Text style={styles.optionName}>{option.name}</Text>
                  {option.tag ? (
                    <View style={styles.tag}>
                      <Text style={styles.tagText}>{option.tag}</Text>
                    </View>
                  ) : null}
                </View>
                <Text style={styles.optionDescription}>{option.description}</Text>
              </View>
              {isSelected ? (
                <CheckCircle size={22} color={Colors.success} fill={Colors.success} />
              ) : (
                <View style={styles.radio} />
              )}
            </TouchableOpacity>
          );
        })}

        <View style={styles.securityCard}>
          <ShieldCheck size={18} color={Colors.success} />
          <Text style={styles.securityText}>
            Payments are processed securely by Razorpay. Your card and UPI details never touch our servers.
          </Text>
        </View>

        <View style={styles.infoCard}>
          <Info size={16} color={Colors.info} />
          <Text style={styles.infoText}>
            The 20% platform fee helps run support, identity checks, and safe deliveries.
          </Text>
        </View>
      </ScrollView>

      <View style={styles.footer}>
        {isAlreadyPaid ? (
          <View style={styles.alreadyPaidContainer}>
            <CheckCircle size={20} color={Colors.success} />
            <Text style={styles.alreadyPaidText}>
              Payment already completed for {shipment?.parcelRequestId}
            </Text>
          </View>
        ) : (
          <TouchableOpacity
            style={[
              styles.payButton,
              !selectedMethod && styles.payButtonDisabled,
              isProcessing && styles.payButtonProcessing,
            ]}
            onPress={handlePayment}
            disabled={!selectedMethod || isProcessing}
            testID="pay-button"
          >
            <Text style={styles.payButtonText}>
              {isProcessing ? 'Processing…' : `Pay ₹${totalAmount}`}
            </Text>
          </TouchableOpacity>
        )}
      </View>

      {checkout && selectedMethod && selectedMethod !== 'cod' ? (
        <RazorpayCheckout
          visible={checkout.visible}
          keyId={checkout.keyId}
          orderId={checkout.orderId}
          amount={checkout.amountPaise}
          name="Parcel Delivery"
          description={shipment?.parcelRequestId ? `Shipment ${shipment.parcelRequestId}` : 'Shipment payment'}
          prefill={prefill}
          method={selectedMethod}
          onSuccess={handleCheckoutSuccess}
          onDismiss={handleCheckoutDismiss}
        />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  scrollView: { flex: 1 },
  scrollContent: { padding: 20, paddingBottom: 140 },
  amountCard: {
    backgroundColor: Colors.secondary,
    borderRadius: 22,
    padding: 22,
    marginBottom: 22,
  },
  amountLabel: { fontSize: 13, color: 'rgba(255,255,255,0.75)', textAlign: 'center', letterSpacing: 0.4 },
  amountValue: {
    fontSize: 44,
    fontWeight: '800' as const,
    color: Colors.textInverse,
    textAlign: 'center',
    marginVertical: 6,
  },
  breakdownContainer: {
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderRadius: 14,
    padding: 14,
    marginTop: 14,
  },
  breakdownRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  breakdownLabel: { fontSize: 13, color: 'rgba(255,255,255,0.8)' },
  breakdownValue: { fontSize: 13, fontWeight: '600' as const, color: Colors.textInverse },
  breakdownFee: { fontSize: 13, fontWeight: '600' as const, color: '#FCD34D' },
  travelerRow: {
    marginTop: 8,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.15)',
    marginBottom: 0,
  },
  travelerValue: { fontSize: 14, fontWeight: '700' as const, color: '#86EFAC' },
  sectionTitle: { fontSize: 18, fontWeight: '700' as const, color: Colors.text, marginBottom: 14 },
  paymentOption: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderRadius: 16,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1.5,
    borderColor: Colors.border,
  },
  paymentOptionSelected: {
    borderColor: Colors.primary,
    backgroundColor: Colors.primaryLight + '30',
  },
  optionIcon: {
    width: 46,
    height: 46,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  optionInfo: { flex: 1, marginLeft: 12 },
  optionNameRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  optionName: { fontSize: 15, fontWeight: '600' as const, color: Colors.text },
  optionDescription: { fontSize: 12, color: Colors.textSecondary, marginTop: 2 },
  tag: {
    backgroundColor: Colors.successLight,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  tagText: { fontSize: 10, color: Colors.success, fontWeight: '700' as const, letterSpacing: 0.3 },
  radio: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: Colors.border,
  },
  securityCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    backgroundColor: Colors.successLight,
    borderRadius: 14,
    padding: 14,
    marginTop: 14,
  },
  securityText: { flex: 1, fontSize: 12, color: Colors.success, lineHeight: 18 },
  infoCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: Colors.infoLight,
    borderRadius: 14,
    padding: 14,
    marginTop: 10,
    gap: 10,
  },
  infoText: { flex: 1, fontSize: 12, color: Colors.info, lineHeight: 18 },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 20,
    paddingBottom: Platform.OS === 'ios' ? 34 : 20,
    backgroundColor: Colors.surface,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  payButton: {
    backgroundColor: Colors.primary,
    borderRadius: 14,
    padding: 18,
    alignItems: 'center',
  },
  payButtonDisabled: { backgroundColor: Colors.textTertiary },
  payButtonProcessing: { backgroundColor: Colors.primaryDark },
  payButtonText: { fontSize: 17, fontWeight: '700' as const, color: Colors.textInverse },
  alreadyPaidContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.successLight,
    borderRadius: 14,
    padding: 18,
    gap: 10,
  },
  alreadyPaidText: { fontSize: 15, fontWeight: '600' as const, color: Colors.success },
});
