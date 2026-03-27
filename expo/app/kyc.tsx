import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Modal,
  TextInput,
} from 'react-native';
import { useRouter, Stack } from 'expo-router';
import {
  Shield,
  Upload,
  Camera,
  CheckCircle,
  Clock,
  XCircle,
  Mail,
  AlertTriangle,
  X,
} from 'lucide-react-native';
import Colors from '@/constants/colors';
import { useAuth } from '@/contexts/AuthContext';
import { useDataStore } from '@/contexts/DataStoreContext';

export default function KYCScreen() {
  const router = useRouter();
  const { user, updateKYCStatus } = useAuth();
  const { submitKYCRequest, cancelKYCRequest } = useDataStore();
  
  const [aadhaarNumber, setAadhaarNumber] = useState('');
  const [panNumber, setPanNumber] = useState('');
  const [passportNumber, setPassportNumber] = useState('');
  const [drivingLicenseNumber, setDrivingLicenseNumber] = useState('');
  const [uploadedAadhaar, setUploadedAadhaar] = useState(false);
  const [uploadedPan, setUploadedPan] = useState(false);
  const [uploadedPassport, setUploadedPassport] = useState(false);
  const [uploadedDL, setUploadedDL] = useState(false);
  const [uploadedSelfie, setUploadedSelfie] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const validateAadhaar = (num: string) => {
    const cleaned = num.replace(/\s/g, '');
    return /^\d{12}$/.test(cleaned);
  };

  const validatePAN = (num: string) => {
    return /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/.test(num.toUpperCase());
  };

  const formatAadhaar = (text: string) => {
    const cleaned = text.replace(/\D/g, '').slice(0, 12);
    const parts = cleaned.match(/.{1,4}/g);
    return parts ? parts.join(' ') : cleaned;
  };

  const handleUploadDocument = (type: 'aadhaar' | 'pan' | 'passport' | 'dl') => {
    Alert.alert(
      'Upload Document',
      'Choose how to upload your document',
      [
        { 
          text: 'Camera', 
          onPress: () => {
            if (type === 'aadhaar') setUploadedAadhaar(true);
            else if (type === 'pan') setUploadedPan(true);
            else if (type === 'passport') setUploadedPassport(true);
            else if (type === 'dl') setUploadedDL(true);
          } 
        },
        { 
          text: 'Gallery', 
          onPress: () => {
            if (type === 'aadhaar') setUploadedAadhaar(true);
            else if (type === 'pan') setUploadedPan(true);
            else if (type === 'passport') setUploadedPassport(true);
            else if (type === 'dl') setUploadedDL(true);
          } 
        },
        { text: 'Cancel', style: 'cancel' },
      ]
    );
  };

  const handleUploadSelfie = () => {
    Alert.alert(
      'Take Selfie',
      'Take a clear photo of your face for verification',
      [
        { text: 'Open Camera', onPress: () => setUploadedSelfie(true) },
        { text: 'Cancel', style: 'cancel' },
      ]
    );
  };

  const handleSubmit = async () => {
    if (!validateAadhaar(aadhaarNumber)) {
      Alert.alert('Invalid Aadhaar', 'Please enter a valid 12-digit Aadhaar number');
      return;
    }
    if (!validatePAN(panNumber)) {
      Alert.alert('Invalid PAN', 'Please enter a valid PAN number (e.g., ABCDE1234F)');
      return;
    }
    if (!uploadedAadhaar || !uploadedPan) {
      Alert.alert('Documents Required', 'Please upload both Aadhaar and PAN card documents');
      return;
    }
    if (!uploadedSelfie) {
      Alert.alert('Selfie Required', 'Please take a selfie for identity verification');
      return;
    }

    setIsSubmitting(true);
    try {
      await submitKYCRequest({
        userId: user!.id,
        userName: user!.name,
        userEmail: user!.email,
        userPhone: user!.phone,
        userRole: user!.activeRole,
        avatar: user!.avatarUrl,
        aadhaarNumber: aadhaarNumber.replace(/\s/g, ''),
        panNumber: panNumber.toUpperCase(),
        passportNumber: passportNumber || undefined,
        drivingLicenseNumber: drivingLicenseNumber || undefined,
        selfieUploaded: true,
      });
      await updateKYCStatus('pending');
      setShowSuccessModal(true);
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to submit KYC. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancelKYC = () => {
    Alert.alert(
      'Cancel KYC Request',
      'Are you sure you want to cancel your KYC verification request? You can submit a new request anytime.',
      [
        { text: 'No, Keep It', style: 'cancel' },
        {
          text: 'Yes, Cancel',
          style: 'destructive',
          onPress: async () => {
            try {
              await cancelKYCRequest(user!.id);
              await updateKYCStatus('not_submitted');
              Alert.alert('Cancelled', 'Your KYC request has been cancelled.');
            } catch {
              Alert.alert('Error', 'Failed to cancel KYC request.');
            }
          },
        },
      ]
    );
  };

  const handleGoToDashboard = () => {
    setShowSuccessModal(false);
    router.replace('/(tabs)/dashboard');
  };

  const getStatusBanner = () => {
    switch (user?.kycStatus) {
      case 'approved':
        return (
          <View style={[styles.statusBanner, { backgroundColor: Colors.successLight }]}>
            <CheckCircle size={24} color={Colors.success} />
            <View style={styles.statusText}>
              <Text style={[styles.statusTitle, { color: Colors.success }]}>KYC Verified</Text>
              <Text style={styles.statusSubtitle}>Your identity has been verified successfully</Text>
            </View>
          </View>
        );
      case 'pending':
        return (
          <View style={[styles.statusBanner, { backgroundColor: Colors.warningLight }]}>
            <Clock size={24} color={Colors.warning} />
            <View style={styles.statusText}>
              <Text style={[styles.statusTitle, { color: Colors.warning }]}>Under Review</Text>
              <Text style={styles.statusSubtitle}>Your documents are being verified (24-48 hours)</Text>
            </View>
          </View>
        );
      case 'rejected':
        return (
          <View style={[styles.statusBanner, { backgroundColor: Colors.errorLight }]}>
            <XCircle size={24} color={Colors.error} />
            <View style={styles.statusText}>
              <Text style={[styles.statusTitle, { color: Colors.error }]}>Verification Failed</Text>
              <Text style={styles.statusSubtitle}>Please re-submit your documents</Text>
            </View>
          </View>
        );
      default:
        return null;
    }
  };

  if (user?.kycStatus === 'approved') {
    return (
      <View style={styles.container}>
        <Stack.Screen options={{ title: 'KYC Verification' }} />
        <View style={styles.verifiedContainer}>
          <View style={styles.verifiedIcon}>
            <CheckCircle size={64} color={Colors.success} />
          </View>
          <Text style={styles.verifiedTitle}>Identity Verified</Text>
          <Text style={styles.verifiedSubtitle}>
            Your KYC verification is complete. You can now send and deliver parcels on the platform.
          </Text>
          <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
            <Text style={styles.backButtonText}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  if (user?.kycStatus === 'pending') {
    return (
      <View style={styles.container}>
        <Stack.Screen options={{ title: 'KYC Verification' }} />
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {getStatusBanner()}

          <View style={styles.pendingContent}>
            <Clock size={64} color={Colors.warning} />
            <Text style={styles.pendingTitle}>Verification in Progress</Text>
            <Text style={styles.pendingText}>
              Our team is reviewing your documents. This typically takes 24-48 hours. 
              You will receive an email once approved.
            </Text>
          </View>

          <View style={styles.pendingActions}>
            <TouchableOpacity 
              style={styles.homeButton} 
              onPress={() => router.replace('/(tabs)/dashboard')}
            >
              <Text style={styles.homeButtonText}>Go to Dashboard</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.cancelKycButton} 
              onPress={handleCancelKYC}
            >
              <X size={18} color={Colors.error} />
              <Text style={styles.cancelKycButtonText}>Cancel KYC Request</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ title: 'KYC Verification' }} />
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {getStatusBanner()}

        <View style={styles.infoCard}>
          <Shield size={24} color={Colors.primary} />
          <View style={styles.infoContent}>
            <Text style={styles.infoTitle}>Why KYC?</Text>
            <Text style={styles.infoText}>
              KYC verification helps us maintain trust and safety on the platform. 
              Verified users can send parcels and earn by delivering.
            </Text>
          </View>
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Aadhaar Card</Text>
            <Text style={styles.requiredBadge}>Required</Text>
          </View>
          <View style={styles.inputContainer}>
            <TextInput
              style={styles.input}
              placeholder="Enter 12-digit Aadhaar number"
              placeholderTextColor={Colors.textTertiary}
              value={aadhaarNumber}
              onChangeText={(text) => setAadhaarNumber(formatAadhaar(text))}
              keyboardType="numeric"
              maxLength={14}
            />
            {aadhaarNumber.length > 0 && (
              <View style={styles.validationIcon}>
                {validateAadhaar(aadhaarNumber) ? (
                  <CheckCircle size={18} color={Colors.success} />
                ) : (
                  <AlertTriangle size={18} color={Colors.warning} />
                )}
              </View>
            )}
          </View>
          <TouchableOpacity
            style={[styles.uploadCard, uploadedAadhaar && styles.uploadCardDone]}
            onPress={() => handleUploadDocument('aadhaar')}
          >
            {uploadedAadhaar ? (
              <CheckCircle size={28} color={Colors.success} />
            ) : (
              <Upload size={28} color={Colors.primary} />
            )}
            <Text style={[styles.uploadText, uploadedAadhaar && { color: Colors.success }]}>
              {uploadedAadhaar ? 'Aadhaar Uploaded' : 'Upload Aadhaar Photo'}
            </Text>
          </TouchableOpacity>
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>PAN Card</Text>
            <Text style={styles.requiredBadge}>Required</Text>
          </View>
          <View style={styles.inputContainer}>
            <TextInput
              style={styles.input}
              placeholder="Enter PAN number (e.g., ABCDE1234F)"
              placeholderTextColor={Colors.textTertiary}
              value={panNumber}
              onChangeText={(text) => setPanNumber(text.toUpperCase().slice(0, 10))}
              autoCapitalize="characters"
              maxLength={10}
            />
            {panNumber.length > 0 && (
              <View style={styles.validationIcon}>
                {validatePAN(panNumber) ? (
                  <CheckCircle size={18} color={Colors.success} />
                ) : (
                  <AlertTriangle size={18} color={Colors.warning} />
                )}
              </View>
            )}
          </View>
          <TouchableOpacity
            style={[styles.uploadCard, uploadedPan && styles.uploadCardDone]}
            onPress={() => handleUploadDocument('pan')}
          >
            {uploadedPan ? (
              <CheckCircle size={28} color={Colors.success} />
            ) : (
              <Upload size={28} color={Colors.primary} />
            )}
            <Text style={[styles.uploadText, uploadedPan && { color: Colors.success }]}>
              {uploadedPan ? 'PAN Uploaded' : 'Upload PAN Photo'}
            </Text>
          </TouchableOpacity>
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Passport</Text>
            <Text style={styles.optionalBadge}>Optional</Text>
          </View>
          <View style={styles.inputContainer}>
            <TextInput
              style={styles.input}
              placeholder="Enter Passport number (optional)"
              placeholderTextColor={Colors.textTertiary}
              value={passportNumber}
              onChangeText={setPassportNumber}
              autoCapitalize="characters"
            />
          </View>
          {passportNumber.length > 0 && (
            <TouchableOpacity
              style={[styles.uploadCard, uploadedPassport && styles.uploadCardDone]}
              onPress={() => handleUploadDocument('passport')}
            >
              {uploadedPassport ? (
                <CheckCircle size={28} color={Colors.success} />
              ) : (
                <Upload size={28} color={Colors.textSecondary} />
              )}
              <Text style={[styles.uploadText, uploadedPassport && { color: Colors.success }]}>
                {uploadedPassport ? 'Passport Uploaded' : 'Upload Passport Photo'}
              </Text>
            </TouchableOpacity>
          )}
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Driving License</Text>
            <Text style={styles.optionalBadge}>Optional</Text>
          </View>
          <View style={styles.inputContainer}>
            <TextInput
              style={styles.input}
              placeholder="Enter DL number (optional)"
              placeholderTextColor={Colors.textTertiary}
              value={drivingLicenseNumber}
              onChangeText={setDrivingLicenseNumber}
              autoCapitalize="characters"
            />
          </View>
          {drivingLicenseNumber.length > 0 && (
            <TouchableOpacity
              style={[styles.uploadCard, uploadedDL && styles.uploadCardDone]}
              onPress={() => handleUploadDocument('dl')}
            >
              {uploadedDL ? (
                <CheckCircle size={28} color={Colors.success} />
              ) : (
                <Upload size={28} color={Colors.textSecondary} />
              )}
              <Text style={[styles.uploadText, uploadedDL && { color: Colors.success }]}>
                {uploadedDL ? 'DL Uploaded' : 'Upload DL Photo'}
              </Text>
            </TouchableOpacity>
          )}
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Selfie Verification</Text>
            <Text style={styles.requiredBadge}>Required</Text>
          </View>
          <TouchableOpacity
            style={[styles.uploadCard, uploadedSelfie && styles.uploadCardDone]}
            onPress={handleUploadSelfie}
          >
            {uploadedSelfie ? (
              <CheckCircle size={28} color={Colors.success} />
            ) : (
              <Camera size={28} color={Colors.primary} />
            )}
            <Text style={[styles.uploadText, uploadedSelfie && { color: Colors.success }]}>
              {uploadedSelfie ? 'Selfie Captured' : 'Take a Selfie'}
            </Text>
            <Text style={styles.uploadHint}>
              {uploadedSelfie ? 'Tap to retake' : 'For identity matching'}
            </Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity
          style={[
            styles.submitButton,
            (!validateAadhaar(aadhaarNumber) || !validatePAN(panNumber) || !uploadedAadhaar || !uploadedPan || !uploadedSelfie || isSubmitting) && styles.submitButtonDisabled,
          ]}
          onPress={handleSubmit}
          disabled={!validateAadhaar(aadhaarNumber) || !validatePAN(panNumber) || !uploadedAadhaar || !uploadedPan || !uploadedSelfie || isSubmitting}
        >
          <Text style={styles.submitButtonText}>
            {isSubmitting ? 'Submitting...' : 'Submit for Verification'}
          </Text>
        </TouchableOpacity>
      </ScrollView>

      <Modal
        visible={showSuccessModal}
        transparent
        animationType="fade"
        onRequestClose={() => {}}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.successModal}>
            <View style={styles.successIconContainer}>
              <Mail size={48} color={Colors.primary} />
            </View>
            <Text style={styles.successTitle}>KYC Request Submitted!</Text>
            <Text style={styles.successMessage}>
              Your verification documents have been submitted successfully.
            </Text>
            <View style={styles.emailNotice}>
              <Mail size={20} color={Colors.info} />
              <Text style={styles.emailNoticeText}>
                You will receive an email confirmation once our team approves or rejects your KYC request.
              </Text>
            </View>
            <Text style={styles.processingTime}>
              Processing time: 24-48 hours
            </Text>
            <TouchableOpacity
              style={styles.dashboardButton}
              onPress={handleGoToDashboard}
            >
              <Text style={styles.dashboardButtonText}>Go to Dashboard</Text>
            </TouchableOpacity>
            <Text style={styles.dashboardNote}>
              You can check your KYC status anytime from the dashboard.
            </Text>
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
  statusBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 16,
    borderRadius: 12,
    marginBottom: 20,
  },
  statusText: {
    flex: 1,
  },
  statusTitle: {
    fontSize: 16,
    fontWeight: '600' as const,
  },
  statusSubtitle: {
    fontSize: 13,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  verifiedContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  verifiedIcon: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: Colors.successLight,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  verifiedTitle: {
    fontSize: 24,
    fontWeight: '700' as const,
    color: Colors.text,
    marginBottom: 12,
  },
  verifiedSubtitle: {
    fontSize: 16,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 32,
  },
  backButton: {
    backgroundColor: Colors.primary,
    paddingHorizontal: 32,
    paddingVertical: 14,
    borderRadius: 12,
  },
  backButtonText: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: Colors.textInverse,
  },
  infoCard: {
    flexDirection: 'row',
    backgroundColor: Colors.primaryLight + '20',
    borderRadius: 16,
    padding: 16,
    marginBottom: 20,
    gap: 12,
  },
  infoContent: {
    flex: 1,
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: Colors.primary,
    marginBottom: 4,
  },
  infoText: {
    fontSize: 14,
    color: Colors.primaryDark,
    lineHeight: 20,
  },
  section: {
    backgroundColor: Colors.surface,
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: Colors.text,
  },
  requiredBadge: {
    fontSize: 11,
    fontWeight: '600' as const,
    color: Colors.error,
    backgroundColor: Colors.errorLight,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  optionalBadge: {
    fontSize: 11,
    fontWeight: '600' as const,
    color: Colors.textSecondary,
    backgroundColor: Colors.surfaceSecondary,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surfaceSecondary,
    borderRadius: 12,
    marginBottom: 12,
  },
  input: {
    flex: 1,
    padding: 14,
    fontSize: 15,
    color: Colors.text,
  },
  validationIcon: {
    paddingRight: 14,
  },
  uploadCard: {
    alignItems: 'center',
    padding: 20,
    backgroundColor: Colors.surfaceSecondary,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: Colors.border,
    borderStyle: 'dashed' as const,
  },
  uploadCardDone: {
    borderColor: Colors.success,
    backgroundColor: Colors.successLight,
    borderStyle: 'solid' as const,
  },
  uploadText: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: Colors.text,
    marginTop: 8,
  },
  uploadHint: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginTop: 4,
  },
  submitButton: {
    backgroundColor: Colors.primary,
    borderRadius: 14,
    padding: 18,
    alignItems: 'center',
    marginTop: 8,
  },
  submitButtonDisabled: {
    backgroundColor: Colors.textTertiary,
  },
  submitButtonText: {
    fontSize: 17,
    fontWeight: '600' as const,
    color: Colors.textInverse,
  },
  pendingContent: {
    alignItems: 'center',
    padding: 32,
    marginTop: 20,
  },
  pendingTitle: {
    fontSize: 20,
    fontWeight: '600' as const,
    color: Colors.text,
    marginTop: 24,
    marginBottom: 12,
  },
  pendingText: {
    fontSize: 15,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
  },
  pendingActions: {
    gap: 12,
    marginTop: 20,
  },
  homeButton: {
    backgroundColor: Colors.primary,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  homeButtonText: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: Colors.textInverse,
  },
  cancelKycButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.errorLight,
    paddingVertical: 14,
    borderRadius: 12,
    gap: 8,
  },
  cancelKycButtonText: {
    fontSize: 15,
    fontWeight: '600' as const,
    color: Colors.error,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  successModal: {
    backgroundColor: Colors.surface,
    borderRadius: 24,
    padding: 28,
    width: '100%',
    alignItems: 'center',
  },
  successIconContainer: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: Colors.primaryLight + '30',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  successTitle: {
    fontSize: 22,
    fontWeight: '700' as const,
    color: Colors.text,
    marginBottom: 12,
    textAlign: 'center',
  },
  successMessage: {
    fontSize: 15,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 20,
  },
  emailNotice: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: Colors.infoLight,
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
    gap: 12,
  },
  emailNoticeText: {
    flex: 1,
    fontSize: 14,
    color: Colors.info,
    lineHeight: 20,
  },
  processingTime: {
    fontSize: 13,
    color: Colors.textTertiary,
    marginBottom: 24,
  },
  dashboardButton: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.primary,
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 14,
    width: '100%',
  },
  dashboardButtonText: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: Colors.textInverse,
  },
  dashboardNote: {
    fontSize: 12,
    color: Colors.textTertiary,
    textAlign: 'center',
    marginTop: 12,
    lineHeight: 18,
  },
});
