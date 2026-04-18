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
  Landmark,
  CreditCard,
} from 'lucide-react-native';
import Colors from '@/constants/colors';
import { useAuth } from '@/contexts/AuthContext';
import { useDataStore } from '@/contexts/DataStoreContext';
import { getSupabaseClient, isSupabaseConfigured } from '@/lib/supabase';
import { trpc } from '@/lib/trpc';
import {
  isValidAadhaarChecksum,
  isValidBankAccount,
  isValidIFSC,
  isValidPAN,
  sendAadhaarOTP,
  verifyAadhaarOTP,
  verifyBankAccount,
  verifyKYC,
  verifyPAN,
} from '@/lib/kyc-provider';

export default function KYCScreen() {
  const router = useRouter();
  const { user, updateKYCStatus } = useAuth();
  const { submitKYCRequest, cancelKYCRequest } = useDataStore();
  const utils = trpc.useUtils();
  const [isCancelling, setIsCancelling] = useState<boolean>(false);
  
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

  const [otpSent, setOtpSent] = useState(false);
  const [otpVerified, setOtpVerified] = useState(false);
  const [otpInput, setOtpInput] = useState('');
  const [otpRefId, setOtpRefId] = useState('');
  const [expectedOtp, setExpectedOtp] = useState('');
  const [otpLoading, setOtpLoading] = useState(false);
  const [otpAttempts, setOtpAttempts] = useState(0);

  const [nameOnPan, setNameOnPan] = useState('');
  const [panVerifying, setPanVerifying] = useState(false);
  const [panVerified, setPanVerified] = useState(false);

  const [bankAccountNumber, setBankAccountNumber] = useState('');
  const [bankAccountConfirm, setBankAccountConfirm] = useState('');
  const [ifsc, setIfsc] = useState('');
  const [bankHolderName, setBankHolderName] = useState('');
  const [bankVerifying, setBankVerifying] = useState(false);
  const [bankVerified, setBankVerified] = useState(false);
  const [bankName, setBankName] = useState<string>('');

  const validateAadhaar = (num: string) => isValidAadhaarChecksum(num);
  const validatePAN = (num: string) => isValidPAN(num);

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

  const handleSendOTP = async () => {
    if (!validateAadhaar(aadhaarNumber)) {
      Alert.alert('Invalid Aadhaar', 'Please enter a valid 12-digit Aadhaar number (checksum failed)');
      return;
    }
    setOtpLoading(true);
    try {
      const res = await sendAadhaarOTP(aadhaarNumber);
      if (!res.success) {
        Alert.alert('OTP Failed', res.message);
        return;
      }
      setOtpSent(true);
      setOtpRefId(res.referenceId);
      setExpectedOtp(res.otp ?? '');
      setOtpAttempts(0);
      Alert.alert('OTP Sent', res.message);
    } catch (e: any) {
      Alert.alert('Error', e?.message ?? 'Failed to send OTP');
    } finally {
      setOtpLoading(false);
    }
  };

  const handleVerifyOTP = async () => {
    if (otpAttempts >= 5) {
      Alert.alert('Locked', 'Too many attempts. Please resend OTP.');
      return;
    }
    setOtpLoading(true);
    try {
      const res = await verifyAadhaarOTP(otpRefId, otpInput, expectedOtp);
      if (!res.success) {
        setOtpAttempts((a) => a + 1);
        Alert.alert('Verification Failed', res.message);
        return;
      }
      setOtpVerified(true);
      Alert.alert('Verified', 'Aadhaar OTP verified successfully');
    } finally {
      setOtpLoading(false);
    }
  };

  const handleVerifyPAN = async () => {
    if (!validatePAN(panNumber)) {
      Alert.alert('Invalid PAN', 'Please enter a valid PAN (ABCDE1234F)');
      return;
    }
    if (!nameOnPan.trim()) {
      Alert.alert('Name Required', 'Please enter name as on PAN card');
      return;
    }
    setPanVerifying(true);
    try {
      const res = await verifyPAN(panNumber.toUpperCase(), nameOnPan.trim());
      if (!res.success) {
        Alert.alert('PAN Verification Failed', res.message);
        return;
      }
      setPanVerified(true);
      Alert.alert('Verified', 'PAN verified successfully');
    } finally {
      setPanVerifying(false);
    }
  };

  const handleVerifyBank = async () => {
    const cleanAcc = bankAccountNumber.replace(/\s/g, '');
    const cleanConfirm = bankAccountConfirm.replace(/\s/g, '');
    if (!isValidBankAccount(cleanAcc)) {
      Alert.alert('Invalid Account', 'Account number must be 9-18 digits');
      return;
    }
    if (cleanAcc !== cleanConfirm) {
      Alert.alert('Mismatch', 'Account numbers do not match');
      return;
    }
    if (!isValidIFSC(ifsc)) {
      Alert.alert('Invalid IFSC', 'IFSC should be like HDFC0001234');
      return;
    }
    if (!bankHolderName.trim()) {
      Alert.alert('Name Required', 'Enter account holder name');
      return;
    }
    setBankVerifying(true);
    try {
      const res = await verifyBankAccount(cleanAcc, ifsc.toUpperCase(), bankHolderName.trim());
      if (!res.success) {
        Alert.alert('Bank Verification Failed', res.message);
        return;
      }
      setBankVerified(true);
      setBankName(res.bankName ?? '');
      Alert.alert('Verified', `Bank account verified (${res.bankName ?? 'Bank'})`);
    } finally {
      setBankVerifying(false);
    }
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
    if (!panVerified) {
      Alert.alert('PAN Required', 'Please verify your PAN card before submitting');
      return;
    }
    if (!bankVerified) {
      Alert.alert('Bank Required', 'Please verify your bank account before submitting');
      return;
    }
    if (!otpVerified) {
      Alert.alert('OTP Required', 'Please verify Aadhaar via OTP before submitting');
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
      const verification = await verifyKYC({
        aadhaarNumber: aadhaarNumber.replace(/\s/g, ''),
        panNumber: panNumber.toUpperCase(),
        passportNumber: passportNumber || undefined,
        drivingLicenseNumber: drivingLicenseNumber || undefined,
        selfieUploaded: uploadedSelfie,
        otpVerified,
        panVerified,
        bankVerified,
      });
      console.log('[KYC] verification result', verification);
      if (!verification.success) {
        Alert.alert('Verification Failed', verification.message);
        setIsSubmitting(false);
        return;
      }
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
        bankAccountNumber: bankAccountNumber.replace(/\s/g, ''),
        bankIfsc: ifsc.toUpperCase(),
        bankAccountHolder: bankHolderName.trim(),
        bankVerified: true,
      });
      await updateKYCStatus('pending');
      console.log('[KYC] submitted with ref', verification.referenceId, 'score', verification.confidenceScore);
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
            if (!user?.id) {
              Alert.alert('Error', 'User not found.');
              return;
            }
            setIsCancelling(true);
            let backendOk = false;
            try {
              await cancelKYCRequest(user.id);
              backendOk = true;
              console.log('[KYC cancel] backend succeeded');
            } catch (err: any) {
              console.log('[KYC cancel] backend failed:', err?.message || err);
            }

            if (!backendOk && isSupabaseConfigured()) {
              try {
                const client = getSupabaseClient();
                if (client) {
                  const { error: delErr } = await client
                    .from('kyc_requests')
                    .delete()
                    .eq('user_id', user.id);
                  if (delErr) {
                    console.log('[KYC cancel] supabase delete error:', delErr.message);
                  } else {
                    console.log('[KYC cancel] supabase delete ok');
                    backendOk = true;
                  }
                  const { error: updErr } = await client
                    .from('users')
                    .update({ kyc_status: 'not_submitted' })
                    .eq('id', user.id);
                  if (updErr) {
                    console.log('[KYC cancel] supabase user update error:', updErr.message);
                  }
                }
              } catch (sbErr: any) {
                console.log('[KYC cancel] supabase fallback exception:', sbErr?.message || sbErr);
              }
            }

            try {
              await updateKYCStatus('not_submitted');
            } catch (e: any) {
              console.log('[KYC cancel] updateKYCStatus failed:', e?.message || e);
            }

            try {
              await utils.kyc.getAll.invalidate();
              await utils.users.getAll.invalidate();
            } catch {}

            setIsCancelling(false);

            if (backendOk) {
              Alert.alert('Cancelled', 'Your KYC request has been cancelled.');
            } else {
              Alert.alert(
                'Cancelled locally',
                'Could not reach server, but your KYC has been reset on this device. You can submit a new request.'
              );
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
              style={[styles.cancelKycButton, isCancelling && { opacity: 0.6 }]} 
              onPress={handleCancelKYC}
              disabled={isCancelling}
            >
              <X size={18} color={Colors.error} />
              <Text style={styles.cancelKycButtonText}>
                {isCancelling ? 'Cancelling...' : 'Cancel KYC Request'}
              </Text>
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

        {validateAadhaar(aadhaarNumber) && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Aadhaar OTP Verification</Text>
              <Text style={otpVerified ? styles.optionalBadge : styles.requiredBadge}>
                {otpVerified ? 'Verified' : 'Required'}
              </Text>
            </View>
            {!otpSent ? (
              <TouchableOpacity
                style={[styles.uploadCard, otpLoading && styles.uploadCardDone]}
                onPress={handleSendOTP}
                disabled={otpLoading}
              >
                <Shield size={28} color={Colors.primary} />
                <Text style={styles.uploadText}>
                  {otpLoading ? 'Sending OTP...' : 'Send OTP to registered mobile'}
                </Text>
              </TouchableOpacity>
            ) : (
              <>
                <View style={styles.inputContainer}>
                  <TextInput
                    style={styles.input}
                    placeholder="Enter 6-digit OTP"
                    placeholderTextColor={Colors.textTertiary}
                    value={otpInput}
                    onChangeText={(t) => setOtpInput(t.replace(/\D/g, '').slice(0, 6))}
                    keyboardType="numeric"
                    maxLength={6}
                    editable={!otpVerified}
                  />
                  {otpVerified && (
                    <View style={styles.validationIcon}>
                      <CheckCircle size={18} color={Colors.success} />
                    </View>
                  )}
                </View>
                {!otpVerified && (
                  <View style={{ flexDirection: 'row', gap: 8 }}>
                    <TouchableOpacity
                      style={[styles.uploadCard, { flex: 1 }]}
                      onPress={handleVerifyOTP}
                      disabled={otpLoading || otpInput.length !== 6}
                    >
                      <Text style={styles.uploadText}>
                        {otpLoading ? 'Verifying...' : 'Verify OTP'}
                      </Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[styles.uploadCard, { flex: 1 }]}
                      onPress={handleSendOTP}
                      disabled={otpLoading}
                    >
                      <Text style={styles.uploadText}>Resend</Text>
                    </TouchableOpacity>
                  </View>
                )}
              </>
            )}
          </View>
        )}

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

          <View style={{ marginTop: 12 }}>
            <View style={styles.inputContainer}>
              <TextInput
                style={styles.input}
                placeholder="Name as on PAN card"
                placeholderTextColor={Colors.textTertiary}
                value={nameOnPan}
                onChangeText={setNameOnPan}
                editable={!panVerified}
                autoCapitalize="words"
              />
              {panVerified && (
                <View style={styles.validationIcon}>
                  <CheckCircle size={18} color={Colors.success} />
                </View>
              )}
            </View>
            {!panVerified ? (
              <TouchableOpacity
                style={[styles.uploadCard, panVerifying && styles.uploadCardDone]}
                onPress={handleVerifyPAN}
                disabled={panVerifying || !validatePAN(panNumber) || nameOnPan.trim().length < 2}
              >
                <CreditCard size={24} color={Colors.primary} />
                <Text style={styles.uploadText}>
                  {panVerifying ? 'Verifying with NSDL...' : 'Verify PAN'}
                </Text>
              </TouchableOpacity>
            ) : (
              <View style={[styles.uploadCard, styles.uploadCardDone]}>
                <CheckCircle size={24} color={Colors.success} />
                <Text style={[styles.uploadText, { color: Colors.success }]}>PAN Verified with NSDL</Text>
              </View>
            )}
          </View>
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Bank Account</Text>
            <Text style={bankVerified ? styles.optionalBadge : styles.requiredBadge}>
              {bankVerified ? 'Verified' : 'Required'}
            </Text>
          </View>
          <Text style={styles.bankNote}>
            We verify via a ₹1 penny-drop. Payouts and refunds go to this account.
          </Text>

          <View style={styles.inputContainer}>
            <TextInput
              style={styles.input}
              placeholder="Account number"
              placeholderTextColor={Colors.textTertiary}
              value={bankAccountNumber}
              onChangeText={(t) => setBankAccountNumber(t.replace(/\D/g, '').slice(0, 18))}
              keyboardType="numeric"
              editable={!bankVerified}
              secureTextEntry
            />
          </View>
          <View style={styles.inputContainer}>
            <TextInput
              style={styles.input}
              placeholder="Re-enter account number"
              placeholderTextColor={Colors.textTertiary}
              value={bankAccountConfirm}
              onChangeText={(t) => setBankAccountConfirm(t.replace(/\D/g, '').slice(0, 18))}
              keyboardType="numeric"
              editable={!bankVerified}
            />
            {bankAccountConfirm.length > 0 && bankAccountNumber.length > 0 && (
              <View style={styles.validationIcon}>
                {bankAccountConfirm === bankAccountNumber ? (
                  <CheckCircle size={18} color={Colors.success} />
                ) : (
                  <AlertTriangle size={18} color={Colors.warning} />
                )}
              </View>
            )}
          </View>
          <View style={styles.inputContainer}>
            <TextInput
              style={styles.input}
              placeholder="IFSC code (e.g., HDFC0001234)"
              placeholderTextColor={Colors.textTertiary}
              value={ifsc}
              onChangeText={(t) => setIfsc(t.toUpperCase().slice(0, 11))}
              autoCapitalize="characters"
              maxLength={11}
              editable={!bankVerified}
            />
            {ifsc.length > 0 && (
              <View style={styles.validationIcon}>
                {isValidIFSC(ifsc) ? (
                  <CheckCircle size={18} color={Colors.success} />
                ) : (
                  <AlertTriangle size={18} color={Colors.warning} />
                )}
              </View>
            )}
          </View>
          <View style={styles.inputContainer}>
            <TextInput
              style={styles.input}
              placeholder="Account holder name"
              placeholderTextColor={Colors.textTertiary}
              value={bankHolderName}
              onChangeText={setBankHolderName}
              autoCapitalize="words"
              editable={!bankVerified}
            />
          </View>

          {!bankVerified ? (
            <TouchableOpacity
              style={[styles.uploadCard, bankVerifying && styles.uploadCardDone]}
              onPress={handleVerifyBank}
              disabled={bankVerifying}
            >
              <Landmark size={24} color={Colors.primary} />
              <Text style={styles.uploadText}>
                {bankVerifying ? 'Verifying via penny-drop...' : 'Verify Bank Account'}
              </Text>
            </TouchableOpacity>
          ) : (
            <View style={[styles.uploadCard, styles.uploadCardDone]}>
              <CheckCircle size={24} color={Colors.success} />
              <Text style={[styles.uploadText, { color: Colors.success }]}>
                {bankName ? `${bankName} verified` : 'Bank verified'}
              </Text>
            </View>
          )}
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
            (!validateAadhaar(aadhaarNumber) || !validatePAN(panNumber) || !otpVerified || !panVerified || !bankVerified || !uploadedAadhaar || !uploadedPan || !uploadedSelfie || isSubmitting) && styles.submitButtonDisabled,
          ]}
          onPress={handleSubmit}
          disabled={!validateAadhaar(aadhaarNumber) || !validatePAN(panNumber) || !otpVerified || !panVerified || !bankVerified || !uploadedAadhaar || !uploadedPan || !uploadedSelfie || isSubmitting}
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
  bankNote: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginBottom: 12,
    lineHeight: 18,
  },
});
