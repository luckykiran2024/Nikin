import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Modal,
  ActivityIndicator,
} from 'react-native';
import { Mail, Phone, RefreshCw, CheckCircle, X } from 'lucide-react-native';
import Colors from '@/constants/colors';

interface OTPVerificationProps {
  visible: boolean;
  onClose: () => void;
  onVerify: () => void;
  verificationType: 'phone' | 'email';
  target: string;
}

const OTP_LENGTH = 6;
const RESEND_TIMEOUT = 30;

export default function OTPVerification({
  visible,
  onClose,
  onVerify,
  verificationType,
  target,
}: OTPVerificationProps) {
  const [otp, setOtp] = useState<string[]>(Array(OTP_LENGTH).fill(''));
  const [isVerifying, setIsVerifying] = useState(false);
  const [error, setError] = useState('');
  const [resendTimer, setResendTimer] = useState(RESEND_TIMEOUT);
  const [canResend, setCanResend] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [verified, setVerified] = useState(false);
  
  const inputRefs = useRef<(TextInput | null)[]>([]);

  useEffect(() => {
    if (visible) {
      setOtp(Array(OTP_LENGTH).fill(''));
      setError('');
      setVerified(false);
      setResendTimer(RESEND_TIMEOUT);
      setCanResend(false);
      setTimeout(() => inputRefs.current[0]?.focus(), 100);
    }
  }, [visible]);

  useEffect(() => {
    let interval: ReturnType<typeof setInterval> | undefined;
    if (visible && resendTimer > 0) {
      interval = setInterval(() => {
        setResendTimer((prev) => {
          if (prev <= 1) {
            setCanResend(true);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => { if (interval) clearInterval(interval); };
  }, [visible, resendTimer]);

  const handleOtpChange = useCallback((value: string, index: number) => {
    if (value.length > 1) {
      value = value.slice(-1);
    }
    
    if (!/^\d*$/.test(value)) return;

    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);
    setError('');

    if (value && index < OTP_LENGTH - 1) {
      inputRefs.current[index + 1]?.focus();
    }
  }, [otp]);

  const handleKeyPress = useCallback((e: any, index: number) => {
    if (e.nativeEvent.key === 'Backspace' && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  }, [otp]);

  const handleVerify = async () => {
    const otpCode = otp.join('');
    if (otpCode.length !== OTP_LENGTH) {
      setError('Please enter complete OTP');
      return;
    }

    setIsVerifying(true);
    setError('');

    try {
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      if (otpCode === '123456' || otpCode === '000000') {
        setVerified(true);
        setTimeout(() => {
          onVerify();
        }, 1000);
      } else {
        setError('Invalid OTP. Please try again. (Use 123456 for testing)');
      }
    } catch {
      setError('Verification failed. Please try again.');
    } finally {
      setIsVerifying(false);
    }
  };

  const handleResend = async () => {
    if (!canResend || isResending) return;

    setIsResending(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 1000));
      setResendTimer(RESEND_TIMEOUT);
      setCanResend(false);
      setOtp(Array(OTP_LENGTH).fill(''));
      setError('');
      inputRefs.current[0]?.focus();
    } finally {
      setIsResending(false);
    }
  };

  const maskedTarget = verificationType === 'email'
    ? target.replace(/(.{2})(.*)(@.*)/, '$1***$3')
    : target.replace(/(\+\d{2})(\d{2})(\d*)(\d{2})/, '$1 $2****$4');

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.container}>
          <TouchableOpacity style={styles.closeButton} onPress={onClose}>
            <X size={24} color={Colors.text} />
          </TouchableOpacity>

          {verified ? (
            <View style={styles.verifiedContainer}>
              <View style={styles.verifiedIcon}>
                <CheckCircle size={64} color={Colors.success} />
              </View>
              <Text style={styles.verifiedTitle}>Verified!</Text>
              <Text style={styles.verifiedSubtitle}>
                Your {verificationType} has been verified successfully
              </Text>
            </View>
          ) : (
            <>
              <View style={styles.iconContainer}>
                {verificationType === 'email' ? (
                  <Mail size={40} color={Colors.primary} />
                ) : (
                  <Phone size={40} color={Colors.primary} />
                )}
              </View>

              <Text style={styles.title}>Verify Your {verificationType === 'email' ? 'Email' : 'Phone'}</Text>
              <Text style={styles.subtitle}>
                We&apos;ve sent a {OTP_LENGTH}-digit OTP to
              </Text>
              <Text style={styles.target}>{maskedTarget}</Text>

              <View style={styles.otpContainer}>
                {otp.map((digit, index) => (
                  <TextInput
                    key={index}
                    ref={(ref) => { inputRefs.current[index] = ref; }}
                    style={[
                      styles.otpInput,
                      digit && styles.otpInputFilled,
                      error && styles.otpInputError,
                    ]}
                    value={digit}
                    onChangeText={(value) => handleOtpChange(value, index)}
                    onKeyPress={(e) => handleKeyPress(e, index)}
                    keyboardType="number-pad"
                    maxLength={1}
                    selectTextOnFocus
                  />
                ))}
              </View>

              {error ? (
                <Text style={styles.errorText}>{error}</Text>
              ) : null}

              <TouchableOpacity
                style={[styles.verifyButton, isVerifying && styles.verifyButtonDisabled]}
                onPress={handleVerify}
                disabled={isVerifying}
              >
                {isVerifying ? (
                  <ActivityIndicator color={Colors.textInverse} />
                ) : (
                  <Text style={styles.verifyButtonText}>Verify OTP</Text>
                )}
              </TouchableOpacity>

              <View style={styles.resendContainer}>
                {canResend ? (
                  <TouchableOpacity
                    style={styles.resendButton}
                    onPress={handleResend}
                    disabled={isResending}
                  >
                    {isResending ? (
                      <ActivityIndicator size="small" color={Colors.primary} />
                    ) : (
                      <>
                        <RefreshCw size={16} color={Colors.primary} />
                        <Text style={styles.resendText}>Resend OTP</Text>
                      </>
                    )}
                  </TouchableOpacity>
                ) : (
                  <Text style={styles.timerText}>
                    Resend OTP in {resendTimer}s
                  </Text>
                )}
              </View>

              <View style={styles.testHint}>
                <Text style={styles.testHintText}>
                  For testing, use OTP: 123456
                </Text>
              </View>
            </>
          )}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  container: {
    backgroundColor: Colors.surface,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    paddingBottom: 40,
  },
  closeButton: {
    position: 'absolute',
    top: 16,
    right: 16,
    zIndex: 1,
    padding: 4,
  },
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: Colors.primaryLight + '30',
    justifyContent: 'center',
    alignItems: 'center',
    alignSelf: 'center',
    marginBottom: 20,
  },
  title: {
    fontSize: 22,
    fontWeight: '700' as const,
    color: Colors.text,
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: Colors.textSecondary,
    textAlign: 'center',
  },
  target: {
    fontSize: 15,
    fontWeight: '600' as const,
    color: Colors.text,
    textAlign: 'center',
    marginBottom: 24,
  },
  otpContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 10,
    marginBottom: 16,
  },
  otpInput: {
    width: 48,
    height: 56,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: Colors.border,
    backgroundColor: Colors.surfaceSecondary,
    fontSize: 24,
    fontWeight: '600' as const,
    color: Colors.text,
    textAlign: 'center',
  },
  otpInputFilled: {
    borderColor: Colors.primary,
    backgroundColor: Colors.primaryLight + '15',
  },
  otpInputError: {
    borderColor: Colors.error,
  },
  errorText: {
    fontSize: 13,
    color: Colors.error,
    textAlign: 'center',
    marginBottom: 16,
  },
  verifyButton: {
    backgroundColor: Colors.primary,
    borderRadius: 14,
    padding: 16,
    alignItems: 'center',
    marginBottom: 16,
  },
  verifyButtonDisabled: {
    opacity: 0.7,
  },
  verifyButtonText: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: Colors.textInverse,
  },
  resendContainer: {
    alignItems: 'center',
    marginBottom: 16,
  },
  resendButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    padding: 8,
  },
  resendText: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: Colors.primary,
  },
  timerText: {
    fontSize: 14,
    color: Colors.textSecondary,
  },
  testHint: {
    backgroundColor: Colors.surfaceSecondary,
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  testHintText: {
    fontSize: 12,
    color: Colors.textTertiary,
  },
  verifiedContainer: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  verifiedIcon: {
    marginBottom: 20,
  },
  verifiedTitle: {
    fontSize: 24,
    fontWeight: '700' as const,
    color: Colors.success,
    marginBottom: 8,
  },
  verifiedSubtitle: {
    fontSize: 15,
    color: Colors.textSecondary,
    textAlign: 'center',
  },
});
