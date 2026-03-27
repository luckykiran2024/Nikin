import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Package, Send, Plane, Shield } from 'lucide-react-native';
import Colors from '@/constants/colors';

export default function RoleSelectionScreen() {
  const router = useRouter();

  const handleRoleSelect = (role: 'sender' | 'traveler' | 'admin') => {
    router.push({
      pathname: '/(auth)/login',
      params: { role },
    });
  };

  return (
    <LinearGradient
      colors={[Colors.primary, Colors.primaryDark]}
      style={styles.gradient}
    >
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <View style={styles.logoContainer}>
            <Package size={56} color={Colors.textInverse} strokeWidth={1.5} />
          </View>
          <Text style={styles.title}>ParcelPeer</Text>
          <Text style={styles.subtitle}>
            Send parcels with trusted travelers
          </Text>
        </View>

        <View style={styles.content}>
          <Text style={styles.selectTitle}>How would you like to use ParcelPeer?</Text>

          <TouchableOpacity
            style={styles.roleCard}
            onPress={() => handleRoleSelect('sender')}
            activeOpacity={0.9}
          >
            <LinearGradient
              colors={['#F59E0B', '#D97706']}
              style={styles.roleCardGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              <View style={styles.roleIconContainer}>
                <Send size={32} color={Colors.textInverse} />
              </View>
              <View style={styles.roleTextContainer}>
                <Text style={styles.roleTitle}>Sender / Receiver</Text>
                <Text style={styles.roleDescription}>
                  Send or receive parcels through trusted travelers
                </Text>
              </View>
            </LinearGradient>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.roleCard}
            onPress={() => handleRoleSelect('traveler')}
            activeOpacity={0.9}
          >
            <LinearGradient
              colors={['#10B981', '#059669']}
              style={styles.roleCardGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              <View style={styles.roleIconContainer}>
                <Plane size={32} color={Colors.textInverse} />
              </View>
              <View style={styles.roleTextContainer}>
                <Text style={styles.roleTitle}>Traveler</Text>
                <Text style={styles.roleDescription}>
                  Earn money by delivering parcels on your trips
                </Text>
              </View>
              <View style={styles.kycBadge}>
                <Text style={styles.kycBadgeText}>KYC Required</Text>
              </View>
            </LinearGradient>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.roleCard}
            onPress={() => handleRoleSelect('admin')}
            activeOpacity={0.9}
          >
            <LinearGradient
              colors={['#8B5CF6', '#7C3AED']}
              style={styles.roleCardGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              <View style={styles.roleIconContainer}>
                <Shield size={32} color={Colors.textInverse} />
              </View>
              <View style={styles.roleTextContainer}>
                <Text style={styles.roleTitle}>Admin</Text>
                <Text style={styles.roleDescription}>
                  Manage platform operations and users
                </Text>
              </View>
            </LinearGradient>
          </TouchableOpacity>
        </View>

        <Text style={styles.footerText}>
          Choose your role to continue. You can always switch later.
        </Text>
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
    paddingHorizontal: 24,
  },
  header: {
    alignItems: 'center',
    marginTop: 32,
    marginBottom: 32,
  },
  logoContainer: {
    width: 100,
    height: 100,
    borderRadius: 28,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 36,
    fontWeight: '700' as const,
    color: Colors.textInverse,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.85)',
    textAlign: 'center',
  },
  content: {
    flex: 1,
  },
  selectTitle: {
    fontSize: 18,
    fontWeight: '600' as const,
    color: Colors.textInverse,
    textAlign: 'center',
    marginBottom: 24,
  },
  roleCard: {
    marginBottom: 16,
    borderRadius: 20,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 6,
  },
  roleCardGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    minHeight: 100,
  },
  roleIconContainer: {
    width: 60,
    height: 60,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  roleTextContainer: {
    flex: 1,
  },
  roleTitle: {
    fontSize: 20,
    fontWeight: '700' as const,
    color: Colors.textInverse,
    marginBottom: 4,
  },
  roleDescription: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.9)',
    lineHeight: 20,
  },
  kycBadge: {
    position: 'absolute',
    top: 12,
    right: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  kycBadgeText: {
    fontSize: 11,
    fontWeight: '600' as const,
    color: Colors.textInverse,
  },
  footerText: {
    fontSize: 13,
    color: 'rgba(255, 255, 255, 0.7)',
    textAlign: 'center',
    marginBottom: 24,
  },
});
