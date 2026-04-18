import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  RefreshControl,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { 
  FileCheck,
  CheckCircle,
  XCircle,
  Eye,
  Calendar,
  Phone,
  Mail,
  IdCard,
  CreditCard,
  User,
  Landmark,
  Ban,
} from 'lucide-react-native';
import Colors from '@/constants/colors';
import { useDataStore } from '@/contexts/DataStoreContext';
import { KYCRequest } from '@/types';

export default function KYCRequestsScreen() {
  const { kycRequests, approveKYCRequest, rejectKYCRequest, cancelKYCRequest } = useDataStore();
  const [selectedTab, setSelectedTab] = useState<'pending' | 'all'>('pending');
  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 1000);
  }, []);

  const filteredRequests = selectedTab === 'pending'
    ? kycRequests.filter(r => r.status === 'pending')
    : kycRequests;

  const updateUserKYCStatus = async (userId: string, status: 'approved' | 'rejected') => {
    try {
      const storedUsers = await AsyncStorage.getItem('registered_users');
      if (storedUsers) {
        const registeredUsers = JSON.parse(storedUsers);
        const userEmail = Object.keys(registeredUsers).find(
          email => registeredUsers[email].id === userId
        );
        if (userEmail) {
          registeredUsers[userEmail].kycStatus = status;
          await AsyncStorage.setItem('registered_users', JSON.stringify(registeredUsers));
          console.log('Updated user KYC status:', userId, status);
        }
      }
    } catch (error) {
      console.log('Error updating user KYC status:', error);
    }
  };

  const handleApprove = (request: KYCRequest) => {
    Alert.alert(
      'Approve KYC',
      `Are you sure you want to approve KYC for ${request.userName}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Approve',
          onPress: async () => {
            try {
              await approveKYCRequest(request.id);
              await updateUserKYCStatus(request.userId, 'approved');
              Alert.alert('Success', `KYC approved for ${request.userName}. An email notification will be sent.`);
            } catch {
              Alert.alert('Error', 'Failed to approve KYC request');
            }
          },
        },
      ]
    );
  };

  const handleCancel = (request: KYCRequest) => {
    Alert.alert(
      'Cancel KYC Request',
      `Cancel the pending KYC request for ${request.userName}? The user's status will be reset to 'not submitted' and they can resubmit anytime.`,
      [
        { text: 'Keep Request', style: 'cancel' },
        {
          text: 'Cancel Request',
          style: 'destructive',
          onPress: async () => {
            try {
              await cancelKYCRequest(request.id, true);
              await updateUserKYCStatus(request.userId, 'rejected');
              Alert.alert('Cancelled', `KYC request for ${request.userName} has been cancelled.`);
            } catch (err: any) {
              console.log('[admin] cancel kyc error:', err);
              Alert.alert('Error', err?.message || 'Failed to cancel KYC request');
            }
          },
        },
      ]
    );
  };

  const handleReject = (request: KYCRequest) => {
    Alert.alert(
      'Reject KYC',
      `Are you sure you want to reject KYC for ${request.userName}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Reject',
          style: 'destructive',
          onPress: async () => {
            try {
              await rejectKYCRequest(request.id, 'Documents not clear or invalid');
              await updateUserKYCStatus(request.userId, 'rejected');
              Alert.alert('Rejected', `KYC rejected for ${request.userName}. An email notification will be sent.`);
            } catch {
              Alert.alert('Error', 'Failed to reject KYC request');
            }
          },
        },
      ]
    );
  };

  const pendingCount = kycRequests.filter(r => r.status === 'pending').length;

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  };

  const maskAadhaar = (num: string) => {
    if (num.length >= 8) {
      return `XXXX-XXXX-${num.slice(-4)}`;
    }
    return num;
  };

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['#8B5CF6', '#7C3AED']}
        style={styles.headerGradient}
      >
        <SafeAreaView edges={['top']}>
          <View style={styles.header}>
            <View style={styles.headerIcon}>
              <FileCheck size={22} color="#8B5CF6" />
            </View>
            <View>
              <Text style={styles.headerTitle}>KYC Requests</Text>
              <Text style={styles.headerSubtitle}>{pendingCount} pending review</Text>
            </View>
          </View>
        </SafeAreaView>
      </LinearGradient>

      <View style={styles.tabs}>
        <TouchableOpacity
          style={[styles.tab, selectedTab === 'pending' && styles.tabActive]}
          onPress={() => setSelectedTab('pending')}
        >
          <Text style={[styles.tabText, selectedTab === 'pending' && styles.tabTextActive]}>
            Pending ({pendingCount})
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, selectedTab === 'all' && styles.tabActive]}
          onPress={() => setSelectedTab('all')}
        >
          <Text style={[styles.tabText, selectedTab === 'all' && styles.tabTextActive]}>
            All Requests ({kycRequests.length})
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {filteredRequests.length === 0 ? (
          <View style={styles.emptyState}>
            <FileCheck size={48} color={Colors.textTertiary} />
            <Text style={styles.emptyText}>
              {selectedTab === 'pending' ? 'No pending KYC requests' : 'No KYC requests yet'}
            </Text>
            <Text style={styles.emptySubtext}>
              KYC requests submitted by travelers will appear here
            </Text>
          </View>
        ) : (
          filteredRequests.map((request) => (
            <View key={request.id} style={styles.requestCard}>
              <View style={styles.requestHeader}>
                {request.avatar ? (
                  <Image source={{ uri: request.avatar }} style={styles.avatar} />
                ) : (
                  <View style={styles.avatarPlaceholder}>
                    <User size={24} color={Colors.textTertiary} />
                  </View>
                )}
                <View style={styles.userInfo}>
                  <Text style={styles.userName}>{request.userName}</Text>
                  <View style={styles.roleBadge}>
                    <Text style={styles.roleText}>{request.userRole}</Text>
                  </View>
                  <View style={styles.contactInfo}>
                    <Mail size={12} color={Colors.textTertiary} />
                    <Text style={styles.contactText}>{request.userEmail}</Text>
                  </View>
                  <View style={styles.contactInfo}>
                    <Phone size={12} color={Colors.textTertiary} />
                    <Text style={styles.contactText}>{request.userPhone}</Text>
                  </View>
                </View>
                {request.status !== 'pending' && (
                  <View style={[
                    styles.statusBadge,
                    { backgroundColor: request.status === 'approved' ? Colors.successLight : Colors.errorLight }
                  ]}>
                    {request.status === 'approved' ? (
                      <CheckCircle size={14} color={Colors.success} />
                    ) : (
                      <XCircle size={14} color={Colors.error} />
                    )}
                    <Text style={[
                      styles.statusText,
                      { color: request.status === 'approved' ? Colors.success : Colors.error }
                    ]}>
                      {request.status === 'approved' ? 'Approved' : 'Rejected'}
                    </Text>
                  </View>
                )}
              </View>

              <View style={styles.documentInfo}>
                <View style={styles.documentRow}>
                  <IdCard size={16} color={Colors.textSecondary} />
                  <Text style={styles.documentLabel}>Aadhaar:</Text>
                  <Text style={styles.documentValue}>{maskAadhaar(request.aadhaarNumber)}</Text>
                </View>
                <View style={styles.documentRow}>
                  <CreditCard size={16} color={Colors.textSecondary} />
                  <Text style={styles.documentLabel}>PAN:</Text>
                  <Text style={styles.documentValue}>{request.panNumber}</Text>
                </View>
                {request.passportNumber && (
                  <View style={styles.documentRow}>
                    <Text style={styles.documentLabel}>Passport:</Text>
                    <Text style={styles.documentValue}>{request.passportNumber}</Text>
                  </View>
                )}
                {request.drivingLicenseNumber && (
                  <View style={styles.documentRow}>
                    <Text style={styles.documentLabel}>DL:</Text>
                    <Text style={styles.documentValue}>{request.drivingLicenseNumber}</Text>
                  </View>
                )}
                {request.bankAccountNumber && (
                  <>
                    <View style={styles.documentRow}>
                      <Landmark size={16} color={Colors.textSecondary} />
                      <Text style={styles.documentLabel}>Bank A/C:</Text>
                      <Text style={styles.documentValue}>
                        •••• {request.bankAccountNumber.slice(-4)}
                        {request.bankVerified ? '  ✓' : ''}
                      </Text>
                    </View>
                    {request.bankIfsc && (
                      <View style={styles.documentRow}>
                        <Text style={styles.documentLabel}>IFSC:</Text>
                        <Text style={styles.documentValue}>{request.bankIfsc}</Text>
                      </View>
                    )}
                    {request.bankAccountHolder && (
                      <View style={styles.documentRow}>
                        <Text style={styles.documentLabel}>Holder:</Text>
                        <Text style={styles.documentValue}>{request.bankAccountHolder}</Text>
                      </View>
                    )}
                  </>
                )}
                <View style={styles.documentRow}>
                  <Calendar size={16} color={Colors.textSecondary} />
                  <Text style={styles.documentLabel}>Submitted:</Text>
                  <Text style={styles.documentValue}>{formatDate(request.submittedAt)}</Text>
                </View>
                {request.reviewedAt && (
                  <View style={styles.documentRow}>
                    <Text style={styles.documentLabel}>Reviewed:</Text>
                    <Text style={styles.documentValue}>{formatDate(request.reviewedAt)}</Text>
                  </View>
                )}
              </View>

              {request.status === 'pending' && (
                <View style={styles.actions}>
                  <TouchableOpacity style={styles.viewButton}>
                    <Eye size={18} color="#8B5CF6" />
                    <Text style={styles.viewButtonText}>View Documents</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.cancelButton}
                    onPress={() => handleCancel(request)}
                    testID={`cancel-kyc-${request.id}`}
                  >
                    <Ban size={18} color={Colors.textSecondary} />
                    <Text style={styles.cancelButtonText}>Cancel Request</Text>
                  </TouchableOpacity>
                  <View style={styles.actionButtons}>
                    <TouchableOpacity
                      style={styles.rejectButton}
                      onPress={() => handleReject(request)}
                    >
                      <XCircle size={18} color={Colors.error} />
                      <Text style={styles.rejectButtonText}>Reject</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.approveButton}
                      onPress={() => handleApprove(request)}
                    >
                      <CheckCircle size={18} color={Colors.textInverse} />
                      <Text style={styles.approveButtonText}>Approve</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              )}
            </View>
          ))
        )}

        <View style={{ height: 100 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  headerGradient: {
    paddingBottom: 20,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 12,
    gap: 12,
  },
  headerIcon: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: Colors.textInverse,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700' as const,
    color: Colors.textInverse,
  },
  headerSubtitle: {
    fontSize: 13,
    color: 'rgba(255, 255, 255, 0.8)',
  },
  tabs: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingTop: 16,
    gap: 12,
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: Colors.surface,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  tabActive: {
    backgroundColor: '#8B5CF6',
    borderColor: '#8B5CF6',
  },
  tabText: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: Colors.textSecondary,
  },
  tabTextActive: {
    color: Colors.textInverse,
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 16,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
    gap: 12,
  },
  emptyText: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: Colors.textSecondary,
  },
  emptySubtext: {
    fontSize: 14,
    color: Colors.textTertiary,
    textAlign: 'center',
  },
  requestCard: {
    backgroundColor: Colors.surface,
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 8,
    elevation: 2,
  },
  requestHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 14,
    marginRight: 14,
  },
  avatarPlaceholder: {
    width: 56,
    height: 56,
    borderRadius: 14,
    marginRight: 14,
    backgroundColor: Colors.surfaceSecondary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    fontSize: 17,
    fontWeight: '600' as const,
    color: Colors.text,
    marginBottom: 4,
  },
  roleBadge: {
    alignSelf: 'flex-start',
    backgroundColor: Colors.primaryLight + '30',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
    marginBottom: 6,
  },
  roleText: {
    fontSize: 11,
    fontWeight: '600' as const,
    color: Colors.primary,
    textTransform: 'capitalize',
  },
  contactInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 2,
  },
  contactText: {
    fontSize: 12,
    color: Colors.textSecondary,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600' as const,
  },
  documentInfo: {
    marginTop: 16,
    padding: 14,
    backgroundColor: Colors.surfaceSecondary,
    borderRadius: 12,
    gap: 8,
  },
  documentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  documentLabel: {
    fontSize: 13,
    color: Colors.textSecondary,
  },
  documentValue: {
    fontSize: 13,
    fontWeight: '600' as const,
    color: Colors.text,
  },
  actions: {
    marginTop: 16,
    gap: 12,
  },
  viewButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#8B5CF6',
    backgroundColor: 'rgba(139, 92, 246, 0.08)',
  },
  viewButtonText: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: '#8B5CF6',
  },
  cancelButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.surfaceSecondary,
  },
  cancelButtonText: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: Colors.textSecondary,
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  rejectButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: Colors.errorLight,
  },
  rejectButtonText: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: Colors.error,
  },
  approveButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: Colors.success,
  },
  approveButtonText: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: Colors.textInverse,
  },
});
