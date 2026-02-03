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
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Package, Lock, ArrowRight, ArrowLeft, Send, Plane, Shield, Mail } from 'lucide-react-native';
import Colors from '@/constants/colors';
import { useAuth } from '@/contexts/AuthContext';
import { UserRole } from '@/types';

const roleConfig: Record<string, {
  title: string;
  subtitle: string;
  icon: typeof Send;
  colors: readonly [string, string];
  testCredentials: string;
}> = {
  sender: {
    title: 'Sender / Receiver',
    subtitle: 'Send or receive parcels',
    icon: Send,
    colors: ['#F59E0B', '#D97706'] as const,
    testCredentials: 'sender@test.com / sender123',
  },
  receiver: {
    title: 'Sender / Receiver',
    subtitle: 'Send or receive parcels',
    icon: Send,
    colors: ['#F59E0B', '#D97706'] as const,
    testCredentials: 'sender@test.com / sender123',
  },
  traveler: {
    title: 'Traveler',
    subtitle: 'Deliver parcels & earn',
    icon: Plane,
    colors: ['#10B981', '#059669'] as const,
    testCredentials: 'traveler@test.com / traveler123',
  },
  admin: {
    title: 'Admin',
    subtitle: 'Platform management',
    icon: Shield,
    colors: ['#8B5CF6', '#7C3AED'] as const,
    testCredentials: 'admin@parcelpeer.com / admin123',
  },
};

export default function LoginScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ role?: string }>();
  const role = (params.role as UserRole) || 'sender';
  const config = roleConfig[role] || roleConfig.sender;
  const RoleIcon = config.icon;

  const { login } = useAuth();
  const [emailOrPhone, setEmailOrPhone] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

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
      setError(err.message || 'Login failed. Please try again.');
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
                <Package size={40} color={Colors.textInverse} strokeWidth={1.5} />
              </View>
              <Text style={styles.title}>ParcelPeer</Text>
            </View>

            <LinearGradient
              colors={config.colors}
              style={styles.roleBadge}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
            >
              <RoleIcon size={20} color={Colors.textInverse} />
              <Text style={styles.roleBadgeText}>{config.title}</Text>
            </LinearGradient>

            <View style={styles.formContainer}>
              <Text style={styles.formTitle}>Welcome Back</Text>
              <Text style={styles.formSubtitle}>{config.subtitle}</Text>

              {error ? (
                <View style={styles.errorContainer}>
                  <Text style={styles.errorText}>{error}</Text>
                </View>
              ) : null}

              <View style={styles.inputContainer}>
                <Mail size={20} color={Colors.textSecondary} />
                <TextInput
                  style={styles.input}
                  placeholder="Email or Phone"
                  placeholderTextColor={Colors.textTertiary}
                  value={emailOrPhone}
                  onChangeText={setEmailOrPhone}
                  keyboardType="email-address"
                  autoCapitalize="none"
                />
              </View>

              <View style={styles.inputContainer}>
                <Lock size={20} color={Colors.textSecondary} />
                <TextInput
                  style={styles.input}
                  placeholder="Password"
                  placeholderTextColor={Colors.textTertiary}
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry
                />
              </View>

              <TouchableOpacity style={styles.forgotPassword}>
                <Text style={styles.forgotPasswordText}>Forgot Password?</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.loginButton, isLoading && styles.loginButtonDisabled]}
                onPress={handleLogin}
                disabled={isLoading}
              >
                <LinearGradient
                  colors={config.colors}
                  style={styles.loginButtonGradient}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                >
                  {isLoading ? (
                    <ActivityIndicator color={Colors.textInverse} />
                  ) : (
                    <>
                      <Text style={styles.loginButtonText}>Sign In</Text>
                      <ArrowRight size={20} color={Colors.textInverse} />
                    </>
                  )}
                </LinearGradient>
              </TouchableOpacity>

              {role !== 'admin' && (
                <>
                  <View style={styles.divider}>
                    <View style={styles.dividerLine} />
                    <Text style={styles.dividerText}>or</Text>
                    <View style={styles.dividerLine} />
                  </View>

                  <TouchableOpacity
                    style={styles.signupButton}
                    onPress={() => router.push({ pathname: '/(auth)/signup', params: { role } })}
                  >
                    <Text style={styles.signupButtonText}>
                      Don&apos;t have an account? <Text style={styles.signupLink}>Sign Up</Text>
                    </Text>
                  </TouchableOpacity>
                </>
              )}

              <View style={styles.testCredentials}>
                <Text style={styles.testCredentialsLabel}>Test credentials:</Text>
                <Text style={styles.testCredentialsValue}>{config.testCredentials}</Text>
              </View>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
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
    marginBottom: 16,
  },
  header: {
    alignItems: 'center',
    marginBottom: 16,
  },
  logoContainer: {
    width: 72,
    height: 72,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  title: {
    fontSize: 28,
    fontWeight: '700' as const,
    color: Colors.textInverse,
  },
  roleBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'center',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 24,
    gap: 8,
    marginBottom: 24,
  },
  roleBadgeText: {
    fontSize: 16,
    fontWeight: '600' as const,
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
    fontSize: 24,
    fontWeight: '700' as const,
    color: Colors.text,
    marginBottom: 4,
  },
  formSubtitle: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginBottom: 24,
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
    marginBottom: 16,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  input: {
    flex: 1,
    paddingVertical: 16,
    paddingHorizontal: 12,
    fontSize: 16,
    color: Colors.text,
  },
  forgotPassword: {
    alignSelf: 'flex-end',
    marginBottom: 24,
  },
  forgotPasswordText: {
    fontSize: 14,
    color: Colors.primary,
    fontWeight: '600' as const,
  },
  loginButton: {
    borderRadius: 12,
    overflow: 'hidden',
  },
  loginButtonDisabled: {
    opacity: 0.7,
  },
  loginButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    gap: 8,
  },
  loginButtonText: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: Colors.textInverse,
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 24,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: Colors.border,
  },
  dividerText: {
    paddingHorizontal: 16,
    color: Colors.textTertiary,
    fontSize: 14,
  },
  signupButton: {
    alignItems: 'center',
  },
  signupButtonText: {
    fontSize: 14,
    color: Colors.textSecondary,
  },
  signupLink: {
    color: Colors.primary,
    fontWeight: '600' as const,
  },
  testCredentials: {
    marginTop: 20,
    padding: 12,
    backgroundColor: Colors.surfaceSecondary,
    borderRadius: 8,
    alignItems: 'center',
  },
  testCredentialsLabel: {
    fontSize: 12,
    color: Colors.textTertiary,
    marginBottom: 4,
  },
  testCredentialsValue: {
    fontSize: 12,
    color: Colors.textSecondary,
    fontWeight: '500' as const,
  },
});
