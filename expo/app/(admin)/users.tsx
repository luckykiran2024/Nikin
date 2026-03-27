import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Image,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { 
  Search, 
  Filter,
  Users as UsersIcon,
  Send,
  Plane,
  Star,
  MoreVertical,
  CheckCircle,
  XCircle,
  Clock,
} from 'lucide-react-native';
import Colors from '@/constants/colors';

interface MockUser {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: 'sender' | 'traveler';
  kycStatus: 'approved' | 'pending' | 'rejected' | 'not_submitted';
  rating: number;
  totalTrips: number;
  joinedDate: string;
  avatar: string;
  status: 'active' | 'suspended';
}

const mockUsers: MockUser[] = [
  {
    id: '1',
    name: 'Rahul Sharma',
    email: 'rahul@email.com',
    phone: '+91 98765 43210',
    role: 'sender',
    kycStatus: 'approved',
    rating: 4.8,
    totalTrips: 12,
    joinedDate: '2024-01-15',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop&crop=face',
    status: 'active',
  },
  {
    id: '2',
    name: 'Vikram Singh',
    email: 'vikram@email.com',
    phone: '+91 87654 32109',
    role: 'traveler',
    kycStatus: 'approved',
    rating: 4.9,
    totalTrips: 56,
    joinedDate: '2024-02-01',
    avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100&h=100&fit=crop&crop=face',
    status: 'active',
  },
  {
    id: '3',
    name: 'Priya Verma',
    email: 'priya@email.com',
    phone: '+91 76543 21098',
    role: 'sender',
    kycStatus: 'not_submitted',
    rating: 4.5,
    totalTrips: 8,
    joinedDate: '2024-03-10',
    avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&h=100&fit=crop&crop=face',
    status: 'active',
  },
  {
    id: '4',
    name: 'Anjali Reddy',
    email: 'anjali@email.com',
    phone: '+91 65432 10987',
    role: 'traveler',
    kycStatus: 'pending',
    rating: 4.7,
    totalTrips: 32,
    joinedDate: '2024-02-20',
    avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100&h=100&fit=crop&crop=face',
    status: 'active',
  },
  {
    id: '5',
    name: 'Karthik Nair',
    email: 'karthik@email.com',
    phone: '+91 54321 09876',
    role: 'traveler',
    kycStatus: 'rejected',
    rating: 3.2,
    totalTrips: 5,
    joinedDate: '2024-04-05',
    avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&h=100&fit=crop&crop=face',
    status: 'suspended',
  },
];

export default function UsersScreen() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFilter, setSelectedFilter] = useState<'all' | 'sender' | 'traveler'>('all');
  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = React.useCallback(() => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 1500);
  }, []);

  const filteredUsers = mockUsers.filter(user => {
    const matchesSearch = user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          user.email.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesFilter = selectedFilter === 'all' || user.role === selectedFilter;
    return matchesSearch && matchesFilter;
  });

  const getKycStatusBadge = (status: MockUser['kycStatus']) => {
    switch (status) {
      case 'approved':
        return { icon: CheckCircle, color: Colors.success, bg: Colors.successLight, text: 'Verified' };
      case 'pending':
        return { icon: Clock, color: Colors.warning, bg: Colors.warningLight, text: 'Pending' };
      case 'rejected':
        return { icon: XCircle, color: Colors.error, bg: Colors.errorLight, text: 'Rejected' };
      default:
        return { icon: Clock, color: Colors.textTertiary, bg: Colors.surfaceSecondary, text: 'Not Submitted' };
    }
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
              <UsersIcon size={22} color="#8B5CF6" />
            </View>
            <Text style={styles.headerTitle}>User Management</Text>
          </View>
        </SafeAreaView>
      </LinearGradient>

      <View style={styles.searchContainer}>
        <View style={styles.searchInputContainer}>
          <Search size={20} color={Colors.textTertiary} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search users..."
            placeholderTextColor={Colors.textTertiary}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>
        <TouchableOpacity style={styles.filterButton}>
          <Filter size={20} color={Colors.text} />
        </TouchableOpacity>
      </View>

      <View style={styles.filterTabs}>
        {(['all', 'sender', 'traveler'] as const).map((filter) => (
          <TouchableOpacity
            key={filter}
            style={[
              styles.filterTab,
              selectedFilter === filter && styles.filterTabActive,
            ]}
            onPress={() => setSelectedFilter(filter)}
          >
            <Text style={[
              styles.filterTabText,
              selectedFilter === filter && styles.filterTabTextActive,
            ]}>
              {filter === 'all' ? 'All' : filter === 'sender' ? 'Senders' : 'Travelers'}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <ScrollView
        style={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        <Text style={styles.resultCount}>{filteredUsers.length} users found</Text>

        {filteredUsers.map((user) => {
          const kyc = getKycStatusBadge(user.kycStatus);
          const KycIcon = kyc.icon;
          
          return (
            <TouchableOpacity key={user.id} style={styles.userCard}>
              <Image source={{ uri: user.avatar }} style={styles.userAvatar} />
              <View style={styles.userInfo}>
                <View style={styles.userHeader}>
                  <Text style={styles.userName}>{user.name}</Text>
                  {user.status === 'suspended' && (
                    <View style={styles.suspendedBadge}>
                      <Text style={styles.suspendedText}>Suspended</Text>
                    </View>
                  )}
                </View>
                <Text style={styles.userEmail}>{user.email}</Text>
                <View style={styles.userMeta}>
                  <View style={styles.roleBadge}>
                    {user.role === 'sender' ? (
                      <Send size={12} color="#F59E0B" />
                    ) : (
                      <Plane size={12} color="#10B981" />
                    )}
                    <Text style={[
                      styles.roleText,
                      { color: user.role === 'sender' ? '#F59E0B' : '#10B981' }
                    ]}>
                      {user.role === 'sender' ? 'Sender' : 'Traveler'}
                    </Text>
                  </View>
                  <View style={styles.ratingBadge}>
                    <Star size={12} color="#F59E0B" fill="#F59E0B" />
                    <Text style={styles.ratingText}>{user.rating}</Text>
                  </View>
                  <View style={[styles.kycBadge, { backgroundColor: kyc.bg }]}>
                    <KycIcon size={12} color={kyc.color} />
                    <Text style={[styles.kycText, { color: kyc.color }]}>{kyc.text}</Text>
                  </View>
                </View>
              </View>
              <TouchableOpacity style={styles.moreButton}>
                <MoreVertical size={20} color={Colors.textSecondary} />
              </TouchableOpacity>
            </TouchableOpacity>
          );
        })}

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
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: Colors.textInverse,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700' as const,
    color: Colors.textInverse,
  },
  searchContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingTop: 16,
    gap: 12,
  },
  searchInputContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderRadius: 12,
    paddingHorizontal: 14,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  searchInput: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 10,
    fontSize: 15,
    color: Colors.text,
  },
  filterButton: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: Colors.surface,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  filterTabs: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingTop: 16,
    gap: 10,
  },
  filterTab: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  filterTabActive: {
    backgroundColor: '#8B5CF6',
    borderColor: '#8B5CF6',
  },
  filterTabText: {
    fontSize: 13,
    fontWeight: '600' as const,
    color: Colors.textSecondary,
  },
  filterTabTextActive: {
    color: Colors.textInverse,
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 16,
  },
  resultCount: {
    fontSize: 13,
    color: Colors.textSecondary,
    marginBottom: 12,
  },
  userCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 8,
    elevation: 2,
  },
  userAvatar: {
    width: 52,
    height: 52,
    borderRadius: 14,
    marginRight: 14,
  },
  userInfo: {
    flex: 1,
  },
  userHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  userName: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: Colors.text,
  },
  suspendedBadge: {
    backgroundColor: Colors.errorLight,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  suspendedText: {
    fontSize: 10,
    fontWeight: '600' as const,
    color: Colors.error,
  },
  userEmail: {
    fontSize: 13,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  userMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 8,
  },
  roleBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  roleText: {
    fontSize: 11,
    fontWeight: '600' as const,
  },
  ratingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  ratingText: {
    fontSize: 11,
    fontWeight: '600' as const,
    color: Colors.text,
  },
  kycBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  kycText: {
    fontSize: 10,
    fontWeight: '600' as const,
  },
  moreButton: {
    padding: 8,
  },
});
