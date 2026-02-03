import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Image,
  Modal,
  TextInput,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { useLocalSearchParams, useRouter, Stack } from 'expo-router';
import {
  Package,
  User,
  Phone,
  Calendar,
  Star,
  Check,
  Clock,
  Truck,
  CheckCircle,
  Camera,
  X,
  MapPin,
  MessageCircle,
  Key,
  Shield,
  IndianRupee,
  Image as ImageIcon,
  AlertCircle,
  Car,
  Train,
  Bus,
  ChevronDown,
  Navigation,
  Gift,
} from 'lucide-react-native';
import Colors from '@/constants/colors';
import { useAuth } from '@/contexts/AuthContext';
import { useDataStore } from '@/contexts/DataStoreContext';

const statusSteps = [
  { key: 'created', label: 'Created', icon: Package },
  { key: 'quoted', label: 'Quoted', icon: Clock },
  { key: 'assigned', label: 'Assigned', icon: User },
  { key: 'picked_up', label: 'Picked Up', icon: Check },
  { key: 'in_transit', label: 'In Transit', icon: Truck },
  { key: 'out_for_delivery', label: 'Out for Delivery', icon: Navigation },
  { key: 'delivered', label: 'Delivered', icon: CheckCircle },
];

export default function ShipmentDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { user } = useAuth();
  const { 
    getShipmentById, 
    getQuotesForShipment, 
    acceptQuote, 
    createConversation,
    verifyPickupOTP,
    verifyDeliveryOTP,
    updateShipment,
    markOutForDelivery,
  } = useDataStore();

  const [selectedQuote, setSelectedQuote] = useState<string | null>(null);
  const [pickupImages, setPickupImages] = useState<string[]>([]);
  const [showImageModal, setShowImageModal] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [showOTPModal, setShowOTPModal] = useState(false);
  const [otpType, setOtpType] = useState<'pickup' | 'delivery'>('pickup');
  const [otpInput, setOtpInput] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);
  const [travelerTravelMode, setTravelerTravelMode] = useState<string>('');
  const [travelerDeliveryDate, setTravelerDeliveryDate] = useState<string>('');
  const [travelerParcelImage, setTravelerParcelImage] = useState<string>('');
  const [showTravelModeModal, setShowTravelModeModal] = useState(false);
  const [deliveryImages, setDeliveryImages] = useState<string[]>([]);
  const [isMarkingOutForDelivery, setIsMarkingOutForDelivery] = useState(false);

  const shipment = getShipmentById(id || '');
  const quotes = getQuotesForShipment(id || '');
  const isTraveler = user?.activeRole === 'traveler';
  const isSender = user?.activeRole === 'sender';

  if (!shipment) {
    return (
      <View style={styles.container}>
        <Stack.Screen options={{ title: 'Shipment Details' }} />
        <View style={styles.notFound}>
          <Package size={64} color={Colors.textTertiary} />
          <Text style={styles.notFoundText}>Shipment not found</Text>
        </View>
      </View>
    );
  }

  const currentStepIndex = statusSteps.findIndex(s => s.key === shipment.status);

  const handleAcceptQuote = async (quoteId: string) => {
    const quote = quotes.find(q => q.id === quoteId);
    if (!quote) return;

    Alert.alert(
      'Accept Quote',
      `Accept quote of ₹${quote.amount} from ${quote.travelerName}? You will be redirected to payment.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Accept & Pay',
          onPress: async () => {
            await acceptQuote(quoteId, createConversation);
            router.push(`/payment?amount=${quote.amount}&shipmentId=${shipment.id}` as any);
          },
        },
      ]
    );
  };

  const handleSubmitQuote = () => {
    router.push(`/submit-quote?shipmentId=${id}` as any);
  };

  const handleOpenOTPModal = (type: 'pickup' | 'delivery') => {
    setOtpType(type);
    setOtpInput('');
    setShowOTPModal(true);
  };

  const handleVerifyOTP = async () => {
    if (otpInput.length !== 4) {
      Alert.alert('Invalid OTP', 'Please enter a 4-digit OTP');
      return;
    }

    setIsVerifying(true);
    try {
      let success = false;
      if (otpType === 'pickup') {
        success = await verifyPickupOTP(shipment.id, otpInput);
      } else {
        success = await verifyDeliveryOTP(shipment.id, otpInput, deliveryImages);
      }

      if (success) {
        setShowOTPModal(false);
        setDeliveryImages([]);
        Alert.alert(
          'Success',
          otpType === 'pickup' 
            ? 'Pickup verified! You can now start the delivery.' 
            : 'Delivery confirmed! Payment will be released to your account.'
        );
      } else {
        Alert.alert('Invalid OTP', 'The OTP you entered is incorrect. Please try again.');
      }
    } catch {
      Alert.alert('Error', 'Failed to verify OTP. Please try again.');
    } finally {
      setIsVerifying(false);
    }
  };

  const handlePickupWithImage = async () => {
    const permissionResult = await ImagePicker.requestCameraPermissionsAsync();
    
    if (permissionResult.granted === false) {
      Alert.alert('Permission Required', 'Camera access is needed to capture parcel images.');
      return;
    }

    Alert.alert(
      'Capture Parcel Image',
      'Please take a photo of the parcel before pickup to verify its condition.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Open Camera',
          onPress: async () => {
            const result = await ImagePicker.launchCameraAsync({
              mediaTypes: ImagePicker.MediaTypeOptions.Images,
              allowsEditing: true,
              aspect: [4, 3],
              quality: 0.8,
            });

            if (!result.canceled && result.assets[0]) {
              const newImages = [...pickupImages, result.assets[0].uri];
              setPickupImages(newImages);
              console.log('Pickup image captured:', result.assets[0].uri);
            }
          },
        },
        {
          text: 'Choose from Gallery',
          onPress: async () => {
            const result = await ImagePicker.launchImageLibraryAsync({
              mediaTypes: ImagePicker.MediaTypeOptions.Images,
              allowsEditing: true,
              aspect: [4, 3],
              quality: 0.8,
            });

            if (!result.canceled && result.assets[0]) {
              const newImages = [...pickupImages, result.assets[0].uri];
              setPickupImages(newImages);
              console.log('Pickup image selected:', result.assets[0].uri);
            }
          },
        },
      ]
    );
  };

  const handleConfirmPickup = async () => {
    if (pickupImages.length === 0) {
      Alert.alert('Image Required', 'Please capture at least one image of the parcel before confirming pickup.');
      return;
    }

    await updateShipment(shipment.id, { pickupImages });
    handleOpenOTPModal('pickup');
  };

  const handleStartTransit = async () => {
    await updateShipment(shipment.id, { status: 'in_transit' });
    Alert.alert('Success', 'Shipment is now in transit. GPS tracking has started.');
  };

  const handleMarkOutForDelivery = async () => {
    setIsMarkingOutForDelivery(true);
    try {
      const result = await markOutForDelivery(shipment.id);
      if (result.success) {
        Alert.alert(
          'Out for Delivery',
          `Shipment is now out for delivery!\n\nA new delivery OTP has been generated and sent to the sender. The receiver will share this OTP with you upon delivery.`,
          [{ text: 'OK' }]
        );
      } else {
        Alert.alert('Error', 'Failed to mark out for delivery. Please try again.');
      }
    } catch {
      Alert.alert('Error', 'Failed to mark out for delivery. Please try again.');
    } finally {
      setIsMarkingOutForDelivery(false);
    }
  };

  const handleCaptureDeliveryImage = async () => {
    const permissionResult = await ImagePicker.requestCameraPermissionsAsync();
    
    if (permissionResult.granted === false) {
      Alert.alert('Permission Required', 'Camera access is needed to capture delivery proof.');
      return;
    }

    Alert.alert(
      'Capture Delivery Proof',
      'Take a photo as proof of delivery.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Open Camera',
          onPress: async () => {
            const result = await ImagePicker.launchCameraAsync({
              mediaTypes: ImagePicker.MediaTypeOptions.Images,
              allowsEditing: true,
              aspect: [4, 3],
              quality: 0.8,
            });

            if (!result.canceled && result.assets[0]) {
              setDeliveryImages(prev => [...prev, result.assets[0].uri]);
              console.log('Delivery image captured:', result.assets[0].uri);
            }
          },
        },
        {
          text: 'Choose from Gallery',
          onPress: async () => {
            const result = await ImagePicker.launchImageLibraryAsync({
              mediaTypes: ImagePicker.MediaTypeOptions.Images,
              allowsEditing: true,
              aspect: [4, 3],
              quality: 0.8,
            });

            if (!result.canceled && result.assets[0]) {
              setDeliveryImages(prev => [...prev, result.assets[0].uri]);
              console.log('Delivery image selected:', result.assets[0].uri);
            }
          },
        },
      ]
    );
  };

  const travelModes = [
    { value: 'car', label: 'Car', icon: Car },
    { value: 'train', label: 'Train', icon: Train },
    { value: 'bus', label: 'Bus', icon: Bus },
    { value: 'lorry', label: 'Lorry', icon: Truck },
    { value: 'bike', label: 'Bike', icon: Truck },
    { value: 'flight', label: 'Flight', icon: Truck },
    { value: 'others', label: 'Others', icon: Package },
  ];

  const handleCaptureParcelImage = async () => {
    const permissionResult = await ImagePicker.requestCameraPermissionsAsync();
    
    if (permissionResult.granted === false) {
      Alert.alert('Permission Required', 'Camera access is needed to capture parcel images.');
      return;
    }

    Alert.alert(
      'Capture Parcel Image',
      'Take a photo of the parcel for verification.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Open Camera',
          onPress: async () => {
            const result = await ImagePicker.launchCameraAsync({
              mediaTypes: ImagePicker.MediaTypeOptions.Images,
              allowsEditing: true,
              aspect: [4, 3],
              quality: 0.8,
            });

            if (!result.canceled && result.assets[0]) {
              setTravelerParcelImage(result.assets[0].uri);
              console.log('Parcel image captured:', result.assets[0].uri);
            }
          },
        },
        {
          text: 'Choose from Gallery',
          onPress: async () => {
            const result = await ImagePicker.launchImageLibraryAsync({
              mediaTypes: ImagePicker.MediaTypeOptions.Images,
              allowsEditing: true,
              aspect: [4, 3],
              quality: 0.8,
            });

            if (!result.canceled && result.assets[0]) {
              setTravelerParcelImage(result.assets[0].uri);
              console.log('Parcel image selected:', result.assets[0].uri);
            }
          },
        },
      ]
    );
  };

  const handleSavePickupDetails = async () => {
    if (!travelerParcelImage) {
      Alert.alert('Required', 'Please capture a photo of the parcel.');
      return;
    }
    if (!travelerTravelMode) {
      Alert.alert('Required', 'Please select your travel mode.');
      return;
    }
    if (!travelerDeliveryDate) {
      Alert.alert('Required', 'Please enter the expected delivery date.');
      return;
    }

    await updateShipment(shipment.id, {
      travelerTravelMode: travelerTravelMode as any,
      travelerDeliveryDate,
      travelerParcelImage,
      pickupDetailsCompleted: true,
      status: 'assigned',
    });
    Alert.alert('Success', 'Pickup details saved! You can now proceed with pickup verification.');
  };

  const removeImage = (index: number) => {
    const newImages = pickupImages.filter((_, i) => i !== index);
    setPickupImages(newImages);
  };

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ title: `#${shipment.parcelRequestId.slice(-6)}` }} />
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.parcelIdBanner}>
          <Shield size={18} color={Colors.primary} />
          <Text style={styles.parcelIdText}>Parcel ID: {shipment.parcelRequestId}</Text>
        </View>

        <View style={styles.statusCard}>
          <Text style={styles.statusTitle}>Shipment Status</Text>
          <View style={styles.statusTimeline}>
            {statusSteps.map((step, index) => {
              const isCompleted = index <= currentStepIndex;
              const isCurrent = index === currentStepIndex;
              const StepIcon = step.icon;
              return (
                <View key={step.key} style={styles.statusStep}>
                  <View style={[
                    styles.statusIconContainer,
                    isCompleted && styles.statusIconCompleted,
                    isCurrent && styles.statusIconCurrent,
                  ]}>
                    <StepIcon 
                      size={16} 
                      color={isCompleted ? Colors.textInverse : Colors.textTertiary} 
                    />
                  </View>
                  <Text style={[
                    styles.statusLabel,
                    isCompleted && styles.statusLabelCompleted,
                  ]}>
                    {step.label}
                  </Text>
                  {index < statusSteps.length - 1 && (
                    <View style={[
                      styles.statusLine,
                      isCompleted && styles.statusLineCompleted,
                    ]} />
                  )}
                </View>
              );
            })}
          </View>
        </View>

        {(shipment.status === 'in_transit' || shipment.status === 'picked_up') && (
          <TouchableOpacity 
            style={styles.trackButton}
            onPress={() => router.push(`/tracking/${shipment.id}` as any)}
          >
            <MapPin size={20} color={Colors.textInverse} />
            <Text style={styles.trackButtonText}>Track Live Location</Text>
          </TouchableOpacity>
        )}

        {shipment.chatId && (
          <TouchableOpacity 
            style={styles.chatButton}
            onPress={() => router.push(`/chat/${shipment.chatId}` as any)}
          >
            <MessageCircle size={20} color={Colors.primary} />
            <Text style={styles.chatButtonText}>
              Chat with {isTraveler ? 'Sender' : 'Traveler'}
            </Text>
          </TouchableOpacity>
        )}

        <View style={styles.routeCard}>
          <View style={styles.routePoint}>
            <View style={[styles.routeDot, { backgroundColor: Colors.primary }]} />
            <View style={styles.routeInfo}>
              <Text style={styles.routeLabel}>From</Text>
              <Text style={styles.routeCity}>{shipment.pickupCity}</Text>
              <Text style={styles.routeAddress}>{shipment.pickupAddress}</Text>
            </View>
          </View>
          <View style={styles.routeLineVertical} />
          <View style={styles.routePoint}>
            <View style={[styles.routeDot, { backgroundColor: Colors.success }]} />
            <View style={styles.routeInfo}>
              <Text style={styles.routeLabel}>To</Text>
              <Text style={styles.routeCity}>{shipment.destinationCity}</Text>
              <Text style={styles.routeAddress}>{shipment.destinationAddress}</Text>
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Parcel Details</Text>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Description</Text>
            <Text style={styles.detailValue}>{shipment.parcelDetails.description}</Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Category</Text>
            <Text style={styles.detailValue}>{shipment.parcelDetails.category}</Text>
          </View>
          <View style={styles.detailGrid}>
            <View style={styles.detailGridItem}>
              <Text style={styles.detailLabel}>Weight</Text>
              <Text style={styles.detailValue}>{shipment.parcelDetails.weight} kg</Text>
            </View>
            <View style={styles.detailGridItem}>
              <Text style={styles.detailLabel}>Dimensions</Text>
              <Text style={styles.detailValue}>{shipment.parcelDetails.dimensions}</Text>
            </View>
            <View style={styles.detailGridItem}>
              <Text style={styles.detailLabel}>Value</Text>
              <Text style={styles.detailValue}>₹{shipment.parcelDetails.estimatedValue}</Text>
            </View>
            <View style={styles.detailGridItem}>
              <Text style={styles.detailLabel}>Fragile</Text>
              <Text style={styles.detailValue}>{shipment.parcelDetails.fragile ? 'Yes' : 'No'}</Text>
            </View>
          </View>
        </View>

        {isSender && shipment.pickupOtp && shipment.status === 'assigned' && (
          <View style={styles.otpCard}>
            <View style={styles.otpHeader}>
              <Key size={20} color={Colors.warning} />
              <Text style={styles.otpTitle}>Pickup OTP</Text>
            </View>
            <Text style={styles.otpValue}>{shipment.pickupOtp}</Text>
            <Text style={styles.otpHint}>Share this OTP with the traveler at pickup</Text>
          </View>
        )}

        {isSender && shipment.deliveryOtp && shipment.status === 'out_for_delivery' && (
          <View style={[styles.otpCard, styles.deliveryOtpCard]}>
            <View style={styles.otpHeader}>
              <Gift size={20} color={Colors.success} />
              <Text style={styles.otpTitle}>Delivery OTP</Text>
            </View>
            <Text style={[styles.otpValue, styles.deliveryOtpValue]}>{shipment.deliveryOtp}</Text>
            <Text style={styles.otpHint}>Share this OTP with the receiver. They will give it to the traveler to confirm delivery.</Text>
          </View>
        )}

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Receiver</Text>
          </View>
          <View style={styles.personCard}>
            <View style={styles.personAvatar}>
              <User size={24} color={Colors.textSecondary} />
            </View>
            <View style={styles.personInfo}>
              <Text style={styles.personName}>{shipment.receiverName}</Text>
              <View style={styles.personContact}>
                <Phone size={14} color={Colors.textSecondary} />
                <Text style={styles.personPhone}>{shipment.receiverPhone}</Text>
              </View>
            </View>
          </View>
        </View>

        {!isTraveler && quotes.length > 0 && shipment.status !== 'assigned' && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Quotes ({quotes.length})</Text>
            {quotes.map((quote) => (
              <TouchableOpacity
                key={quote.id}
                style={[
                  styles.quoteCard,
                  selectedQuote === quote.id && styles.quoteCardSelected,
                ]}
                onPress={() => setSelectedQuote(quote.id)}
              >
                <View style={styles.quoteHeader}>
                  <View style={styles.travelerInfo}>
                    <View style={styles.travelerAvatar}>
                      <User size={20} color={Colors.textInverse} />
                    </View>
                    <View>
                      <Text style={styles.travelerName}>{quote.travelerName}</Text>
                      <View style={styles.travelerRating}>
                        <Star size={12} color={Colors.warning} fill={Colors.warning} />
                        <Text style={styles.ratingText}>
                          {quote.travelerRating} ({quote.travelerDeliveries} deliveries)
                        </Text>
                      </View>
                    </View>
                  </View>
                  <View style={styles.quoteAmount}>
                    <Text style={styles.amountValue}>₹{quote.amount}</Text>
                  </View>
                </View>
                {quote.message && (
                  <Text style={styles.quoteMessage}>{quote.message}</Text>
                )}
                <View style={styles.quoteFooter}>
                  <View style={styles.deliveryDate}>
                    <Calendar size={14} color={Colors.textSecondary} />
                    <Text style={styles.deliveryText}>Est. {quote.estimatedDelivery}</Text>
                  </View>
                  {selectedQuote === quote.id && (
                    <TouchableOpacity
                      style={styles.acceptButton}
                      onPress={() => handleAcceptQuote(quote.id)}
                    >
                      <Text style={styles.acceptButtonText}>Accept Quote</Text>
                    </TouchableOpacity>
                  )}
                </View>
              </TouchableOpacity>
            ))}
          </View>
        )}

        {isTraveler && (shipment.status === 'created' || shipment.status === 'quoted') && (
          <View style={styles.travelerActionSection}>
            {user?.kycStatus !== 'approved' ? (
              <View style={styles.kycWarningCard}>
                <AlertCircle size={24} color={Colors.warning} />
                <View style={styles.kycWarningContent}>
                  <Text style={styles.kycWarningTitle}>KYC Required</Text>
                  <Text style={styles.kycWarningText}>
                    Complete your KYC verification to submit quotes for this shipment.
                  </Text>
                </View>
                <TouchableOpacity 
                  style={styles.kycWarningButton}
                  onPress={() => router.push('/kyc')}
                >
                  <Text style={styles.kycWarningButtonText}>Complete KYC</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <>
                <TouchableOpacity style={styles.submitQuoteButton} onPress={handleSubmitQuote}>
                  <IndianRupee size={20} color={Colors.textInverse} />
                  <Text style={styles.submitQuoteText}>Submit Quote</Text>
                </TouchableOpacity>
                <Text style={styles.quoteHint}>
                  You can chat with the sender after submitting your quote
                </Text>
              </>
            )}
          </View>
        )}

        {/* Pickup Details Section for Traveler - After Payment Confirmed */}
        {isTraveler && shipment.status === 'confirmed' && !shipment.pickupDetailsCompleted && (
          <View style={styles.pickupDetailsSection}>
            <View style={styles.pickupDetailsSectionHeader}>
              <Package size={22} color={Colors.primary} />
              <Text style={styles.pickupDetailsSectionTitle}>Pickup Details</Text>
            </View>
            <Text style={styles.pickupDetailsSectionSubtitle}>
              Complete these details before pickup to proceed with the delivery
            </Text>

            {/* Sender Details */}
            <View style={styles.contactCard}>
              <Text style={styles.contactCardTitle}>Sender Details</Text>
              <View style={styles.contactRow}>
                <View style={styles.contactAvatar}>
                  <User size={18} color={Colors.textInverse} />
                </View>
                <View style={styles.contactInfo}>
                  <Text style={styles.contactName}>{shipment.senderName}</Text>
                  <View style={styles.contactPhoneRow}>
                    <Phone size={14} color={Colors.textSecondary} />
                    <Text style={styles.contactPhone}>{shipment.senderPhone || 'Not provided'}</Text>
                  </View>
                </View>
              </View>
            </View>

            {/* Receiver Details */}
            <View style={styles.contactCard}>
              <Text style={styles.contactCardTitle}>Receiver Details</Text>
              <View style={styles.contactRow}>
                <View style={[styles.contactAvatar, { backgroundColor: Colors.success }]}>
                  <User size={18} color={Colors.textInverse} />
                </View>
                <View style={styles.contactInfo}>
                  <Text style={styles.contactName}>{shipment.receiverName || 'Not provided'}</Text>
                  <View style={styles.contactPhoneRow}>
                    <Phone size={14} color={Colors.textSecondary} />
                    <Text style={styles.contactPhone}>{shipment.receiverPhone || 'Not provided'}</Text>
                  </View>
                </View>
              </View>
            </View>

            {/* Parcel Image - Mandatory */}
            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>
                Parcel Photo <Text style={styles.requiredStar}>*</Text>
              </Text>
              {travelerParcelImage ? (
                <View style={styles.parcelImageContainer}>
                  <Image source={{ uri: travelerParcelImage }} style={styles.parcelImagePreview} />
                  <TouchableOpacity
                    style={styles.changeImageBtn}
                    onPress={handleCaptureParcelImage}
                  >
                    <Camera size={16} color={Colors.textInverse} />
                    <Text style={styles.changeImageText}>Change</Text>
                  </TouchableOpacity>
                </View>
              ) : (
                <TouchableOpacity style={styles.captureParcelBtn} onPress={handleCaptureParcelImage}>
                  <Camera size={24} color={Colors.primary} />
                  <Text style={styles.captureParcelText}>Capture Parcel Photo</Text>
                  <Text style={styles.captureParcelHint}>Required for verification</Text>
                </TouchableOpacity>
              )}
            </View>

            {/* Travel Mode */}
            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>
                Travel Mode <Text style={styles.requiredStar}>*</Text>
              </Text>
              <TouchableOpacity
                style={styles.selectInput}
                onPress={() => setShowTravelModeModal(true)}
              >
                <Text style={[styles.selectInputText, !travelerTravelMode && styles.selectPlaceholder]}>
                  {travelerTravelMode
                    ? travelModes.find(m => m.value === travelerTravelMode)?.label
                    : 'Select travel mode'}
                </Text>
                <ChevronDown size={20} color={Colors.textSecondary} />
              </TouchableOpacity>
            </View>

            {/* Delivery Date */}
            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>
                Expected Delivery Date <Text style={styles.requiredStar}>*</Text>
              </Text>
              <TextInput
                style={styles.textInput}
                placeholder="e.g., 2025-02-10"
                placeholderTextColor={Colors.textTertiary}
                value={travelerDeliveryDate}
                onChangeText={setTravelerDeliveryDate}
              />
            </View>

            <TouchableOpacity
              style={[
                styles.savePickupDetailsBtn,
                (!travelerParcelImage || !travelerTravelMode || !travelerDeliveryDate) && styles.savePickupDetailsBtnDisabled,
              ]}
              onPress={handleSavePickupDetails}
              disabled={!travelerParcelImage || !travelerTravelMode || !travelerDeliveryDate}
            >
              <Check size={20} color={Colors.textInverse} />
              <Text style={styles.savePickupDetailsText}>Save & Proceed to Pickup</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Show saved pickup details for traveler */}
        {isTraveler && shipment.pickupDetailsCompleted && (shipment.status === 'assigned' || shipment.status === 'confirmed') && (
          <View style={styles.savedPickupDetailsCard}>
            <View style={styles.savedPickupDetailsHeader}>
              <CheckCircle size={20} color={Colors.success} />
              <Text style={styles.savedPickupDetailsTitle}>Pickup Details Saved</Text>
            </View>
            
            <View style={styles.savedDetailsRow}>
              <Text style={styles.savedDetailLabel}>Parcel Image</Text>
              {shipment.travelerParcelImage && (
                <TouchableOpacity
                  onPress={() => {
                    setSelectedImage(shipment.travelerParcelImage || null);
                    setShowImageModal(true);
                  }}
                >
                  <Image source={{ uri: shipment.travelerParcelImage }} style={styles.savedParcelThumb} />
                </TouchableOpacity>
              )}
            </View>
            <View style={styles.savedDetailsRow}>
              <Text style={styles.savedDetailLabel}>Travel Mode</Text>
              <Text style={styles.savedDetailValue}>
                {travelModes.find(m => m.value === shipment.travelerTravelMode)?.label || shipment.travelerTravelMode}
              </Text>
            </View>
            <View style={styles.savedDetailsRow}>
              <Text style={styles.savedDetailLabel}>Expected Delivery</Text>
              <Text style={styles.savedDetailValue}>{shipment.travelerDeliveryDate}</Text>
            </View>
          </View>
        )}

        {isTraveler && shipment.status === 'assigned' && !shipment.pickupOtpVerified && (
          <View style={styles.pickupSection}>
            <Text style={styles.pickupTitle}>Pickup Verification</Text>
            <Text style={styles.pickupSubtitle}>
              Capture photos of the parcel and verify OTP to confirm pickup
            </Text>
            
            {pickupImages.length > 0 && (
              <View style={styles.imageGrid}>
                {pickupImages.map((uri, index) => (
                  <TouchableOpacity
                    key={index}
                    style={styles.imageContainer}
                    onPress={() => {
                      setSelectedImage(uri);
                      setShowImageModal(true);
                    }}
                  >
                    <Image source={{ uri }} style={styles.pickupImage} />
                    <TouchableOpacity
                      style={styles.removeImageBtn}
                      onPress={() => removeImage(index)}
                    >
                      <X size={14} color={Colors.textInverse} />
                    </TouchableOpacity>
                  </TouchableOpacity>
                ))}
              </View>
            )}

            <TouchableOpacity style={styles.captureButton} onPress={handlePickupWithImage}>
              <Camera size={20} color={Colors.textInverse} />
              <Text style={styles.captureButtonText}>
                {pickupImages.length > 0 ? 'Add More Photos' : 'Capture Parcel Photo'}
              </Text>
            </TouchableOpacity>

            {pickupImages.length > 0 && (
              <TouchableOpacity style={styles.confirmPickupButton} onPress={handleConfirmPickup}>
                <Key size={20} color={Colors.textInverse} />
                <Text style={styles.confirmPickupText}>Verify Pickup OTP</Text>
              </TouchableOpacity>
            )}
          </View>
        )}

        {isTraveler && shipment.status === 'picked_up' && (
          <TouchableOpacity style={styles.startTransitButton} onPress={handleStartTransit}>
            <Truck size={20} color={Colors.textInverse} />
            <Text style={styles.startTransitText}>Start Transit</Text>
          </TouchableOpacity>
        )}

        {isTraveler && shipment.status === 'in_transit' && (
          <TouchableOpacity 
            style={[styles.outForDeliveryButton, isMarkingOutForDelivery && styles.buttonDisabled]} 
            onPress={handleMarkOutForDelivery}
            disabled={isMarkingOutForDelivery}
          >
            <Navigation size={20} color={Colors.textInverse} />
            <Text style={styles.outForDeliveryText}>
              {isMarkingOutForDelivery ? 'Marking...' : 'Mark Out for Delivery'}
            </Text>
          </TouchableOpacity>
        )}

        {isTraveler && shipment.status === 'out_for_delivery' && (
          <View style={styles.deliverySection}>
            <View style={styles.deliverySectionHeader}>
              <Gift size={22} color={Colors.success} />
              <Text style={styles.deliverySectionTitle}>Complete Delivery</Text>
            </View>
            <Text style={styles.deliverySectionSubtitle}>
              Capture delivery proof photo and enter the OTP from the receiver to complete delivery.
            </Text>

            {deliveryImages.length > 0 && (
              <View style={styles.imageGrid}>
                {deliveryImages.map((uri, index) => (
                  <TouchableOpacity
                    key={index}
                    style={styles.imageContainer}
                    onPress={() => {
                      setSelectedImage(uri);
                      setShowImageModal(true);
                    }}
                  >
                    <Image source={{ uri }} style={styles.pickupImage} />
                    <TouchableOpacity
                      style={styles.removeImageBtn}
                      onPress={() => setDeliveryImages(prev => prev.filter((_, i) => i !== index))}
                    >
                      <X size={14} color={Colors.textInverse} />
                    </TouchableOpacity>
                  </TouchableOpacity>
                ))}
              </View>
            )}

            <TouchableOpacity style={styles.captureDeliveryBtn} onPress={handleCaptureDeliveryImage}>
              <Camera size={20} color={Colors.textInverse} />
              <Text style={styles.captureDeliveryText}>
                {deliveryImages.length > 0 ? 'Add More Photos' : 'Capture Delivery Proof'}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.deliveryButton} 
              onPress={() => handleOpenOTPModal('delivery')}
            >
              <CheckCircle size={20} color={Colors.textInverse} />
              <Text style={styles.deliveryButtonText}>Enter OTP & Complete Delivery</Text>
            </TouchableOpacity>
          </View>
        )}

        {shipment.pickupImages && shipment.pickupImages.length > 0 && (
          <View style={styles.section}>
            <View style={styles.imagesSectionHeader}>
              <View style={styles.imagesTitleRow}>
                <ImageIcon size={18} color={Colors.primary} />
                <Text style={styles.sectionTitle}>Pickup Photos</Text>
              </View>
              <Text style={styles.imagesSubtitle}>
                Captured by traveler at pickup
              </Text>
            </View>
            <View style={styles.imageGrid}>
              {shipment.pickupImages.map((uri, index) => (
                <TouchableOpacity
                  key={index}
                  style={styles.imageContainer}
                  onPress={() => {
                    setSelectedImage(uri);
                    setShowImageModal(true);
                  }}
                >
                  <Image source={{ uri }} style={styles.pickupImage} />
                  <View style={styles.imageOverlay}>
                    <Text style={styles.imageNumber}>{index + 1}</Text>
                  </View>
                </TouchableOpacity>
              ))}
            </View>
            {(isSender || user?.activeRole === 'admin') && (
              <Text style={styles.imagesNote}>
                These photos were taken by the traveler before pickup for verification.
              </Text>
            )}
          </View>
        )}

        {shipment.deliveryImages && shipment.deliveryImages.length > 0 && (
          <View style={styles.section}>
            <View style={styles.imagesSectionHeader}>
              <View style={styles.imagesTitleRow}>
                <Gift size={18} color={Colors.success} />
                <Text style={styles.sectionTitle}>Delivery Photos</Text>
              </View>
              <Text style={styles.imagesSubtitle}>
                Proof of delivery captured by traveler
              </Text>
            </View>
            <View style={styles.imageGrid}>
              {shipment.deliveryImages.map((uri, index) => (
                <TouchableOpacity
                  key={index}
                  style={styles.imageContainer}
                  onPress={() => {
                    setSelectedImage(uri);
                    setShowImageModal(true);
                  }}
                >
                  <Image source={{ uri }} style={styles.pickupImage} />
                  <View style={[styles.imageOverlay, { backgroundColor: 'rgba(16,185,129,0.8)' }]}>
                    <Text style={styles.imageNumber}>{index + 1}</Text>
                  </View>
                </TouchableOpacity>
              ))}
            </View>
            {shipment.deliveryConfirmedAt && (
              <Text style={styles.imagesNote}>
                Delivered on {new Date(shipment.deliveryConfirmedAt).toLocaleString()}
              </Text>
            )}
          </View>
        )}

        {/* Assigned Traveler Info for Sender */}
        {isSender && shipment.assignedTravelerId && shipment.status !== 'created' && shipment.status !== 'quoted' && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Assigned Traveler</Text>
            <View style={styles.personCard}>
              <View style={[styles.personAvatar, { backgroundColor: Colors.primary }]}>
                <User size={24} color={Colors.textInverse} />
              </View>
              <View style={styles.personInfo}>
                <Text style={styles.personName}>{shipment.assignedTravelerName}</Text>
                {shipment.acceptedQuoteAmount && (
                  <View style={styles.quoteAmountBadge}>
                    <IndianRupee size={12} color={Colors.success} />
                    <Text style={styles.quoteAmountText}>₹{shipment.acceptedQuoteAmount}</Text>
                  </View>
                )}
              </View>
              {shipment.chatId && (
                <TouchableOpacity 
                  style={styles.chatSmallButton}
                  onPress={() => router.push(`/chat/${shipment.chatId}` as any)}
                >
                  <MessageCircle size={18} color={Colors.primary} />
                </TouchableOpacity>
              )}
            </View>
          </View>
        )}
      </ScrollView>

      <Modal
        visible={showImageModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowImageModal(false)}
      >
        <View style={styles.modalOverlay}>
          <TouchableOpacity
            style={styles.modalClose}
            onPress={() => setShowImageModal(false)}
          >
            <X size={24} color={Colors.textInverse} />
          </TouchableOpacity>
          {selectedImage && (
            <Image
              source={{ uri: selectedImage }}
              style={styles.fullImage}
              resizeMode="contain"
            />
          )}
        </View>
      </Modal>

      <Modal
        visible={showOTPModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowOTPModal(false)}
      >
        <View style={styles.otpModalOverlay}>
          <View style={styles.otpModalContent}>
            <TouchableOpacity
              style={styles.otpModalClose}
              onPress={() => setShowOTPModal(false)}
            >
              <X size={24} color={Colors.textSecondary} />
            </TouchableOpacity>
            
            <View style={styles.otpModalIcon}>
              <Key size={32} color={otpType === 'pickup' ? Colors.warning : Colors.success} />
            </View>
            
            <Text style={styles.otpModalTitle}>
              {otpType === 'pickup' ? 'Enter Pickup OTP' : 'Enter Delivery OTP'}
            </Text>
            <Text style={styles.otpModalSubtitle}>
              {otpType === 'pickup' 
                ? 'Get the 4-digit OTP from the sender'
                : 'Get the 4-digit OTP from the receiver'}
            </Text>

            <TextInput
              style={styles.otpModalInput}
              placeholder="0000"
              placeholderTextColor={Colors.textTertiary}
              value={otpInput}
              onChangeText={setOtpInput}
              keyboardType="number-pad"
              maxLength={4}
              textAlign="center"
            />

            <TouchableOpacity 
              style={[styles.otpModalButton, isVerifying && styles.otpModalButtonDisabled]}
              onPress={handleVerifyOTP}
              disabled={isVerifying}
            >
              <Text style={styles.otpModalButtonText}>
                {isVerifying ? 'Verifying...' : 'Verify OTP'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Travel Mode Selection Modal */}
      <Modal
        visible={showTravelModeModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowTravelModeModal(false)}
      >
        <View style={styles.travelModeModalOverlay}>
          <View style={styles.travelModeModalContent}>
            <View style={styles.travelModeModalHeader}>
              <Text style={styles.travelModeModalTitle}>Select Travel Mode</Text>
              <TouchableOpacity onPress={() => setShowTravelModeModal(false)}>
                <X size={24} color={Colors.text} />
              </TouchableOpacity>
            </View>
            {travelModes.map((mode) => {
              const ModeIcon = mode.icon;
              return (
                <TouchableOpacity
                  key={mode.value}
                  style={[
                    styles.travelModeOption,
                    travelerTravelMode === mode.value && styles.travelModeOptionSelected,
                  ]}
                  onPress={() => {
                    setTravelerTravelMode(mode.value);
                    setShowTravelModeModal(false);
                  }}
                >
                  <ModeIcon size={24} color={travelerTravelMode === mode.value ? Colors.primary : Colors.textSecondary} />
                  <Text style={[
                    styles.travelModeOptionText,
                    travelerTravelMode === mode.value && styles.travelModeOptionTextSelected,
                  ]}>
                    {mode.label}
                  </Text>
                  {travelerTravelMode === mode.value && (
                    <CheckCircle size={20} color={Colors.primary} />
                  )}
                </TouchableOpacity>
              );
            })}
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
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
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
  parcelIdBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.primaryLight + '20',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 10,
    marginBottom: 16,
    gap: 8,
  },
  parcelIdText: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: Colors.primary,
  },
  statusCard: {
    backgroundColor: Colors.surface,
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
  },
  statusTitle: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: Colors.text,
    marginBottom: 16,
  },
  statusTimeline: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  statusStep: {
    alignItems: 'center',
    flex: 1,
  },
  statusIconContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Colors.surfaceSecondary,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 4,
  },
  statusIconCompleted: {
    backgroundColor: Colors.success,
  },
  statusIconCurrent: {
    backgroundColor: Colors.primary,
  },
  statusLabel: {
    fontSize: 10,
    color: Colors.textTertiary,
    textAlign: 'center',
  },
  statusLabelCompleted: {
    color: Colors.text,
    fontWeight: '500' as const,
  },
  statusLine: {
    position: 'absolute',
    top: 16,
    left: '60%',
    right: '-40%',
    height: 2,
    backgroundColor: Colors.border,
    zIndex: -1,
  },
  statusLineCompleted: {
    backgroundColor: Colors.success,
  },
  trackButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.primary,
    borderRadius: 12,
    padding: 14,
    marginBottom: 12,
    gap: 8,
  },
  trackButtonText: {
    fontSize: 15,
    fontWeight: '600' as const,
    color: Colors.textInverse,
  },
  chatButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.surface,
    borderRadius: 12,
    padding: 14,
    marginBottom: 16,
    gap: 8,
    borderWidth: 1,
    borderColor: Colors.primary,
  },
  chatButtonText: {
    fontSize: 15,
    fontWeight: '600' as const,
    color: Colors.primary,
  },
  routeCard: {
    backgroundColor: Colors.surface,
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
  },
  routePoint: {
    flexDirection: 'row',
    gap: 12,
  },
  routeDot: {
    width: 14,
    height: 14,
    borderRadius: 7,
    marginTop: 2,
  },
  routeInfo: {
    flex: 1,
  },
  routeLabel: {
    fontSize: 11,
    color: Colors.textTertiary,
    textTransform: 'uppercase' as const,
    letterSpacing: 0.5,
  },
  routeCity: {
    fontSize: 18,
    fontWeight: '600' as const,
    color: Colors.text,
  },
  routeAddress: {
    fontSize: 13,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  routeLineVertical: {
    width: 2,
    height: 24,
    backgroundColor: Colors.border,
    marginLeft: 6,
    marginVertical: 4,
  },
  section: {
    backgroundColor: Colors.surface,
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: Colors.text,
    marginBottom: 12,
  },
  detailRow: {
    marginBottom: 12,
  },
  detailLabel: {
    fontSize: 12,
    color: Colors.textTertiary,
    marginBottom: 2,
  },
  detailValue: {
    fontSize: 15,
    color: Colors.text,
  },
  detailGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 8,
  },
  detailGridItem: {
    width: '50%',
    marginBottom: 12,
  },
  otpCard: {
    backgroundColor: Colors.surface,
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    alignItems: 'center',
  },
  otpHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  otpTitle: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: Colors.text,
  },
  otpValue: {
    fontSize: 32,
    fontWeight: '700' as const,
    color: Colors.primary,
    letterSpacing: 8,
  },
  otpHint: {
    fontSize: 13,
    color: Colors.textSecondary,
    marginTop: 8,
    textAlign: 'center',
  },
  personCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  personAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: Colors.surfaceSecondary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  personInfo: {
    flex: 1,
  },
  personName: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: Colors.text,
  },
  personContact: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 4,
  },
  personPhone: {
    fontSize: 14,
    color: Colors.textSecondary,
  },
  quoteCard: {
    backgroundColor: Colors.surfaceSecondary,
    borderRadius: 12,
    padding: 14,
    marginBottom: 12,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  quoteCardSelected: {
    borderColor: Colors.primary,
    backgroundColor: Colors.primaryLight + '10',
  },
  quoteHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  travelerInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  travelerAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  travelerName: {
    fontSize: 15,
    fontWeight: '600' as const,
    color: Colors.text,
  },
  travelerRating: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 2,
  },
  ratingText: {
    fontSize: 12,
    color: Colors.textSecondary,
  },
  quoteAmount: {
    alignItems: 'flex-end',
  },
  amountValue: {
    fontSize: 20,
    fontWeight: '700' as const,
    color: Colors.primary,
  },
  quoteMessage: {
    fontSize: 13,
    color: Colors.textSecondary,
    marginTop: 10,
    lineHeight: 18,
  },
  quoteFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 12,
  },
  deliveryDate: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  deliveryText: {
    fontSize: 13,
    color: Colors.textSecondary,
  },
  acceptButton: {
    backgroundColor: Colors.primary,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  acceptButtonText: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: Colors.textInverse,
  },
  submitQuoteButton: {
    backgroundColor: Colors.primary,
    borderRadius: 14,
    padding: 18,
    alignItems: 'center',
    marginBottom: 16,
  },
  submitQuoteText: {
    fontSize: 17,
    fontWeight: '600' as const,
    color: Colors.textInverse,
  },
  pickupSection: {
    backgroundColor: Colors.surface,
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
  },
  pickupTitle: {
    fontSize: 18,
    fontWeight: '600' as const,
    color: Colors.text,
    marginBottom: 4,
  },
  pickupSubtitle: {
    fontSize: 13,
    color: Colors.textSecondary,
    marginBottom: 16,
    lineHeight: 18,
  },
  imageGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 16,
  },
  imageContainer: {
    width: 100,
    height: 100,
    borderRadius: 12,
    overflow: 'hidden',
    position: 'relative',
  },
  pickupImage: {
    width: '100%',
    height: '100%',
  },
  removeImageBtn: {
    position: 'absolute',
    top: 4,
    right: 4,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  captureButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.info,
    borderRadius: 12,
    padding: 14,
    gap: 8,
  },
  captureButtonText: {
    fontSize: 15,
    fontWeight: '600' as const,
    color: Colors.textInverse,
  },
  confirmPickupButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.warning,
    borderRadius: 12,
    padding: 14,
    gap: 8,
    marginTop: 10,
  },
  confirmPickupText: {
    fontSize: 15,
    fontWeight: '600' as const,
    color: Colors.textInverse,
  },
  startTransitButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.info,
    borderRadius: 14,
    padding: 18,
    gap: 8,
    marginBottom: 16,
  },
  startTransitText: {
    fontSize: 17,
    fontWeight: '600' as const,
    color: Colors.textInverse,
  },
  deliveryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.success,
    borderRadius: 14,
    padding: 18,
    gap: 8,
    marginBottom: 16,
  },
  deliveryButtonText: {
    fontSize: 17,
    fontWeight: '600' as const,
    color: Colors.textInverse,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.9)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalClose: {
    position: 'absolute',
    top: 50,
    right: 20,
    zIndex: 10,
    padding: 10,
  },
  fullImage: {
    width: '90%',
    height: '70%',
  },
  otpModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  otpModalContent: {
    backgroundColor: Colors.surface,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    paddingBottom: 40,
    alignItems: 'center',
  },
  otpModalClose: {
    position: 'absolute',
    top: 16,
    right: 16,
    padding: 8,
  },
  otpModalIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: Colors.warningLight,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  otpModalTitle: {
    fontSize: 20,
    fontWeight: '700' as const,
    color: Colors.text,
    marginBottom: 8,
  },
  otpModalSubtitle: {
    fontSize: 14,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginBottom: 24,
  },
  otpModalInput: {
    width: '60%',
    backgroundColor: Colors.surfaceSecondary,
    borderRadius: 12,
    padding: 16,
    fontSize: 28,
    fontWeight: '700' as const,
    color: Colors.text,
    letterSpacing: 12,
    marginBottom: 24,
  },
  otpModalButton: {
    width: '100%',
    backgroundColor: Colors.primary,
    borderRadius: 14,
    padding: 16,
    alignItems: 'center',
  },
  otpModalButtonDisabled: {
    backgroundColor: Colors.textTertiary,
  },
  otpModalButtonText: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: Colors.textInverse,
  },
  travelerActionSection: {
    marginBottom: 16,
  },
  kycWarningCard: {
    backgroundColor: Colors.warningLight,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.warning,
  },
  kycWarningContent: {
    marginTop: 12,
    marginBottom: 12,
  },
  kycWarningTitle: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: Colors.warning,
    marginBottom: 4,
  },
  kycWarningText: {
    fontSize: 13,
    color: Colors.text,
    lineHeight: 18,
  },
  kycWarningButton: {
    backgroundColor: Colors.warning,
    borderRadius: 10,
    padding: 12,
    alignItems: 'center',
  },
  kycWarningButtonText: {
    fontSize: 15,
    fontWeight: '600' as const,
    color: Colors.textInverse,
  },
  quoteHint: {
    fontSize: 12,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginTop: 8,
  },
  imagesSectionHeader: {
    marginBottom: 12,
  },
  imagesTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  imagesSubtitle: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginTop: 4,
    marginLeft: 26,
  },
  imageOverlay: {
    position: 'absolute',
    bottom: 4,
    left: 4,
    backgroundColor: 'rgba(0,0,0,0.6)',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  imageNumber: {
    fontSize: 11,
    fontWeight: '600' as const,
    color: Colors.textInverse,
  },
  imagesNote: {
    fontSize: 11,
    color: Colors.textTertiary,
    fontStyle: 'italic' as const,
    marginTop: 8,
  },
  quoteAmountBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    marginTop: 4,
  },
  quoteAmountText: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: Colors.success,
  },
  chatSmallButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.primaryLight + '30',
    justifyContent: 'center',
    alignItems: 'center',
  },
  pickupDetailsSection: {
    backgroundColor: Colors.surface,
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    borderWidth: 2,
    borderColor: Colors.primary + '30',
  },
  pickupDetailsSectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 4,
  },
  pickupDetailsSectionTitle: {
    fontSize: 18,
    fontWeight: '700' as const,
    color: Colors.text,
  },
  pickupDetailsSectionSubtitle: {
    fontSize: 13,
    color: Colors.textSecondary,
    marginBottom: 16,
    lineHeight: 18,
  },
  contactCard: {
    backgroundColor: Colors.surfaceSecondary,
    borderRadius: 12,
    padding: 14,
    marginBottom: 12,
  },
  contactCardTitle: {
    fontSize: 12,
    fontWeight: '600' as const,
    color: Colors.textSecondary,
    textTransform: 'uppercase' as const,
    letterSpacing: 0.5,
    marginBottom: 10,
  },
  contactRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  contactAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  contactInfo: {
    flex: 1,
  },
  contactName: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: Colors.text,
  },
  contactPhoneRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 4,
  },
  contactPhone: {
    fontSize: 14,
    color: Colors.textSecondary,
  },
  formGroup: {
    marginBottom: 16,
  },
  formLabel: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: Colors.text,
    marginBottom: 8,
  },
  requiredStar: {
    color: Colors.error,
  },
  parcelImageContainer: {
    position: 'relative',
  },
  parcelImagePreview: {
    width: '100%',
    height: 200,
    borderRadius: 12,
  },
  changeImageBtn: {
    position: 'absolute',
    bottom: 10,
    right: 10,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.7)',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    gap: 6,
  },
  changeImageText: {
    fontSize: 13,
    fontWeight: '600' as const,
    color: Colors.textInverse,
  },
  captureParcelBtn: {
    backgroundColor: Colors.surfaceSecondary,
    borderRadius: 12,
    padding: 24,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: Colors.border,
    borderStyle: 'dashed',
  },
  captureParcelText: {
    fontSize: 15,
    fontWeight: '600' as const,
    color: Colors.primary,
    marginTop: 8,
  },
  captureParcelHint: {
    fontSize: 12,
    color: Colors.textTertiary,
    marginTop: 4,
  },
  selectInput: {
    backgroundColor: Colors.surfaceSecondary,
    borderRadius: 12,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  selectInputText: {
    fontSize: 15,
    color: Colors.text,
  },
  selectPlaceholder: {
    color: Colors.textTertiary,
  },
  textInput: {
    backgroundColor: Colors.surfaceSecondary,
    borderRadius: 12,
    padding: 14,
    fontSize: 15,
    color: Colors.text,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  savePickupDetailsBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.primary,
    borderRadius: 12,
    padding: 16,
    gap: 8,
    marginTop: 8,
  },
  savePickupDetailsBtnDisabled: {
    backgroundColor: Colors.textTertiary,
  },
  savePickupDetailsText: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: Colors.textInverse,
  },
  savedPickupDetailsCard: {
    backgroundColor: Colors.successLight + '30',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: Colors.success + '40',
  },
  savedPickupDetailsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  savedPickupDetailsTitle: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: Colors.success,
  },
  savedDetailsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  savedDetailLabel: {
    fontSize: 14,
    color: Colors.textSecondary,
  },
  savedDetailValue: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: Colors.text,
  },
  savedParcelThumb: {
    width: 60,
    height: 60,
    borderRadius: 8,
  },
  travelModeModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  travelModeModalContent: {
    backgroundColor: Colors.surface,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
    paddingBottom: 40,
  },
  travelModeModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  travelModeModalTitle: {
    fontSize: 18,
    fontWeight: '600' as const,
    color: Colors.text,
  },
  travelModeOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    marginBottom: 8,
    backgroundColor: Colors.surfaceSecondary,
    gap: 12,
  },
  travelModeOptionSelected: {
    backgroundColor: Colors.primaryLight + '30',
    borderWidth: 2,
    borderColor: Colors.primary,
  },
  travelModeOptionText: {
    fontSize: 16,
    color: Colors.text,
    flex: 1,
  },
  travelModeOptionTextSelected: {
    fontWeight: '600' as const,
    color: Colors.primary,
  },
  deliveryOtpCard: {
    backgroundColor: Colors.successLight + '20',
    borderWidth: 1,
    borderColor: Colors.success + '40',
  },
  deliveryOtpValue: {
    color: Colors.success,
  },
  outForDeliveryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.info,
    borderRadius: 14,
    padding: 18,
    gap: 8,
    marginBottom: 16,
  },
  outForDeliveryText: {
    fontSize: 17,
    fontWeight: '600' as const,
    color: Colors.textInverse,
  },
  buttonDisabled: {
    backgroundColor: Colors.textTertiary,
  },
  deliverySection: {
    backgroundColor: Colors.surface,
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    borderWidth: 2,
    borderColor: Colors.success + '30',
  },
  deliverySectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 4,
  },
  deliverySectionTitle: {
    fontSize: 18,
    fontWeight: '700' as const,
    color: Colors.text,
  },
  deliverySectionSubtitle: {
    fontSize: 13,
    color: Colors.textSecondary,
    marginBottom: 16,
    lineHeight: 18,
  },
  captureDeliveryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.info,
    borderRadius: 12,
    padding: 14,
    gap: 8,
    marginBottom: 12,
  },
  captureDeliveryText: {
    fontSize: 15,
    fontWeight: '600' as const,
    color: Colors.textInverse,
  },
});
