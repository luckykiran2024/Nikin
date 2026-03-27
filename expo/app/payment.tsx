import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { useLocalSearchParams, useRouter, Stack } from 'expo-router';
import {
  CreditCard,
  Smartphone,
  Banknote,
  CheckCircle,
  Shield,
  Info,
} from 'lucide-react-native';
import Colors from '@/constants/colors';
import { PaymentMethod } from '@/types';
import { useDataStore } from '@/contexts/DataStoreContext';
import { useAuth } from '@/contexts/AuthContext';

const PLATFORM_COMMISSION = 0.20;

interface PaymentOption {
  id: PaymentMethod;
  name: string;
  description: string;
  icon: typeof CreditCard;
  color: string;
}

const paymentOptions: PaymentOption[] = [
  {
    id: 'upi',
    name: 'UPI',
    description: 'Pay using Google Pay, PhonePe, Paytm, etc.',
    icon: Smartphone,
    color: '#5F259F',
  },
  {
    id: 'credit_card',
    name: 'Credit Card',
    description: 'Visa, Mastercard, RuPay',
    icon: CreditCard,
    color: '#1A73E8',
  },
  {
    id: 'debit_card',
    name: 'Debit Card',
    description: 'All major bank cards accepted',
    icon: CreditCard,
    color: '#34A853',
  },
  {
    id: 'cod',
    name: 'Cash on Delivery',
    description: 'Pay when you receive the parcel',
    icon: Banknote,
    color: '#EA4335',
  },
];

export default function PaymentScreen() {
  const { amount, shipmentId } = useLocalSearchParams<{ amount: string; shipmentId: string }>();
  const router = useRouter();
  const { user } = useAuth();
  const { createPayment, updateShipment, getShipmentById, getPaymentByShipmentId } = useDataStore();
  const [selectedMethod, setSelectedMethod] = useState<PaymentMethod | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const shipment = shipmentId ? getShipmentById(shipmentId) : null;
  const existingPayment = shipmentId ? getPaymentByShipmentId(shipmentId) : null;
  const isAlreadyPaid = shipment?.paymentCompleted === true || existingPayment !== undefined;

  const quoteAmount = parseFloat(amount || '0');
  const platformFee = Math.round(quoteAmount * PLATFORM_COMMISSION);
  const totalAmount = quoteAmount;
  const travelerAmount = quoteAmount - platformFee;

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
      Alert.alert(
        'Payment Already Completed',
        `Payment for this shipment (${shipment?.parcelRequestId}) has already been processed. You cannot make another payment for the same parcel.`,
        [{ text: 'View Shipment', onPress: () => router.replace(`/shipment/${shipmentId}`) }]
      );
      return;
    }

    setIsProcessing(true);

    try {
      if (selectedMethod === 'cod') {
        // Create payment record for COD
        await createPayment({
          shipmentId,
          senderId: user.id,
          travelerId: shipment?.assignedTravelerId || '',
          amount: totalAmount,
          platformFee: platformFee,
          travelerAmount: travelerAmount,
          method: selectedMethod,
          status: 'pending',
          escrowHeld: false,
        });

        // Set status to confirmed for COD - traveler is now officially assigned
        await updateShipment(shipmentId, {
          status: 'confirmed',
          paymentMethod: selectedMethod,
          paymentStatus: 'cod_pending',
          paymentCompleted: true,
        });
        console.log('COD order confirmed, shipment assigned to traveler:', shipment?.assignedTravelerName);

        Alert.alert(
          'Cash on Delivery',
          'Your order has been confirmed and assigned to the traveler. Please pay ₹' + totalAmount + ' upon delivery.',
          [
            {
              text: 'OK',
              onPress: () => {
                setIsProcessing(false);
                router.replace('/(tabs)/shipments');
              },
            },
          ]
        );
        return;
      }

      // Simulate payment processing for other methods
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Create payment record
      await createPayment({
        shipmentId,
        senderId: user.id,
        travelerId: shipment?.assignedTravelerId || '',
        amount: totalAmount,
        platformFee: platformFee,
        travelerAmount: travelerAmount,
        method: selectedMethod,
        status: 'completed',
        escrowHeld: true,
      });

      // Set status to confirmed - payment completed, traveler is now officially assigned
      await updateShipment(shipmentId, {
        status: 'confirmed',
        paymentMethod: selectedMethod,
        paymentStatus: 'held',
        paymentCompleted: true,
      });
      console.log('Payment completed, shipment confirmed and assigned to traveler:', shipment?.assignedTravelerName);

      setIsProcessing(false);
      Alert.alert(
        'Payment Successful',
        `Your payment of ₹${totalAmount} has been processed successfully. The shipment is now assigned to ${shipment?.assignedTravelerName || 'the traveler'}. Amount is held in escrow until delivery.`,
        [
          {
            text: 'View Shipment',
            onPress: () => router.replace(`/shipment/${shipmentId}`),
          },
        ]
      );
    } catch (error) {
      setIsProcessing(false);
      console.log('Payment error:', error);
      Alert.alert('Payment Failed', 'Something went wrong. Please try again.');
    }
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
          <Text style={styles.amountLabel}>Total Amount</Text>
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

        <Text style={styles.sectionTitle}>Select Payment Method</Text>

        {paymentOptions.map((option) => {
          const Icon = option.icon;
          const isSelected = selectedMethod === option.id;
          
          return (
            <TouchableOpacity
              key={option.id}
              style={[
                styles.paymentOption,
                isSelected && styles.paymentOptionSelected,
              ]}
              onPress={() => setSelectedMethod(option.id)}
            >
              <View style={[styles.optionIcon, { backgroundColor: option.color + '15' }]}>
                <Icon size={24} color={option.color} />
              </View>
              <View style={styles.optionInfo}>
                <Text style={styles.optionName}>{option.name}</Text>
                <Text style={styles.optionDescription}>{option.description}</Text>
              </View>
              {isSelected && (
                <View style={styles.checkIcon}>
                  <CheckCircle size={24} color={Colors.success} fill={Colors.success} />
                </View>
              )}
            </TouchableOpacity>
          );
        })}

        <View style={styles.securityCard}>
          <View style={styles.securityHeader}>
            <Shield size={20} color={Colors.success} />
            <Text style={styles.securityTitle}>Secure Payment</Text>
          </View>
          <Text style={styles.securityText}>
            Your payment is protected by escrow. Funds will be released to the traveler only after successful delivery confirmation.
          </Text>
        </View>

        <View style={styles.infoCard}>
          <Info size={18} color={Colors.info} />
          <Text style={styles.infoText}>
            20% platform fee helps us maintain service quality, provide insurance coverage, and ensure safe deliveries.
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
          >
            <Text style={styles.payButtonText}>
              {isProcessing ? 'Processing...' : `Pay ₹${totalAmount}`}
            </Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 120,
  },
  amountCard: {
    backgroundColor: Colors.primary,
    borderRadius: 20,
    padding: 24,
    marginBottom: 24,
  },
  amountLabel: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.8)',
    textAlign: 'center',
  },
  amountValue: {
    fontSize: 42,
    fontWeight: '700' as const,
    color: Colors.textInverse,
    textAlign: 'center',
    marginVertical: 8,
  },
  breakdownContainer: {
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderRadius: 12,
    padding: 14,
    marginTop: 16,
  },
  breakdownRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  breakdownLabel: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.8)',
  },
  breakdownValue: {
    fontSize: 13,
    fontWeight: '600' as const,
    color: Colors.textInverse,
  },
  breakdownFee: {
    fontSize: 13,
    fontWeight: '600' as const,
    color: '#FCD34D',
  },
  travelerRow: {
    marginTop: 8,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.2)',
    marginBottom: 0,
  },
  travelerValue: {
    fontSize: 14,
    fontWeight: '700' as const,
    color: '#86EFAC',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600' as const,
    color: Colors.text,
    marginBottom: 16,
  },
  paymentOption: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderRadius: 14,
    padding: 16,
    marginBottom: 12,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  paymentOptionSelected: {
    borderColor: Colors.primary,
    backgroundColor: Colors.primaryLight + '10',
  },
  optionIcon: {
    width: 52,
    height: 52,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  optionInfo: {
    flex: 1,
    marginLeft: 14,
  },
  optionName: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: Colors.text,
  },
  optionDescription: {
    fontSize: 13,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  checkIcon: {
    marginLeft: 10,
  },
  securityCard: {
    backgroundColor: Colors.successLight,
    borderRadius: 14,
    padding: 16,
    marginTop: 16,
  },
  securityHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  securityTitle: {
    fontSize: 15,
    fontWeight: '600' as const,
    color: Colors.success,
  },
  securityText: {
    fontSize: 13,
    color: Colors.success,
    lineHeight: 20,
  },
  infoCard: {
    flexDirection: 'row',
    backgroundColor: Colors.infoLight,
    borderRadius: 14,
    padding: 16,
    marginTop: 12,
    gap: 12,
  },
  infoText: {
    flex: 1,
    fontSize: 13,
    color: Colors.info,
    lineHeight: 20,
  },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 20,
    paddingBottom: 34,
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
  payButtonDisabled: {
    backgroundColor: Colors.textTertiary,
  },
  payButtonProcessing: {
    backgroundColor: Colors.primaryLight,
  },
  payButtonText: {
    fontSize: 17,
    fontWeight: '600' as const,
    color: Colors.textInverse,
  },
  alreadyPaidContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.successLight,
    borderRadius: 14,
    padding: 18,
    gap: 10,
  },
  alreadyPaidText: {
    fontSize: 15,
    fontWeight: '600' as const,
    color: Colors.success,
  },
});
