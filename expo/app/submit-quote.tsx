import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native';
import { useLocalSearchParams, useRouter, Stack } from 'expo-router';
import { IndianRupee, Calendar, MessageSquare, Bike, Hand, Package } from 'lucide-react-native';
import Colors from '@/constants/colors';
import { useDataStore } from '@/contexts/DataStoreContext';
import { useAuth } from '@/contexts/AuthContext';

type CollectionMethod = 'rapido' | 'in_hand' | 'third_party';

const collectionMethods: { id: CollectionMethod; label: string; description: string; icon: typeof Bike }[] = [
  { id: 'in_hand', label: 'In-Hand', description: 'Collect directly from sender', icon: Hand },
  { id: 'rapido', label: 'Rapido/Delivery', description: 'Via Rapido, Porter, etc.', icon: Bike },
  { id: 'third_party', label: 'Third Party', description: 'Through courier/logistics', icon: Package },
];

export default function SubmitQuoteScreen() {
  const { shipmentId } = useLocalSearchParams<{ shipmentId: string }>();
  const router = useRouter();
  const { user } = useAuth();
  const { getShipmentById, createQuote } = useDataStore();
  const [amount, setAmount] = useState('');
  const [estimatedDelivery, setEstimatedDelivery] = useState('');
  const [message, setMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [collectionMethod, setCollectionMethod] = useState<CollectionMethod>('in_hand');

  const shipment = getShipmentById(shipmentId || '');

  if (!user || user.kycStatus !== 'approved') {
    return (
      <View style={styles.container}>
        <Stack.Screen options={{ title: 'Submit Quote' }} />
        <View style={styles.kycRequired}>
          <Text style={styles.kycTitle}>KYC Verification Required</Text>
          <Text style={styles.kycSubtitle}>
            You need to complete KYC verification before submitting quotes.
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

  const handleSubmit = async () => {
    if (!amount || !estimatedDelivery) {
      Alert.alert('Missing Information', 'Please fill in amount and estimated delivery date');
      return;
    }

    if (!user || !shipmentId) {
      Alert.alert('Error', 'Unable to submit quote. Please try again.');
      return;
    }

    setIsSubmitting(true);
    try {
      await createQuote({
        shipmentId: shipmentId,
        travelerId: user.id,
        travelerName: user.name,
        travelerRating: user.rating,
        travelerDeliveries: user.totalDeliveries,
        amount: parseInt(amount, 10),
        estimatedDelivery,
        message: message || undefined,
      });

      Alert.alert(
        'Quote Submitted',
        'Your quote has been submitted successfully.',
        [{ text: 'OK', onPress: () => router.back() }]
      );
    } catch (error) {
      console.log('Error submitting quote:', error);
      Alert.alert('Error', 'Failed to submit quote. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const suggestedPrice = 500;

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <Stack.Screen options={{ title: 'Submit Quote' }} />
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {shipment && (
          <View style={styles.shipmentSummary}>
            <Text style={styles.summaryTitle}>Shipment Summary</Text>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Route</Text>
              <Text style={styles.summaryValue}>
                {shipment.pickupCity} → {shipment.destinationCity}
              </Text>
            </View>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Parcel</Text>
              <Text style={styles.summaryValue} numberOfLines={1}>
                {shipment.parcelDetails.description}
              </Text>
            </View>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Weight</Text>
              <Text style={styles.summaryValue}>{shipment.parcelDetails.weight} kg</Text>
            </View>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Preferred Date</Text>
              <Text style={styles.summaryValue}>{shipment.preferredDate}</Text>
            </View>
          </View>
        )}

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Your Quote</Text>

          <Text style={styles.label}>Quote Amount (₹) *</Text>
          <View style={styles.inputContainer}>
            <IndianRupee size={20} color={Colors.primary} />
            <TextInput
              style={styles.textInput}
              placeholder="Enter your price"
              placeholderTextColor={Colors.textTertiary}
              value={amount}
              onChangeText={setAmount}
              keyboardType="number-pad"
            />
          </View>
          <View style={styles.suggestionContainer}>
            <Text style={styles.suggestionText}>Suggested: ₹{suggestedPrice}</Text>
            <TouchableOpacity onPress={() => setAmount(suggestedPrice.toString())}>
              <Text style={styles.useButton}>Use</Text>
            </TouchableOpacity>
          </View>

          <Text style={styles.label}>Estimated Delivery Date *</Text>
          <View style={styles.inputContainer}>
            <Calendar size={20} color={Colors.primary} />
            <TextInput
              style={styles.textInput}
              placeholder="YYYY-MM-DD"
              placeholderTextColor={Colors.textTertiary}
              value={estimatedDelivery}
              onChangeText={setEstimatedDelivery}
            />
          </View>

          <Text style={styles.label}>How will you collect the parcel? *</Text>
          <View style={styles.collectionMethodsContainer}>
            {collectionMethods.map((method) => {
              const IconComponent = method.icon;
              const isSelected = collectionMethod === method.id;
              return (
                <TouchableOpacity
                  key={method.id}
                  style={[
                    styles.collectionMethodCard,
                    isSelected && styles.collectionMethodCardSelected,
                  ]}
                  onPress={() => setCollectionMethod(method.id)}
                >
                  <View style={[
                    styles.collectionMethodIcon,
                    isSelected && styles.collectionMethodIconSelected,
                  ]}>
                    <IconComponent size={20} color={isSelected ? Colors.textInverse : Colors.primary} />
                  </View>
                  <Text style={[
                    styles.collectionMethodLabel,
                    isSelected && styles.collectionMethodLabelSelected,
                  ]}>
                    {method.label}
                  </Text>
                  <Text style={styles.collectionMethodDesc}>{method.description}</Text>
                  <View style={[
                    styles.radioOuter,
                    isSelected && styles.radioOuterSelected,
                  ]}>
                    {isSelected && <View style={styles.radioInner} />}
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>

          <Text style={styles.label}>Message to Sender (Optional)</Text>
          <View style={[styles.inputContainer, styles.messageInput]}>
            <MessageSquare size={20} color={Colors.primary} style={{ alignSelf: 'flex-start', marginTop: 2 }} />
            <TextInput
              style={[styles.textInput, styles.textArea]}
              placeholder="Add details about pickup timing, travel mode, etc."
              placeholderTextColor={Colors.textTertiary}
              value={message}
              onChangeText={setMessage}
              multiline
              numberOfLines={4}
            />
          </View>
        </View>

        <View style={styles.infoCard}>
          <Text style={styles.infoTitle}>How Quotes Work</Text>
          <Text style={styles.infoItem}>• Sender can see and compare all quotes</Text>
          <Text style={styles.infoItem}>• Once accepted, you will be notified</Text>
          <Text style={styles.infoItem}>• Sender pays online via Razorpay (UPI, card, netbanking, wallet, pay-later)</Text>
          <Text style={styles.infoItem}>• You receive your payout after successful delivery</Text>
        </View>

        <TouchableOpacity 
          style={[styles.submitButton, isSubmitting && styles.submitButtonDisabled]} 
          onPress={handleSubmit}
          disabled={isSubmitting}
        >
          <Text style={styles.submitButtonText}>
            {isSubmitting ? 'Submitting...' : 'Submit Quote'}
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
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
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
  },
  shipmentSummary: {
    backgroundColor: Colors.primaryLight + '15',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    borderLeftWidth: 4,
    borderLeftColor: Colors.primary,
  },
  summaryTitle: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: Colors.primary,
    marginBottom: 12,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  summaryLabel: {
    fontSize: 14,
    color: Colors.textSecondary,
  },
  summaryValue: {
    fontSize: 14,
    fontWeight: '500' as const,
    color: Colors.text,
    flex: 1,
    textAlign: 'right',
    marginLeft: 16,
  },
  section: {
    backgroundColor: Colors.surface,
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600' as const,
    color: Colors.text,
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '500' as const,
    color: Colors.textSecondary,
    marginBottom: 8,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surfaceSecondary,
    borderRadius: 12,
    paddingHorizontal: 14,
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: 8,
    gap: 10,
  },
  messageInput: {
    alignItems: 'flex-start',
    paddingVertical: 10,
  },
  textInput: {
    flex: 1,
    fontSize: 16,
    color: Colors.text,
    paddingVertical: 14,
  },
  textArea: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  suggestionContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  suggestionText: {
    fontSize: 13,
    color: Colors.textSecondary,
  },
  useButton: {
    fontSize: 13,
    fontWeight: '600' as const,
    color: Colors.primary,
  },
  infoCard: {
    backgroundColor: Colors.infoLight,
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
  },
  infoTitle: {
    fontSize: 15,
    fontWeight: '600' as const,
    color: Colors.info,
    marginBottom: 10,
  },
  infoItem: {
    fontSize: 13,
    color: Colors.info,
    lineHeight: 22,
  },
  submitButton: {
    backgroundColor: Colors.primary,
    borderRadius: 14,
    padding: 18,
    alignItems: 'center',
  },
  submitButtonText: {
    fontSize: 17,
    fontWeight: '600' as const,
    color: Colors.textInverse,
  },
  submitButtonDisabled: {
    opacity: 0.6,
  },
  collectionMethodsContainer: {
    gap: 10,
    marginBottom: 16,
  },
  collectionMethodCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surfaceSecondary,
    borderRadius: 12,
    padding: 14,
    borderWidth: 2,
    borderColor: 'transparent',
    gap: 12,
  },
  collectionMethodCardSelected: {
    borderColor: Colors.primary,
    backgroundColor: Colors.primaryLight + '15',
  },
  collectionMethodIcon: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: Colors.primaryLight + '30',
    justifyContent: 'center',
    alignItems: 'center',
  },
  collectionMethodIconSelected: {
    backgroundColor: Colors.primary,
  },
  collectionMethodLabel: {
    fontSize: 15,
    fontWeight: '600' as const,
    color: Colors.text,
    flex: 1,
  },
  collectionMethodLabelSelected: {
    color: Colors.primary,
  },
  collectionMethodDesc: {
    fontSize: 11,
    color: Colors.textSecondary,
    position: 'absolute',
    left: 66,
    bottom: 10,
  },
  radioOuter: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: Colors.border,
    justifyContent: 'center',
    alignItems: 'center',
  },
  radioOuterSelected: {
    borderColor: Colors.primary,
  },
  radioInner: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: Colors.primary,
  },
});
