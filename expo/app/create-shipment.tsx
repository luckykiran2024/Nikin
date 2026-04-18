import React, { useState, useEffect } from 'react';
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
  Modal,
} from 'react-native';
import { useRouter, Stack } from 'expo-router';
import { Package, AlertTriangle, ChevronDown, Navigation, Calendar, ChevronLeft, ChevronRight, Shield, CheckCircle } from 'lucide-react-native';
import Colors from '@/constants/colors';
import { useAuth } from '@/contexts/AuthContext';
import { useDataStore } from '@/contexts/DataStoreContext';
import LocationSearch from '@/components/LocationSearch';
import { getLocationByName, calculateDistance, IndianLocation } from '@/constants/indianLocations';

const parcelCategories = [
  'Electronics',
  'Documents',
  'Clothing',
  'Food Items',
  'Medicine',
  'Fragile Items',
  'Other',
];

export default function CreateShipmentScreen() {
  const router = useRouter();
  const { user, needsAadhaarVerification, verifyAadhaar } = useAuth();
  const { createShipment } = useDataStore();

  const kycApproved = user?.kycStatus === 'approved';

  const [showAadhaarModal, setShowAadhaarModal] = useState(false);
  const [aadhaarInput, setAadhaarInput] = useState('');
  const [isVerifyingAadhaar, setIsVerifyingAadhaar] = useState(false);

  const [pickupCity, setPickupCity] = useState('');
  const [destinationCity, setDestinationCity] = useState('');
  const [pickupLocation, setPickupLocation] = useState<IndianLocation | undefined>();
  const [destinationLocation, setDestinationLocation] = useState<IndianLocation | undefined>();
  const [pickupAddress, setPickupAddress] = useState('');
  const [destinationAddress, setDestinationAddress] = useState('');
  const [receiverName, setReceiverName] = useState('');
  const [receiverPhone, setReceiverPhone] = useState('');
  const [description, setDescription] = useState('');
  const [weight, setWeight] = useState('');
  const [category, setCategory] = useState('');
  const [estimatedValue, setEstimatedValue] = useState('');
  const [preferredDate, setPreferredDate] = useState('');
  const [isFragile, setIsFragile] = useState(false);
  const [declarationAccepted, setDeclarationAccepted] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const [showCategories, setShowCategories] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);

  const validateAadhaar = (num: string) => {
    const cleaned = num.replace(/\s/g, '');
    return /^\d{12}$/.test(cleaned);
  };

  const formatAadhaar = (text: string) => {
    const cleaned = text.replace(/\D/g, '').slice(0, 12);
    const parts = cleaned.match(/.{1,4}/g);
    return parts ? parts.join(' ') : cleaned;
  };

  const handleVerifyAadhaar = async () => {
    const cleaned = aadhaarInput.replace(/\s/g, '');
    if (!validateAadhaar(cleaned)) {
      Alert.alert('Invalid Aadhaar', 'Please enter a valid 12-digit Aadhaar number');
      return;
    }
    setIsVerifyingAadhaar(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 1500));
      await verifyAadhaar(cleaned);
      setShowAadhaarModal(false);
      Alert.alert('Success', 'Aadhaar verified successfully! You can now create shipments.');
    } catch {
      Alert.alert('Error', 'Failed to verify Aadhaar. Please try again.');
    } finally {
      setIsVerifyingAadhaar(false);
    }
  };
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [currentMonth, setCurrentMonth] = useState(new Date());

  const [distance, setDistance] = useState<number | null>(null);

  // Calculate distance when cities change
  useEffect(() => {
    if (pickupLocation && destinationLocation) {
      const dist = calculateDistance(pickupLocation, destinationLocation);
      setDistance(dist);
    } else {
      setDistance(null);
    }
  }, [pickupLocation, destinationLocation]);

  const handlePickupSelect = (name: string, location?: IndianLocation) => {
    setPickupCity(name);
    setPickupLocation(location || getLocationByName(name));
    if (destinationCity === name) {
      setDestinationCity('');
      setDestinationLocation(undefined);
    }
  };

  const handleDestinationSelect = (name: string, location?: IndianLocation) => {
    setDestinationCity(name);
    setDestinationLocation(location || getLocationByName(name));
  };

  const validateForm = (): boolean => {
    if (!pickupCity) {
      Alert.alert('Error', 'Please select a pickup city');
      return false;
    }
    if (!destinationCity) {
      Alert.alert('Error', 'Please select a destination city');
      return false;
    }
    if (pickupCity === destinationCity) {
      Alert.alert('Error', 'Pickup and destination cities cannot be the same');
      return false;
    }
    if (!receiverName.trim()) {
      Alert.alert('Error', 'Please enter receiver name');
      return false;
    }
    if (!receiverPhone.trim()) {
      Alert.alert('Error', 'Please enter receiver phone number');
      return false;
    }
    if (!description.trim()) {
      Alert.alert('Error', 'Please enter parcel description');
      return false;
    }
    if (!weight || parseFloat(weight) <= 0) {
      Alert.alert('Error', 'Please enter a valid weight');
      return false;
    }
    if (!declarationAccepted) {
      Alert.alert('Declaration Required', 'You must confirm that the parcel does not contain any illegal or restricted items before proceeding.');
      return false;
    }
    return true;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;
    if (!user) return;

    if (!kycApproved) {
      Alert.alert(
        'KYC Required',
        'Complete full KYC (Aadhaar + PAN + Bank) to create a shipment.',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Complete KYC', onPress: () => router.push('/kyc') },
        ]
      );
      return;
    }
    
    if (needsAadhaarVerification) {
      setShowAadhaarModal(true);
      return;
    }

    setIsLoading(true);
    try {
      await createShipment({
        senderId: user.id,
        senderName: user.name,
        pickupCity,
        destinationCity,
        pickupAddress,
        destinationAddress,
        receiverName,
        receiverPhone,
        parcelDetails: {
          description,
          weight: parseFloat(weight),
          dimensions: '',
          category: category || 'General',
          estimatedValue: parseFloat(estimatedValue) || 0,
          fragile: isFragile,
        },
        preferredDate: preferredDate || new Date().toISOString().split('T')[0],
        status: 'created',
      });

      Alert.alert(
        'Success',
        'Your shipment has been created successfully. Travelers will start submitting quotes soon.',
        [{ text: 'OK', onPress: () => router.back() }]
      );
    } catch {
      Alert.alert('Error', 'Failed to create shipment. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ title: 'Create Shipment' }} />
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {!kycApproved && (
            <TouchableOpacity 
              style={styles.aadhaarBanner}
              onPress={() => router.push('/kyc')}
            >
              <Shield size={20} color={Colors.warning} />
              <View style={styles.aadhaarBannerText}>
                <Text style={styles.aadhaarBannerTitle}>KYC Required to Send</Text>
                <Text style={styles.aadhaarBannerSubtitle}>
                  {user?.kycStatus === 'pending'
                    ? 'Your KYC is under review (24-48h). You\u2019ll be able to create shipments once approved.'
                    : 'Verify Aadhaar, PAN & Bank account to unlock shipment creation.'}
                </Text>
              </View>
              <ChevronRight size={20} color={Colors.warning} />
            </TouchableOpacity>
          )}

          {kycApproved && needsAadhaarVerification && (
            <TouchableOpacity 
              style={styles.aadhaarBanner}
              onPress={() => setShowAadhaarModal(true)}
            >
              <Shield size={20} color={Colors.warning} />
              <View style={styles.aadhaarBannerText}>
                <Text style={styles.aadhaarBannerTitle}>Aadhaar Verification Required</Text>
                <Text style={styles.aadhaarBannerSubtitle}>Verify your Aadhaar to create shipments</Text>
              </View>
              <ChevronRight size={20} color={Colors.warning} />
            </TouchableOpacity>
          )}

          {user?.aadhaarVerified && (
            <View style={styles.verifiedBanner}>
              <CheckCircle size={18} color={Colors.success} />
              <Text style={styles.verifiedBannerText}>Aadhaar Verified (XXXX-XXXX-{user.aadhaarNumber})</Text>
            </View>
          )}

          {/* Route Section */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Route Details</Text>

            <Text style={styles.label}>Pickup City *</Text>
            <LocationSearch
              value={pickupCity}
              onSelect={handlePickupSelect}
              placeholder="Search pickup city in India"
              iconColor={Colors.primary}
            />

            <Text style={styles.label}>Destination City *</Text>
            <LocationSearch
              value={destinationCity}
              onSelect={handleDestinationSelect}
              placeholder="Search destination city in India"
              excludeLocation={pickupCity}
              iconColor={Colors.success}
            />

            {/* Distance Display */}
            {distance !== null && (
              <View style={styles.distanceCard}>
                <Navigation size={18} color={Colors.primary} />
                <Text style={styles.distanceText}>
                  Estimated Distance: <Text style={styles.distanceValue}>{distance} km</Text>
                </Text>
              </View>
            )}

            <Text style={styles.label}>Pickup Address</Text>
            <TextInput
              style={styles.textInput}
              placeholder="Enter complete pickup address"
              placeholderTextColor={Colors.textTertiary}
              value={pickupAddress}
              onChangeText={setPickupAddress}
              multiline
            />

            <Text style={styles.label}>Destination Address</Text>
            <TextInput
              style={styles.textInput}
              placeholder="Enter complete destination address"
              placeholderTextColor={Colors.textTertiary}
              value={destinationAddress}
              onChangeText={setDestinationAddress}
              multiline
            />
          </View>

          {/* Receiver Section */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Receiver Details</Text>

            <Text style={styles.label}>Receiver Name *</Text>
            <TextInput
              style={styles.textInput}
              placeholder="Enter receiver's name"
              placeholderTextColor={Colors.textTertiary}
              value={receiverName}
              onChangeText={setReceiverName}
            />

            <Text style={styles.label}>Receiver Phone *</Text>
            <TextInput
              style={styles.textInput}
              placeholder="Enter receiver's phone number"
              placeholderTextColor={Colors.textTertiary}
              value={receiverPhone}
              onChangeText={setReceiverPhone}
              keyboardType="phone-pad"
            />
          </View>

          {/* Parcel Details Section */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Parcel Details</Text>

            <Text style={styles.label}>Description *</Text>
            <TextInput
              style={[styles.textInput, styles.textArea]}
              placeholder="Describe your parcel"
              placeholderTextColor={Colors.textTertiary}
              value={description}
              onChangeText={setDescription}
              multiline
              numberOfLines={3}
            />

            <Text style={styles.label}>Category</Text>
            <TouchableOpacity
              style={styles.selectInput}
              onPress={() => setShowCategories(!showCategories)}
            >
              <Package size={20} color={Colors.primary} />
              <Text style={[styles.selectText, !category && styles.placeholder]}>
                {category || 'Select category'}
              </Text>
              <ChevronDown size={20} color={Colors.textSecondary} />
            </TouchableOpacity>

            {showCategories && (
              <View style={styles.dropdown}>
                {parcelCategories.map((cat) => (
                  <TouchableOpacity
                    key={cat}
                    style={styles.dropdownItem}
                    onPress={() => {
                      setCategory(cat);
                      setShowCategories(false);
                    }}
                  >
                    <Text style={styles.dropdownText}>{cat}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}

            <View style={styles.row}>
              <View style={styles.halfInput}>
                <Text style={styles.label}>Weight (kg) *</Text>
                <TextInput
                  style={styles.textInput}
                  placeholder="e.g., 2.5"
                  placeholderTextColor={Colors.textTertiary}
                  value={weight}
                  onChangeText={setWeight}
                  keyboardType="decimal-pad"
                />
              </View>
              <View style={styles.halfInput}>
                <Text style={styles.label}>Value (₹)</Text>
                <TextInput
                  style={styles.textInput}
                  placeholder="Estimated value"
                  placeholderTextColor={Colors.textTertiary}
                  value={estimatedValue}
                  onChangeText={setEstimatedValue}
                  keyboardType="number-pad"
                />
              </View>
            </View>

            <Text style={styles.label}>Preferred Delivery Date *</Text>
            <TouchableOpacity
              style={styles.selectInput}
              onPress={() => setShowDatePicker(true)}
            >
              <Calendar size={20} color={Colors.primary} />
              <Text style={[styles.selectText, !preferredDate && styles.placeholder]}>
                {preferredDate || 'Select delivery date'}
              </Text>
              <ChevronDown size={20} color={Colors.textSecondary} />
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.fragileToggle}
              onPress={() => setIsFragile(!isFragile)}
            >
              <View style={[styles.checkbox, isFragile && styles.checkboxChecked]}>
                {isFragile && <View style={styles.checkboxInner} />}
              </View>
              <AlertTriangle size={18} color={Colors.warning} />
              <Text style={styles.fragileText}>This parcel contains fragile items</Text>
            </TouchableOpacity>
          </View>

          {/* Mandatory Declaration Section */}
          <View style={styles.declarationSection}>
            <View style={styles.declarationHeader}>
              <Shield size={20} color={Colors.error} />
              <Text style={styles.declarationTitle}>Legal Declaration</Text>
            </View>
            <Text style={styles.declarationBody}>
              By proceeding, I solemnly declare that this parcel does NOT contain any of the following:
            </Text>
            <View style={styles.declarationList}>
              <Text style={styles.declarationItem}>• Illegal drugs, narcotics or psychotropic substances</Text>
              <Text style={styles.declarationItem}>• Weapons, firearms, ammunition or explosives</Text>
              <Text style={styles.declarationItem}>• Flammable, hazardous or toxic materials</Text>
              <Text style={styles.declarationItem}>• Counterfeit goods or stolen items</Text>
              <Text style={styles.declarationItem}>• Live animals, perishables without consent</Text>
              <Text style={styles.declarationItem}>• Any item restricted under Indian law</Text>
            </View>
            <TouchableOpacity
              style={[styles.declarationToggle, declarationAccepted && styles.declarationToggleAccepted]}
              onPress={() => setDeclarationAccepted(!declarationAccepted)}
              testID="declaration-checkbox"
            >
              <View style={[styles.checkbox, declarationAccepted && styles.checkboxChecked]}>
                {declarationAccepted && <View style={styles.checkboxInner} />}
              </View>
              <Text style={styles.declarationAcceptText}>
                I confirm the parcel contains no illegal or restricted items and I take full responsibility for its contents. *
              </Text>
            </TouchableOpacity>
          </View>

          <TouchableOpacity
            style={[styles.submitButton, (isLoading || !kycApproved) && styles.submitButtonDisabled]}
            onPress={handleSubmit}
            disabled={isLoading || !kycApproved}
          >
            <Text style={styles.submitButtonText}>
              {!kycApproved ? 'Complete KYC to Continue' : isLoading ? 'Creating...' : 'Create Shipment'}
            </Text>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>

      <Modal
        visible={showDatePicker}
        transparent
        animationType="slide"
        onRequestClose={() => setShowDatePicker(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.datePickerModal}>
            <Text style={styles.datePickerTitle}>Select Delivery Date</Text>
            
            <View style={styles.calendarHeader}>
              <TouchableOpacity
                style={styles.calendarNavButton}
                onPress={() => {
                  const newMonth = new Date(currentMonth);
                  newMonth.setMonth(newMonth.getMonth() - 1);
                  const today = new Date();
                  if (newMonth.getFullYear() > today.getFullYear() || 
                      (newMonth.getFullYear() === today.getFullYear() && newMonth.getMonth() >= today.getMonth())) {
                    setCurrentMonth(newMonth);
                  }
                }}
              >
                <ChevronLeft size={24} color={Colors.text} />
              </TouchableOpacity>
              <Text style={styles.calendarMonthText}>
                {currentMonth.toLocaleDateString('en-IN', { month: 'long', year: 'numeric' })}
              </Text>
              <TouchableOpacity
                style={styles.calendarNavButton}
                onPress={() => {
                  const newMonth = new Date(currentMonth);
                  newMonth.setMonth(newMonth.getMonth() + 1);
                  setCurrentMonth(newMonth);
                }}
              >
                <ChevronRight size={24} color={Colors.text} />
              </TouchableOpacity>
            </View>

            <View style={styles.calendarWeekDays}>
              {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
                <Text key={day} style={styles.weekDayText}>{day}</Text>
              ))}
            </View>

            <View style={styles.calendarGrid}>
              {(() => {
                const year = currentMonth.getFullYear();
                const month = currentMonth.getMonth();
                const firstDay = new Date(year, month, 1).getDay();
                const daysInMonth = new Date(year, month + 1, 0).getDate();
                const today = new Date();
                today.setHours(0, 0, 0, 0);
                
                const days = [];
                for (let i = 0; i < firstDay; i++) {
                  days.push(<View key={`empty-${i}`} style={styles.calendarDay} />);
                }
                
                for (let day = 1; day <= daysInMonth; day++) {
                  const date = new Date(year, month, day);
                  const isPast = date < today;
                  const isSelected = selectedDate && 
                    selectedDate.getDate() === day && 
                    selectedDate.getMonth() === month && 
                    selectedDate.getFullYear() === year;
                  const isToday = date.getTime() === today.getTime();
                  
                  days.push(
                    <TouchableOpacity
                      key={day}
                      style={[
                        styles.calendarDay,
                        isToday && styles.calendarDayToday,
                        isSelected && styles.calendarDaySelected,
                        isPast && styles.calendarDayDisabled,
                      ]}
                      onPress={() => {
                        if (!isPast) {
                          setSelectedDate(date);
                          const formattedDate = `${String(day).padStart(2, '0')}-${String(month + 1).padStart(2, '0')}-${year}`;
                          setPreferredDate(formattedDate);
                        }
                      }}
                      disabled={isPast}
                    >
                      <Text style={[
                        styles.calendarDayText,
                        isSelected && styles.calendarDayTextSelected,
                        isPast && styles.calendarDayTextDisabled,
                      ]}>
                        {day}
                      </Text>
                    </TouchableOpacity>
                  );
                }
                return days;
              })()}
            </View>

            <View style={styles.datePickerActions}>
              <TouchableOpacity
                style={styles.datePickerCancelButton}
                onPress={() => setShowDatePicker(false)}
              >
                <Text style={styles.datePickerCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.datePickerConfirmButton,
                  !selectedDate && styles.datePickerConfirmButtonDisabled
                ]}
                onPress={() => {
                  if (selectedDate) {
                    setShowDatePicker(false);
                  }
                }}
                disabled={!selectedDate}
              >
                <Text style={styles.datePickerConfirmText}>Confirm</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Aadhaar Verification Modal */}
      <Modal
        visible={showAadhaarModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowAadhaarModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.aadhaarModal}>
            <View style={styles.aadhaarModalHeader}>
              <Shield size={32} color={Colors.primary} />
              <Text style={styles.aadhaarModalTitle}>Aadhaar Verification</Text>
              <Text style={styles.aadhaarModalSubtitle}>
                Verify your Aadhaar to ensure secure transactions
              </Text>
            </View>

            <View style={styles.aadhaarInputContainer}>
              <Text style={styles.aadhaarInputLabel}>Enter 12-digit Aadhaar Number</Text>
              <TextInput
                style={styles.aadhaarInput}
                placeholder="XXXX XXXX XXXX"
                placeholderTextColor={Colors.textTertiary}
                value={aadhaarInput}
                onChangeText={(text) => setAadhaarInput(formatAadhaar(text))}
                keyboardType="numeric"
                maxLength={14}
              />
              {aadhaarInput.length > 0 && (
                <View style={styles.aadhaarValidation}>
                  {validateAadhaar(aadhaarInput) ? (
                    <>
                      <CheckCircle size={16} color={Colors.success} />
                      <Text style={[styles.aadhaarValidationText, { color: Colors.success }]}>Valid Aadhaar format</Text>
                    </>
                  ) : (
                    <>
                      <AlertTriangle size={16} color={Colors.warning} />
                      <Text style={[styles.aadhaarValidationText, { color: Colors.warning }]}>Enter 12 digits</Text>
                    </>
                  )}
                </View>
              )}
            </View>

            <View style={styles.aadhaarModalActions}>
              <TouchableOpacity
                style={styles.aadhaarCancelButton}
                onPress={() => setShowAadhaarModal(false)}
              >
                <Text style={styles.aadhaarCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.aadhaarVerifyButton,
                  (!validateAadhaar(aadhaarInput) || isVerifyingAadhaar) && styles.aadhaarVerifyButtonDisabled
                ]}
                onPress={handleVerifyAadhaar}
                disabled={!validateAadhaar(aadhaarInput) || isVerifyingAadhaar}
              >
                <Text style={styles.aadhaarVerifyText}>
                  {isVerifyingAadhaar ? 'Verifying...' : 'Verify Aadhaar'}
                </Text>
              </TouchableOpacity>
            </View>
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
  keyboardView: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
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
  textInput: {
    backgroundColor: Colors.surfaceSecondary,
    borderRadius: 12,
    padding: 14,
    fontSize: 16,
    color: Colors.text,
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: 16,
  },
  textArea: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  selectInput: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surfaceSecondary,
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: 16,
    gap: 10,
  },
  selectText: {
    flex: 1,
    fontSize: 16,
    color: Colors.text,
  },
  placeholder: {
    color: Colors.textTertiary,
  },
  dropdown: {
    backgroundColor: Colors.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.border,
    marginTop: -12,
    marginBottom: 16,
    maxHeight: 200,
    overflow: 'hidden',
  },
  dropdownScroll: {
    maxHeight: 200,
  },
  dropdownItem: {
    padding: 14,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  dropdownText: {
    fontSize: 15,
    color: Colors.text,
  },
  distanceCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.primaryLight + '20',
    padding: 12,
    borderRadius: 10,
    marginBottom: 16,
    gap: 8,
  },
  distanceText: {
    fontSize: 14,
    color: Colors.text,
  },
  distanceValue: {
    fontWeight: '600' as const,
    color: Colors.primary,
  },
  row: {
    flexDirection: 'row',
    gap: 12,
  },
  halfInput: {
    flex: 1,
  },
  fragileToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 8,
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: Colors.border,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxChecked: {
    borderColor: Colors.primary,
    backgroundColor: Colors.primary,
  },
  checkboxInner: {
    width: 10,
    height: 10,
    borderRadius: 2,
    backgroundColor: Colors.textInverse,
  },
  fragileText: {
    flex: 1,
    fontSize: 14,
    color: Colors.text,
  },
  declarationSection: {
    backgroundColor: Colors.warningLight,
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: Colors.warning,
  },
  declarationHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 10,
  },
  declarationTitle: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: Colors.text,
  },
  declarationBody: {
    fontSize: 13,
    color: Colors.text,
    lineHeight: 18,
    marginBottom: 8,
  },
  declarationList: {
    marginBottom: 12,
  },
  declarationItem: {
    fontSize: 12,
    color: Colors.textSecondary,
    lineHeight: 20,
  },
  declarationToggle: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    backgroundColor: Colors.surface,
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  declarationToggleAccepted: {
    borderColor: Colors.success,
    backgroundColor: Colors.successLight,
  },
  declarationAcceptText: {
    flex: 1,
    fontSize: 13,
    color: Colors.text,
    fontWeight: '500' as const,
    lineHeight: 18,
  },
  submitButton: {
    backgroundColor: Colors.primary,
    borderRadius: 14,
    padding: 18,
    alignItems: 'center',
    marginTop: 8,
  },
  submitButtonDisabled: {
    opacity: 0.7,
  },
  submitButtonText: {
    fontSize: 17,
    fontWeight: '600' as const,
    color: Colors.textInverse,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  datePickerModal: {
    backgroundColor: Colors.surface,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
  },
  datePickerTitle: {
    fontSize: 18,
    fontWeight: '600' as const,
    color: Colors.text,
    textAlign: 'center',
    marginBottom: 20,
  },
  calendarHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  calendarNavButton: {
    padding: 8,
  },
  calendarMonthText: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: Colors.text,
  },
  calendarWeekDays: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  weekDayText: {
    flex: 1,
    textAlign: 'center',
    fontSize: 12,
    fontWeight: '500' as const,
    color: Colors.textSecondary,
  },
  calendarGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  calendarDay: {
    width: '14.28%',
    aspectRatio: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  calendarDayToday: {
    borderWidth: 1,
    borderColor: Colors.primary,
    borderRadius: 20,
  },
  calendarDaySelected: {
    backgroundColor: Colors.primary,
    borderRadius: 20,
  },
  calendarDayDisabled: {
    opacity: 0.3,
  },
  calendarDayText: {
    fontSize: 14,
    color: Colors.text,
  },
  calendarDayTextSelected: {
    color: Colors.textInverse,
    fontWeight: '600' as const,
  },
  calendarDayTextDisabled: {
    color: Colors.textTertiary,
  },
  datePickerActions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 20,
  },
  datePickerCancelButton: {
    flex: 1,
    backgroundColor: Colors.surfaceSecondary,
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
  },
  datePickerCancelText: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: Colors.textSecondary,
  },
  datePickerConfirmButton: {
    flex: 1,
    backgroundColor: Colors.primary,
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
  },
  datePickerConfirmButtonDisabled: {
    backgroundColor: Colors.textTertiary,
  },
  datePickerConfirmText: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: Colors.textInverse,
  },
  aadhaarBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.warningLight,
    padding: 14,
    borderRadius: 12,
    marginBottom: 16,
    gap: 12,
  },
  aadhaarBannerText: {
    flex: 1,
  },
  aadhaarBannerTitle: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: Colors.warning,
  },
  aadhaarBannerSubtitle: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  verifiedBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.successLight,
    padding: 12,
    borderRadius: 10,
    marginBottom: 16,
    gap: 8,
  },
  verifiedBannerText: {
    fontSize: 13,
    fontWeight: '500' as const,
    color: Colors.success,
  },
  aadhaarModal: {
    backgroundColor: Colors.surface,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
  },
  aadhaarModalHeader: {
    alignItems: 'center',
    marginBottom: 24,
  },
  aadhaarModalTitle: {
    fontSize: 20,
    fontWeight: '700' as const,
    color: Colors.text,
    marginTop: 12,
  },
  aadhaarModalSubtitle: {
    fontSize: 14,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginTop: 8,
    lineHeight: 20,
  },
  aadhaarInputContainer: {
    marginBottom: 24,
  },
  aadhaarInputLabel: {
    fontSize: 14,
    fontWeight: '500' as const,
    color: Colors.textSecondary,
    marginBottom: 8,
  },
  aadhaarInput: {
    backgroundColor: Colors.surfaceSecondary,
    borderRadius: 12,
    padding: 16,
    fontSize: 18,
    color: Colors.text,
    textAlign: 'center',
    letterSpacing: 2,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  aadhaarValidation: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
    gap: 6,
  },
  aadhaarValidationText: {
    fontSize: 13,
  },
  aadhaarModalActions: {
    flexDirection: 'row',
    gap: 12,
  },
  aadhaarCancelButton: {
    flex: 1,
    backgroundColor: Colors.surfaceSecondary,
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
  },
  aadhaarCancelText: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: Colors.textSecondary,
  },
  aadhaarVerifyButton: {
    flex: 1,
    backgroundColor: Colors.primary,
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
  },
  aadhaarVerifyButtonDisabled: {
    backgroundColor: Colors.textTertiary,
  },
  aadhaarVerifyText: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: Colors.textInverse,
  },
});
