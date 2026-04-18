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
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import {
  Lock,
  ArrowRight,
  ArrowLeft,
  Send,
  Plane,
  Shield,
  Mail,
  Eye,
  EyeOff,
} from 'lucide-react-native';
import Colors from '@/constants/colors';
import { useAuth } from '@/contexts/AuthContext';
import { UserRole } from '@/types';

const roleConfig: Record<string, {
  title: string;
  subtitle: string;
  icon: typeof Send;
  accent: string;
  testCredentials: string;
}> = {
  sender: {
    title: 'Sender',
    subtitle: 'Send or receive parcels',
    icon: Send,
    accent: Colors.primary,
    testCredentials: 'sender@test.com / sender123',
  },
  receiver: {
    title: 'Sender',
    subtitle: 'Send or receive parcels',
    icon: Send,
    accent: Colors.primary,
    testCredentials: 'sender@test.com / sender123',
  },
  traveler: {
    title: 'Traveler',
    subtitle: 'Deliver parcels & earn',
    icon: Plane,
    accent: Colors.accent,
    testCredentials: 'traveler@test.com / traveler123',
  },
  admin: {
    title: 'Admin',
    subtitle: 'Platform management',
    icon: Shield,
    accent: Colors.secondary,
    testCredentials: 'admin@parcelpeer.com / admin123',
  },
};

export default function LoginScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ role?: string }>();
  const role = (params.role as UserRole) || 'sender';
  const config = roleConfig[role === 'traveler' ? 'sender' : role] || roleConfig.sender;
  const RoleIcon = config.icon;

  const { login, loginWithGoogle, isSupabaseEnabled } = useAuth();
  const [emailOrPhone, setEmailOrPhone] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>('');

  const handleLogin = async () => {
    if (!emailOrPhone.trim() || !password.trim()) {
      setError('Please enter email/phone and password');
      return;
    }
    setError('');
    setIsLoading(true);
    try {
      const user = await login(emailOrPhone, password, role);
      if (role === 'admin') {
        router.replace('/(admin)' as any);
      } else if (role === 'traveler' && user.kycStatus !== 'approved') {
        router.replace('/kyc');
      } else {
        router.replace('/(tabs)');
      }
    } catch (err: any) {
      setError(err?.message || 'Login failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setError('');
    setIsGoogleLoading(true);
    try {
      const user = await loginWithGoogle(role);
      if (role === 'admin') {
        router.replace('/(admin)' as any);
      } else if (role === 'traveler' && user.kycStatus !== 'approved') {
        router.replace('/kyc');
      } else {
        router.replace('/(tabs)');
      }
    } catch (err: any) {
      setError(err?.message || 'Google sign-in failed. Please try again.');
    } finally {
      setIsGoogleLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.flex}
        keyboardVerticalOffset={0}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="on-drag"
          bounces={false}
        >
          <TouchableOpacity
            testID="back-button"
            style={styles.backBtn}
            onPress={() => {
              try {
                if (router.canGoBack?.()) {
                  router.back();
                  return;
                }
              } catch (e) {
                console.log('canGoBack error', e);
              }
              router.replace('/(auth)/login');
            }}
          >
            <ArrowLeft size={20} color={Colors.text} />
          </TouchableOpacity>

          <View style={[styles.roleChip, { backgroundColor: config.accent }]}>
            <RoleIcon size={14} color={Colors.textInverse} />
            <Text style={styles.roleChipText}>{config.title.toUpperCase()}</Text>
          </View>

          <Text style={styles.title}>Welcome{`\n`}back.</Text>
          <Text style={styles.subtitle}>{config.subtitle}</Text>

          {error ? (
            <View style={styles.errorBox}>
              <Text style={styles.errorText}>{error}</Text>
            </View>
          ) : null}

          {role !== 'admin' && isSupabaseEnabled && (
            <>
              <TouchableOpacity
                testID="google-login-btn"
                style={styles.googleBtn}
                onPress={handleGoogleLogin}
                disabled={isGoogleLoading || isLoading}
                activeOpacity={0.85}
              >
                {isGoogleLoading ? (
                  <ActivityIndicator color={Colors.text} />
                ) : (
                  <>
                    <Image
                      source={{ uri: 'https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg' }}
                      style={styles.googleIcon}
                    />
                    <Text style={styles.googleBtnText}>Continue with Google</Text>
                  </>
                )}
              </TouchableOpacity>

              <View style={styles.divider}>
                <View style={styles.dividerLine} />
                <Text style={styles.dividerText}>OR</Text>
                <View style={styles.dividerLine} />
              </View>
            </>
          )}

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Email or phone</Text>
            <View style={styles.inputWrap}>
              <Mail size={18} color={Colors.textTertiary} />
              <TextInput
                testID="email-input"
                style={styles.input}
                placeholder="you@example.com"
                placeholderTextColor={Colors.textTertiary}
                value={emailOrPhone}
                onChangeText={setEmailOrPhone}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
                returnKeyType="next"
              />
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Password</Text>
            <View style={styles.inputWrap}>
              <Lock size={18} color={Colors.textTertiary} />
              <TextInput
                testID="password-input"
                style={styles.input}
                placeholder="••••••••"
                placeholderTextColor={Colors.textTertiary}
                value={password}
                onChangeText={setPassword}
                secureTextEntry={!showPassword}
                autoCapitalize="none"
                autoCorrect={false}
                returnKeyType="done"
                onSubmitEditing={handleLogin}
              />
              <TouchableOpacity
                testID="toggle-password-visibility"
                onPress={() => setShowPassword((v) => !v)}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                style={styles.eyeBtn}
              >
                {showPassword ? (
                  <EyeOff size={18} color={Colors.textTertiary} />
                ) : (
                  <Eye size={18} color={Colors.textTertiary} />
                )}
              </TouchableOpacity>
            </View>
          </View>

          <TouchableOpacity style={styles.forgot}>
            <Text style={styles.forgotText}>Forgot password?</Text>
          </TouchableOpacity>

          <TouchableOpacity
            testID="login-btn"
            style={[styles.cta, { backgroundColor: Colors.secondary }, isLoading && styles.ctaDisabled]}
            onPress={handleLogin}
            disabled={isLoading || isGoogleLoading}
            activeOpacity={0.9}
          >
            {isLoading ? (
              <ActivityIndicator color={Colors.textInverse} />
            ) : (
              <>
                <Text style={styles.ctaText}>Sign in</Text>
                <View style={[styles.ctaArrow, { backgroundColor: config.accent }]}>
                  <ArrowRight size={16} color={Colors.textInverse} />
                </View>
              </>
            )}
          </TouchableOpacity>

          {role !== 'admin' && (
            <TouchableOpacity
              style={styles.signupRow}
              onPress={() => router.push({ pathname: '/(auth)/signup', params: { role } })}
            >
              <Text style={styles.signupText}>
                New here? <Text style={styles.signupLink}>Create an account</Text>
              </Text>
            </TouchableOpacity>
          )}

          <View style={styles.testBox}>
            <Text style={styles.testLabel}>DEMO CREDENTIALS</Text>
            <Text style={styles.testValue}>{config.testCredentials}</Text>
          </View>

          <TouchableOpacity
            testID="view-designs"
            style={styles.designsBtn}
            onPress={() => router.push('/designs' as any)}
          >
            <Text style={styles.designsText}>View Hi-Fi Designs →</Text>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  designsBtn: {
    marginTop: 12,
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.surface,
    alignItems: 'center',
  },
  designsText: {
    color: Colors.primary,
    fontWeight: '700',
    fontSize: 13,
  },
  safe: { flex: 1, backgroundColor: Colors.background },
  flex: { flex: 1 },
  scrollContent: {
    padding: 24,
    paddingBottom: 48,
    flexGrow: 1,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  roleChip: {
    flexDirection: 'row',
    alignSelf: 'flex-start',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    marginBottom: 14,
  },
  roleChipText: {
    color: Colors.textInverse,
    fontSize: 11,
    fontWeight: '800' as const,
    letterSpacing: 1.2,
  },
  title: {
    fontSize: 36,
    lineHeight: 40,
    fontWeight: '800' as const,
    color: Colors.text,
    letterSpacing: -1.2,
  },
  subtitle: {
    marginTop: 6,
    marginBottom: 20,
    fontSize: 15,
    color: Colors.textSecondary,
  },
  errorBox: {
    backgroundColor: Colors.errorLight,
    padding: 12,
    borderRadius: 12,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: Colors.error + '40',
  },
  errorText: { color: Colors.error, fontSize: 13, fontWeight: '600' as const },
  googleBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    paddingVertical: 14,
    borderRadius: 14,
    marginBottom: 16,
  },
  googleIcon: { width: 18, height: 18 },
  googleBtnText: { fontSize: 15, fontWeight: '700' as const, color: Colors.text },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 16,
  },
  dividerLine: { flex: 1, height: 1, backgroundColor: Colors.border },
  dividerText: { fontSize: 11, fontWeight: '700' as const, color: Colors.textTertiary, letterSpacing: 1.2 },
  inputGroup: { marginBottom: 14 },
  label: {
    fontSize: 12,
    fontWeight: '700' as const,
    color: Colors.textSecondary,
    marginBottom: 8,
    letterSpacing: 0.5,
  },
  inputWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderRadius: 14,
    paddingHorizontal: 14,
    borderWidth: 1,
    borderColor: Colors.border,
    gap: 10,
  },
  input: {
    flex: 1,
    paddingVertical: 14,
    fontSize: 15,
    color: Colors.text,
  },
  eyeBtn: {
    padding: 4,
  },
  forgot: { alignSelf: 'flex-end', marginTop: 2, marginBottom: 16 },
  forgotText: { color: Colors.primary, fontSize: 13, fontWeight: '600' as const },
  cta: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingLeft: 22,
    paddingRight: 8,
    paddingVertical: 8,
    borderRadius: 18,
  },
  ctaDisabled: { opacity: 0.7 },
  ctaText: {
    color: Colors.textInverse,
    fontSize: 16,
    fontWeight: '700' as const,
    paddingVertical: 12,
  },
  ctaArrow: {
    width: 40,
    height: 40,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  signupRow: { marginTop: 18, alignItems: 'center' },
  signupText: { fontSize: 14, color: Colors.textSecondary },
  signupLink: { color: Colors.primary, fontWeight: '700' as const },
  testBox: {
    marginTop: 24,
    padding: 14,
    borderRadius: 14,
    backgroundColor: Colors.surfaceSecondary,
    borderWidth: 1,
    borderColor: Colors.border,
    borderStyle: 'dashed',
  },
  testLabel: {
    fontSize: 10,
    fontWeight: '800' as const,
    color: Colors.textTertiary,
    letterSpacing: 1.5,
    marginBottom: 4,
  },
  testValue: { fontSize: 13, color: Colors.text, fontWeight: '600' as const },
});
