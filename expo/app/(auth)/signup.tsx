import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  ActivityIndicator,
  Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Package, User, Phone, Mail, Lock, ArrowLeft, AlertCircle, ChevronDown, Check, CheckCircle } from 'lucide-react-native';
import Colors from '@/constants/colors';
import { useAuth } from '@/contexts/AuthContext';
import { UserRole } from '@/types';
import { COUNTRY_CODES, DEFAULT_COUNTRY_CODE, validatePhoneNumber, validateEmail } from '@/utils/validation';
import OTPVerification from '@/components/OTPVerification';

export default function SignupScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ role?: string }>();
  const role: 'sender' = 'sender';
  void params;
  const { signup } = useAuth();
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [countryCode, setCountryCode] = useState(DEFAULT_COUNTRY_CODE);
  const [showCountryPicker, setShowCountryPicker] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [phoneError, setPhoneError] = useState('');
  const [emailError, setEmailError] = useState('');
  const [showOtpModal, setShowOtpModal] = useState(false);
  const [otpVerificationType, setOtpVerificationType] = useState<'phone' | 'email'>('email');
  const [isPhoneVerified, setIsPhoneVerified] = useState(false);
  const [isEmailVerified, setIsEmailVerified] = useState(false);
  

  const validateFields = (): boolean => {
    let isValid = true;
    setPhoneError('');
    setEmailError('');

    const phoneValidation = validatePhoneNumber(phone, countryCode);
    if (!phoneValidation.valid) {
      setPhoneError(phoneValidation.error || 'Invalid phone number');
      isValid = false;
    }

    const emailValidation = validateEmail(email);
    if (!emailValidation.valid) {
      setEmailError(emailValidation.error || 'Invalid email');
      isValid = false;
    }

    return isValid;
  };

  const initiateOtpVerification = (type: 'phone' | 'email') => {
    if (type === 'phone') {
      const phoneValidation = validatePhoneNumber(phone, countryCode);
      if (!phoneValidation.valid) {
        setPhoneError(phoneValidation.error || 'Invalid phone number');
        return;
      }
    } else {
      const emailValidation = validateEmail(email);
      if (!emailValidation.valid) {
        setEmailError(emailValidation.error || 'Invalid email');
        return;
      }
    }
    setOtpVerificationType(type);
    setShowOtpModal(true);
  };

  const handleOtpVerified = () => {
    setShowOtpModal(false);
    if (otpVerificationType === 'phone') {
      setIsPhoneVerified(true);
    } else {
      setIsEmailVerified(true);
    }
  };

  const handleSignup = async () => {
    if (!name.trim() || !phone.trim() || !email.trim() || !password.trim()) {
      setError('Please fill in all required fields');
      return;
    }

    if (!validateFields()) {
      return;
    }

    if (!isEmailVerified && !isPhoneVerified) {
      setError('Please verify your email or phone number');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    const hasLetter = /[a-zA-Z]/.test(password);
    const hasNumber = /[0-9]/.test(password);
    if (!hasLetter || !hasNumber) {
      setError('Password must contain both letters and numbers');
      return;
    }

    setError('');
    setIsLoading(true);

    try {
      await signup(name, `${countryCode}${phone}`, email, password, role as UserRole);
      router.replace('/(tabs)');
    } catch (err: any) {
      setError(err.message || 'Signup failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <LinearGradient
      colors={[Colors.primary, Colors.primaryDark]}
      style={styles.gradient}
    >
      <SafeAreaView style={styles.container}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.keyboardView}
        >
          <ScrollView
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
          >
            <TouchableOpacity
              style={styles.backButton}
              onPress={() => router.back()}
            >
              <ArrowLeft size={24} color={Colors.textInverse} />
            </TouchableOpacity>

            <View style={styles.header}>
              <View style={styles.logoContainer}>
                <Package size={36} color={Colors.textInverse} strokeWidth={1.5} />
              </View>
              <Text style={styles.title}>Join ParcelPeer</Text>
            </View>

            <View style={styles.formContainer}>
              <Text style={styles.formTitle}>Create Account</Text>
              <Text style={styles.formSubtitle}>
                Start sending parcels. You can become a traveler anytime.
              </Text>

              {error ? (
                <View style={styles.errorContainer}>
                  <Text style={styles.errorText}>{error}</Text>
                </View>
              ) : null}

              <View style={styles.inputContainer}>
                <User size={20} color={Colors.textSecondary} />
                <TextInput
                  style={styles.input}
                  placeholder="Full Name"
                  placeholderTextColor={Colors.textTertiary}
                  value={name}
                  onChangeText={setName}
                  autoCapitalize="words"
                />
              </View>

              <View style={styles.phoneContainer}>
                <TouchableOpacity
                  style={styles.countryCodeButton}
                  onPress={() => setShowCountryPicker(true)}
                >
                  <Text style={styles.countryCodeText}>{countryCode}</Text>
                  <ChevronDown size={16} color={Colors.textSecondary} />
                </TouchableOpacity>
                <View style={[styles.phoneInputContainer, isPhoneVerified && styles.inputVerified]}>
                  <Phone size={20} color={isPhoneVerified ? Colors.success : Colors.textSecondary} />
                  <TextInput
                    style={styles.phoneInput}
                    placeholder="Phone Number"
                    placeholderTextColor={Colors.textTertiary}
                    value={phone}
                    onChangeText={(text) => { setPhone(text); setIsPhoneVerified(false); }}
                    keyboardType="phone-pad"
                    editable={!isPhoneVerified}
                  />
                  {isPhoneVerified ? (
                    <CheckCircle size={20} color={Colors.success} />
                  ) : (
                    <TouchableOpacity
                      style={styles.verifyButton}
                      onPress={() => initiateOtpVerification('phone')}
                      disabled={!phone.trim()}
                    >
                      <Text style={[styles.verifyButtonText, !phone.trim() && styles.verifyButtonTextDisabled]}>Verify</Text>
                    </TouchableOpacity>
                  )}
                </View>
              </View>
              {phoneError ? <Text style={styles.fieldError}>{phoneError}</Text> : null}

              <View style={[styles.inputContainer, isEmailVerified && styles.inputVerified]}>
                <Mail size={20} color={isEmailVerified ? Colors.success : Colors.textSecondary} />
                <TextInput
                  style={styles.input}
                  placeholder="Email Address"
                  placeholderTextColor={Colors.textTertiary}
                  value={email}
                  onChangeText={(text) => { setEmail(text); setIsEmailVerified(false); }}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  editable={!isEmailVerified}
                />
                {isEmailVerified ? (
                  <CheckCircle size={20} color={Colors.success} />
                ) : (
                  <TouchableOpacity
                    style={styles.verifyButton}
                    onPress={() => initiateOtpVerification('email')}
                    disabled={!email.trim()}
                  >
                    <Text style={[styles.verifyButtonText, !email.trim() && styles.verifyButtonTextDisabled]}>Verify</Text>
                  </TouchableOpacity>
                )}
              </View>
              {emailError ? <Text style={styles.fieldError}>{emailError}</Text> : null}

              {!isEmailVerified && !isPhoneVerified && (
                <View style={styles.verificationNotice}>
                  <AlertCircle size={16} color={Colors.warning} />
                  <Text style={styles.verificationNoticeText}>
                    Please verify your email or phone to continue
                  </Text>
                </View>
              )}

              <View style={styles.inputContainer}>
                <Lock size={20} color={Colors.textSecondary} />
                <TextInput
                  style={styles.input}
                  placeholder="Password (letters + numbers)"
                  placeholderTextColor={Colors.textTertiary}
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry
                  autoCapitalize="none"
                />
              </View>

              <View style={styles.inputContainer}>
                <Lock size={20} color={Colors.textSecondary} />
                <TextInput
                  style={styles.input}
                  placeholder="Confirm Password"
                  placeholderTextColor={Colors.textTertiary}
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
                  secureTextEntry
                />
              </View>

              <TouchableOpacity
                style={[styles.signupButton, isLoading && styles.signupButtonDisabled]}
                onPress={handleSignup}
                disabled={isLoading}
              >
                {isLoading ? (
                  <ActivityIndicator color={Colors.textInverse} />
                ) : (
                  <Text style={styles.signupButtonText}>Create Account</Text>
                )}
              </TouchableOpacity>

              <Text style={styles.termsText}>
                By signing up, you agree to our Terms of Service and Privacy Policy
              </Text>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>

        <Modal
          visible={showCountryPicker}
          transparent
          animationType="slide"
          onRequestClose={() => setShowCountryPicker(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>Select Country Code</Text>
              <ScrollView style={styles.countryList}>
                {COUNTRY_CODES.map((country) => (
                  <TouchableOpacity
                    key={country.code}
                    style={[
                      styles.countryItem,
                      countryCode === country.code && styles.countryItemSelected,
                    ]}
                    onPress={() => {
                      setCountryCode(country.code);
                      setShowCountryPicker(false);
                    }}
                  >
                    <Text style={styles.countryItemText}>
                      {country.code} - {country.country}
                    </Text>
                    {countryCode === country.code && (
                      <Check size={20} color={Colors.primary} />
                    )}
                  </TouchableOpacity>
                ))}
              </ScrollView>
              <TouchableOpacity
                style={styles.modalCloseButton}
                onPress={() => setShowCountryPicker(false)}
              >
                <Text style={styles.modalCloseText}>Cancel</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>

        <OTPVerification
          visible={showOtpModal}
          onClose={() => setShowOtpModal(false)}
          onVerify={handleOtpVerified}
          verificationType={otpVerificationType}
          target={otpVerificationType === 'email' ? email : `${countryCode}${phone}`}
        />
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  gradient: {
    flex: 1,
  },
  container: {
    flex: 1,
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    padding: 24,
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  header: {
    alignItems: 'center',
    marginBottom: 20,
  },
  logoContainer: {
    width: 64,
    height: 64,
    borderRadius: 18,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
  },
  title: {
    fontSize: 24,
    fontWeight: '700' as const,
    color: Colors.textInverse,
  },
  formContainer: {
    backgroundColor: Colors.surface,
    borderRadius: 24,
    padding: 24,
    shadowColor: Colors.text,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 24,
    elevation: 8,
  },
  formTitle: {
    fontSize: 22,
    fontWeight: '700' as const,
    color: Colors.text,
    marginBottom: 4,
    textAlign: 'center',
  },
  formSubtitle: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginBottom: 16,
    textAlign: 'center',
  },
  kycNotice: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.warningLight,
    padding: 12,
    borderRadius: 12,
    marginBottom: 16,
    gap: 10,
  },
  kycNoticeText: {
    flex: 1,
    fontSize: 13,
    color: Colors.warning,
    fontWeight: '500' as const,
  },
  errorContainer: {
    backgroundColor: Colors.errorLight,
    padding: 12,
    borderRadius: 12,
    marginBottom: 16,
  },
  errorText: {
    color: Colors.error,
    fontSize: 14,
    textAlign: 'center',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surfaceSecondary,
    borderRadius: 12,
    paddingHorizontal: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  input: {
    flex: 1,
    paddingVertical: 14,
    paddingHorizontal: 12,
    fontSize: 16,
    color: Colors.text,
  },
  phoneContainer: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 12,
  },
  countryCodeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surfaceSecondary,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 16,
    borderWidth: 1,
    borderColor: Colors.border,
    gap: 4,
  },
  countryCodeText: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: Colors.text,
  },
  phoneInputContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surfaceSecondary,
    borderRadius: 12,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  phoneInput: {
    flex: 1,
    paddingVertical: 14,
    paddingHorizontal: 12,
    fontSize: 16,
    color: Colors.text,
  },
  fieldError: {
    fontSize: 12,
    color: Colors.error,
    marginTop: -8,
    marginBottom: 12,
    marginLeft: 4,
  },
  signupButton: {
    backgroundColor: Colors.primary,
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginTop: 8,
  },
  signupButtonDisabled: {
    opacity: 0.7,
  },
  signupButtonText: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: Colors.textInverse,
  },
  termsText: {
    fontSize: 12,
    color: Colors.textTertiary,
    textAlign: 'center',
    marginTop: 16,
    lineHeight: 18,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: Colors.surface,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
    maxHeight: '60%',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600' as const,
    color: Colors.text,
    marginBottom: 16,
    textAlign: 'center',
  },
  countryList: {
    maxHeight: 300,
  },
  countryItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  countryItemSelected: {
    backgroundColor: Colors.primaryLight + '20',
  },
  countryItemText: {
    fontSize: 16,
    color: Colors.text,
  },
  modalCloseButton: {
    backgroundColor: Colors.surfaceSecondary,
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginTop: 16,
  },
  modalCloseText: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: Colors.textSecondary,
  },
  inputVerified: {
    borderColor: Colors.success,
    backgroundColor: Colors.successLight + '20',
  },
  verifyButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    backgroundColor: Colors.primary,
  },
  verifyButtonText: {
    fontSize: 12,
    fontWeight: '600' as const,
    color: Colors.textInverse,
  },
  verifyButtonTextDisabled: {
    opacity: 0.5,
  },
  verificationNotice: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.warningLight,
    padding: 10,
    borderRadius: 8,
    marginBottom: 12,
    gap: 8,
  },
  verificationNoticeText: {
    flex: 1,
    fontSize: 12,
    color: Colors.warning,
    fontWeight: '500' as const,
  },
});
