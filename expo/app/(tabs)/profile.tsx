import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Image } from 'expo-image';
import {
  User,
  Shield,
  CreditCard,
  Bell,
  HelpCircle,
  LogOut,
  ChevronRight,
  Star,
  Package,
  Truck,
  CheckCircle,
  Clock,
  XCircle,
  Trash2,
  Wallet,
  Plane,
  FileText,
} from 'lucide-react-native';
import Colors from '@/constants/colors';
import { useAuth } from '@/contexts/AuthContext';
import { useDataStore } from '@/contexts/DataStoreContext';

export default function ProfileScreen() {
  const router = useRouter();
  const { user, logout, isAuthenticated, becomeTraveler } = useAuth();
  const { clearAllData } = useDataStore();

  const handleLogout = () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Logout',
          style: 'destructive',
          onPress: async () => {
            await logout();
            router.replace('/(tabs)');
          },
        },
      ]
    );
  };

  const handleClearData = () => {
    Alert.alert(
      'Clear All Data',
      'This will delete all shipments, quotes, and transactions. This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear Data',
          style: 'destructive',
          onPress: async () => {
            await clearAllData();
            Alert.alert('Success', 'All data has been cleared.');
          },
        },
      ]
    );
  };

  if (!isAuthenticated || !user) {
    return (
      <View style={styles.container}>
        <SafeAreaView edges={['top']} style={styles.header}>
          <Text style={styles.headerTitle}>Profile</Text>
        </SafeAreaView>
        <View style={styles.loginPrompt}>
          <User size={64} color={Colors.textTertiary} />
          <Text style={styles.loginTitle}>Sign in to continue</Text>
          <Text style={styles.loginSubtitle}>
            Access your profile, shipments, and more
          </Text>
          <TouchableOpacity
            style={styles.loginButton}
            onPress={() => router.push('/(auth)/login')}
          >
            <Text style={styles.loginButtonText}>Sign In</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  const getKYCIcon = () => {
    switch (user.kycStatus) {
      case 'approved':
        return <CheckCircle size={20} color={Colors.success} />;
      case 'pending':
        return <Clock size={20} color={Colors.warning} />;
      case 'rejected':
        return <XCircle size={20} color={Colors.error} />;
      default:
        return <Shield size={20} color={Colors.textTertiary} />;
    }
  };

  const getKYCStatusText = () => {
    switch (user.kycStatus) {
      case 'approved':
        return 'Verified';
      case 'pending':
        return 'Pending Review';
      case 'rejected':
        return 'Rejected';
      default:
        return 'Not Submitted';
    }
  };

  const getKYCStatusColor = () => {
    switch (user.kycStatus) {
      case 'approved':
        return Colors.success;
      case 'pending':
        return Colors.warning;
      case 'rejected':
        return Colors.error;
      default:
        return Colors.textTertiary;
    }
  };

  const isTraveler = user.activeRole === 'traveler';
  const canBecomeTraveler = !isTraveler && !user.roles.includes('traveler');

  const handleBecomeTraveler = async () => {
    if (user.kycStatus !== 'approved') {
      Alert.alert(
        'KYC Required',
        'Complete KYC verification first to unlock Traveler mode.',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Start KYC', onPress: () => router.push('/kyc' as any) },
        ],
      );
      return;
    }
    try {
      await becomeTraveler();
      Alert.alert('Welcome, Traveler!', 'You can now accept delivery jobs.');
    } catch (e: any) {
      Alert.alert('Error', e?.message ?? 'Failed to enable Traveler mode');
    }
  };

  return (
    <View style={styles.container}>
      <SafeAreaView edges={['top']} style={styles.header}>
        <Text style={styles.headerTitle}>Profile</Text>
      </SafeAreaView>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.profileCard}>
          <View style={styles.avatarContainer}>
            {user.avatarUrl ? (
              <Image source={{ uri: user.avatarUrl }} style={styles.avatar} />
            ) : (
              <View style={styles.avatarPlaceholder}>
                <User size={40} color={Colors.textTertiary} />
              </View>
            )}
            <TouchableOpacity style={styles.editAvatarButton}>
              <Text style={styles.editAvatarText}>Edit</Text>
            </TouchableOpacity>
          </View>

          <Text style={styles.userName}>{user.name}</Text>
          <Text style={styles.userEmail}>{user.email}</Text>
          <View style={styles.roleBadge}>
            <Text style={styles.roleBadgeText}>
              {isTraveler ? 'Traveler' : 'Sender'}
            </Text>
          </View>

          <View style={styles.statsRow}>
            <View style={styles.statItem}>
              <Star size={20} color={Colors.warning} />
              <Text style={styles.statValue}>{user.rating.toFixed(1)}</Text>
              <Text style={styles.statLabel}>Rating</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Package size={20} color={Colors.primary} />
              <Text style={styles.statValue}>{user.totalShipments}</Text>
              <Text style={styles.statLabel}>Sent</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Truck size={20} color={Colors.success} />
              <Text style={styles.statValue}>{user.totalDeliveries}</Text>
              <Text style={styles.statLabel}>Delivered</Text>
            </View>
          </View>
        </View>

        {canBecomeTraveler && (
          <TouchableOpacity
            testID="become-traveler-cta"
            style={styles.becomeCard}
            onPress={handleBecomeTraveler}
            activeOpacity={0.9}
          >
            <View style={styles.becomeIcon}>
              <Plane size={24} color={Colors.textInverse} />
            </View>
            <View style={styles.becomeContent}>
              <Text style={styles.becomeTitle}>Become a Traveler</Text>
              <Text style={styles.becomeSubtitle}>
                {user.kycStatus === 'approved'
                  ? 'Earn by carrying parcels on trips you\u2019re already taking.'
                  : 'Complete KYC to unlock and start earning.'}
              </Text>
            </View>
            <ChevronRight size={20} color={Colors.textInverse} />
          </TouchableOpacity>
        )}

        {/* Prominent KYC Section for Travelers */}
        {isTraveler && (
          <TouchableOpacity
            style={[
              styles.kycCard,
              user.kycStatus === 'approved' && styles.kycCardApproved,
              user.kycStatus === 'pending' && styles.kycCardPending,
              user.kycStatus === 'rejected' && styles.kycCardRejected,
              user.kycStatus === 'not_submitted' && styles.kycCardNotSubmitted,
            ]}
            onPress={() => router.push('/kyc' as any)}
          >
            <View style={[
              styles.kycIconContainer,
              user.kycStatus === 'approved' && styles.kycIconApproved,
              user.kycStatus === 'pending' && styles.kycIconPending,
              user.kycStatus === 'rejected' && styles.kycIconRejected,
            ]}>
              {user.kycStatus === 'approved' && <CheckCircle size={32} color={Colors.success} />}
              {user.kycStatus === 'pending' && <Clock size={32} color={Colors.warning} />}
              {user.kycStatus === 'rejected' && <XCircle size={32} color={Colors.error} />}
              {user.kycStatus === 'not_submitted' && <Shield size={32} color={Colors.textTertiary} />}
            </View>
            <View style={styles.kycContent}>
              <Text style={styles.kycTitle}>KYC Verification</Text>
              <Text style={[
                styles.kycStatus,
                user.kycStatus === 'approved' && { color: Colors.success },
                user.kycStatus === 'pending' && { color: Colors.warning },
                user.kycStatus === 'rejected' && { color: Colors.error },
              ]}>
                {getKYCStatusText()}
              </Text>
              {user.kycStatus === 'not_submitted' && (
                <Text style={styles.kycHint}>Required to accept deliveries</Text>
              )}
              {user.kycStatus === 'pending' && (
                <Text style={styles.kycHint}>Under review (24-48 hours)</Text>
              )}
            </View>
            <ChevronRight size={24} color={Colors.textTertiary} />
          </TouchableOpacity>
        )}

        <View style={styles.section}>
          {!isTraveler && (
            <TouchableOpacity
              style={styles.menuItem}
              onPress={() => router.push('/kyc' as any)}
            >
              <View style={styles.menuItemLeft}>
                {getKYCIcon()}
                <View style={styles.menuItemText}>
                  <Text style={styles.menuItemTitle}>Aadhaar Verification</Text>
                  <Text style={[styles.menuItemStatus, { color: getKYCStatusColor() }]}>
                    {user.aadhaarVerified ? 'Verified' : 'Not Verified'}
                  </Text>
                </View>
              </View>
              <ChevronRight size={20} color={Colors.textTertiary} />
            </TouchableOpacity>
          )}

          <TouchableOpacity style={styles.menuItem}>
            <View style={styles.menuItemLeft}>
              <CreditCard size={20} color={Colors.primary} />
              <View style={styles.menuItemText}>
                <Text style={styles.menuItemTitle}>Payment Methods</Text>
                <Text style={styles.menuItemSubtitle}>Manage your payment options</Text>
              </View>
            </View>
            <ChevronRight size={20} color={Colors.textTertiary} />
          </TouchableOpacity>

          {isTraveler && (
            <TouchableOpacity 
              style={styles.menuItem}
              onPress={() => router.push('/(tabs)/earnings')}
            >
              <View style={styles.menuItemLeft}>
                <Wallet size={20} color={Colors.success} />
                <View style={styles.menuItemText}>
                  <Text style={styles.menuItemTitle}>My Earnings</Text>
                  <Text style={styles.menuItemSubtitle}>View your delivery earnings</Text>
                </View>
              </View>
              <ChevronRight size={20} color={Colors.textTertiary} />
            </TouchableOpacity>
          )}

          <TouchableOpacity style={styles.menuItem}>
            <View style={styles.menuItemLeft}>
              <Bell size={20} color={Colors.primary} />
              <View style={styles.menuItemText}>
                <Text style={styles.menuItemTitle}>Notifications</Text>
                <Text style={styles.menuItemSubtitle}>Configure alerts and updates</Text>
              </View>
            </View>
            <ChevronRight size={20} color={Colors.textTertiary} />
          </TouchableOpacity>
        </View>

        <View style={styles.section}>
          <TouchableOpacity 
            style={styles.menuItem}
            onPress={() => router.push('/support')}
          >
            <View style={styles.menuItemLeft}>
              <HelpCircle size={20} color={Colors.textSecondary} />
              <View style={styles.menuItemText}>
                <Text style={styles.menuItemTitle}>Help & Support</Text>
                <Text style={styles.menuItemSubtitle}>FAQs and contact support</Text>
              </View>
            </View>
            <ChevronRight size={20} color={Colors.textTertiary} />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.menuItem}
            onPress={() => router.push('/legal' as any)}
            testID="profile-legal"
          >
            <View style={styles.menuItemLeft}>
              <FileText size={20} color={Colors.textSecondary} />
              <View style={styles.menuItemText}>
                <Text style={styles.menuItemTitle}>Legal & Policies</Text>
                <Text style={styles.menuItemSubtitle}>Terms, Privacy, Refunds, Safety</Text>
              </View>
            </View>
            <ChevronRight size={20} color={Colors.textTertiary} />
          </TouchableOpacity>

          <TouchableOpacity style={styles.menuItem} onPress={handleClearData}>
            <View style={styles.menuItemLeft}>
              <Trash2 size={20} color={Colors.error} />
              <View style={styles.menuItemText}>
                <Text style={styles.menuItemTitle}>Clear All Data</Text>
                <Text style={styles.menuItemSubtitle}>Delete all shipments and transactions</Text>
              </View>
            </View>
            <ChevronRight size={20} color={Colors.textTertiary} />
          </TouchableOpacity>
        </View>

        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <LogOut size={20} color={Colors.error} />
          <Text style={styles.logoutText}>Logout</Text>
        </TouchableOpacity>

        <Text style={styles.versionText}>Version 1.0.0</Text>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    paddingHorizontal: 20,
    paddingBottom: 12,
    backgroundColor: Colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '700' as const,
    color: Colors.text,
  },
  loginPrompt: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
  },
  loginTitle: {
    fontSize: 20,
    fontWeight: '600' as const,
    color: Colors.text,
    marginTop: 16,
  },
  loginSubtitle: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginTop: 8,
    textAlign: 'center',
  },
  loginButton: {
    backgroundColor: Colors.primary,
    paddingHorizontal: 32,
    paddingVertical: 14,
    borderRadius: 12,
    marginTop: 24,
  },
  loginButtonText: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: Colors.textInverse,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 100,
  },
  profileCard: {
    backgroundColor: Colors.surface,
    borderRadius: 20,
    padding: 24,
    alignItems: 'center',
    marginBottom: 20,
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 1,
    shadowRadius: 12,
    elevation: 4,
  },
  avatarContainer: {
    position: 'relative',
    marginBottom: 16,
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
  },
  avatarPlaceholder: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: Colors.surfaceSecondary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  editAvatarButton: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: Colors.primary,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  editAvatarText: {
    fontSize: 12,
    fontWeight: '600' as const,
    color: Colors.textInverse,
  },
  userName: {
    fontSize: 22,
    fontWeight: '700' as const,
    color: Colors.text,
    marginBottom: 4,
  },
  userEmail: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginBottom: 20,
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 18,
    fontWeight: '700' as const,
    color: Colors.text,
    marginTop: 4,
  },
  statLabel: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  statDivider: {
    width: 1,
    height: 40,
    backgroundColor: Colors.border,
  },
  section: {
    backgroundColor: Colors.surface,
    borderRadius: 16,
    marginBottom: 16,
    overflow: 'hidden',
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  menuItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 12,
  },
  menuItemText: {
    flex: 1,
  },
  menuItemTitle: {
    fontSize: 16,
    fontWeight: '500' as const,
    color: Colors.text,
  },
  menuItemSubtitle: {
    fontSize: 13,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  menuItemStatus: {
    fontSize: 13,
    fontWeight: '500' as const,
    marginTop: 2,
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.errorLight,
    padding: 16,
    borderRadius: 12,
    gap: 8,
    marginTop: 8,
  },
  logoutText: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: Colors.error,
  },
  versionText: {
    fontSize: 12,
    color: Colors.textTertiary,
    textAlign: 'center',
    marginTop: 24,
  },
  roleBadge: {
    backgroundColor: Colors.primaryLight + '30',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    marginBottom: 16,
  },
  roleBadgeText: {
    fontSize: 12,
    fontWeight: '600' as const,
    color: Colors.primary,
  },
  kycCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    borderWidth: 2,
    borderColor: Colors.border,
  },
  kycCardApproved: {
    borderColor: Colors.success,
    backgroundColor: Colors.successLight,
  },
  kycCardPending: {
    borderColor: Colors.warning,
    backgroundColor: Colors.warningLight,
  },
  kycCardRejected: {
    borderColor: Colors.error,
    backgroundColor: Colors.errorLight,
  },
  kycCardNotSubmitted: {
    borderColor: Colors.warning,
    borderStyle: 'dashed' as const,
  },
  kycIconContainer: {
    width: 56,
    height: 56,
    borderRadius: 14,
    backgroundColor: Colors.surfaceSecondary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  kycIconApproved: {
    backgroundColor: 'rgba(16, 185, 129, 0.2)',
  },
  kycIconPending: {
    backgroundColor: 'rgba(245, 158, 11, 0.2)',
  },
  kycIconRejected: {
    backgroundColor: 'rgba(239, 68, 68, 0.2)',
  },
  kycContent: {
    flex: 1,
  },
  kycTitle: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: Colors.text,
  },
  kycStatus: {
    fontSize: 14,
    fontWeight: '500' as const,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  kycHint: {
    fontSize: 12,
    color: Colors.textTertiary,
    marginTop: 2,
  },
  becomeCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.secondary,
    borderRadius: 18,
    padding: 16,
    marginBottom: 16,
    gap: 14,
  },
  becomeIcon: {
    width: 48,
    height: 48,
    borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.18)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  becomeContent: { flex: 1 },
  becomeTitle: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: Colors.textInverse,
  },
  becomeSubtitle: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.82)',
    marginTop: 2,
    lineHeight: 16,
  },
});
