import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { 
  Users, 
  Package, 
  FileCheck, 
  Wallet, 
  TrendingUp,
  ArrowUpRight,
  LogOut,
  Shield,
  MessageSquare,
  Clock,
} from 'lucide-react-native';
import Colors from '@/constants/colors';
import { useAuth } from '@/contexts/AuthContext';
import { useDataStore } from '@/contexts/DataStoreContext';
import { useRouter } from 'expo-router';

const stats = [
  { 
    label: 'Total Users', 
    value: '2,456', 
    change: '+12%', 
    icon: Users, 
    color: '#3B82F6',
    bgColor: '#DBEAFE',
  },
  { 
    label: 'Active Shipments', 
    value: '189', 
    change: '+8%', 
    icon: Package, 
    color: '#10B981',
    bgColor: '#D1FAE5',
  },
  { 
    label: 'Pending KYC', 
    value: '24', 
    change: '-5%', 
    icon: FileCheck, 
    color: '#F59E0B',
    bgColor: '#FEF3C7',
  },
  { 
    label: 'Revenue (MTD)', 
    value: '₹4.2L', 
    change: '+18%', 
    icon: Wallet, 
    color: '#8B5CF6',
    bgColor: '#EDE9FE',
  },
];

const recentActivities = [
  { id: '1', type: 'kyc', message: 'New KYC request from Amit Kumar', time: '2 min ago' },
  { id: '2', type: 'shipment', message: 'Shipment #SHP-1234 delivered', time: '15 min ago' },
  { id: '3', type: 'payment', message: 'Payment of ₹2,500 released', time: '1 hour ago' },
  { id: '4', type: 'user', message: 'New traveler registration', time: '2 hours ago' },
  { id: '5', type: 'dispute', message: 'Dispute raised for #SHP-1198', time: '3 hours ago' },
];

export default function AdminDashboardScreen() {
  const { user, logout } = useAuth();
  const { tickets, shipments } = useDataStore();
  const router = useRouter();
  const [refreshing, setRefreshing] = React.useState(false);

  const openTickets = tickets.filter(t => t.status === 'open' || t.status === 'in_progress');
  const activeShipmentsCount = shipments.filter(s => s.status !== 'completed' && s.status !== 'delivered').length;
  console.log('Active shipments:', activeShipmentsCount);

  const onRefresh = React.useCallback(() => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 1500);
  }, []);

  const handleLogout = async () => {
    await logout();
    router.replace('/(auth)/role-select');
  };

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['#8B5CF6', '#7C3AED']}
        style={styles.headerGradient}
      >
        <SafeAreaView edges={['top']}>
          <View style={styles.header}>
            <View style={styles.headerLeft}>
              <View style={styles.adminBadge}>
                <Shield size={18} color="#8B5CF6" />
              </View>
              <View>
                <Text style={styles.welcomeText}>Admin Panel</Text>
                <Text style={styles.userName}>{user?.name || 'Admin'}</Text>
              </View>
            </View>
            <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
              <LogOut size={20} color={Colors.textInverse} />
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </LinearGradient>

      <ScrollView
        style={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        <View style={styles.statsGrid}>
          {stats.map((stat, index) => {
            const Icon = stat.icon;
            return (
              <View key={index} style={styles.statCard}>
                <View style={[styles.statIconContainer, { backgroundColor: stat.bgColor }]}>
                  <Icon size={22} color={stat.color} />
                </View>
                <Text style={styles.statValue}>{stat.value}</Text>
                <Text style={styles.statLabel}>{stat.label}</Text>
                <View style={styles.statChange}>
                  <TrendingUp size={12} color={stat.change.startsWith('+') ? Colors.success : Colors.error} />
                  <Text style={[
                    styles.statChangeText,
                    { color: stat.change.startsWith('+') ? Colors.success : Colors.error }
                  ]}>
                    {stat.change}
                  </Text>
                </View>
              </View>
            );
          })}
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Recent Activity</Text>
            <TouchableOpacity>
              <Text style={styles.viewAllText}>View All</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.activityList}>
            {recentActivities.map((activity) => (
              <View key={activity.id} style={styles.activityItem}>
                <View style={styles.activityDot} />
                <View style={styles.activityContent}>
                  <Text style={styles.activityMessage}>{activity.message}</Text>
                  <Text style={styles.activityTime}>{activity.time}</Text>
                </View>
                <ArrowUpRight size={16} color={Colors.textTertiary} />
              </View>
            ))}
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Quick Actions</Text>
          <View style={styles.quickActions}>
            <TouchableOpacity 
              style={styles.quickActionButton}
              onPress={() => router.push('/(admin)/kyc-requests' as any)}
            >
              <FileCheck size={24} color="#F59E0B" />
              <Text style={styles.quickActionText}>Review KYC</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={styles.quickActionButton}
              onPress={() => router.push('/(admin)/users' as any)}
            >
              <Users size={24} color="#3B82F6" />
              <Text style={styles.quickActionText}>Manage Users</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={styles.quickActionButton}
              onPress={() => router.push('/(admin)/payments' as any)}
            >
              <Wallet size={24} color="#8B5CF6" />
              <Text style={styles.quickActionText}>View Payments</Text>
            </TouchableOpacity>
          </View>
        </View>

        {openTickets.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <View style={styles.ticketHeaderLeft}>
                <MessageSquare size={20} color="#EF4444" />
                <Text style={styles.sectionTitle}>Escalated Tickets</Text>
              </View>
              <View style={styles.ticketBadge}>
                <Text style={styles.ticketBadgeText}>{openTickets.length}</Text>
              </View>
            </View>

            <View style={styles.ticketList}>
              {openTickets.slice(0, 5).map((ticket) => (
                <TouchableOpacity key={ticket.id} style={styles.ticketItem}>
                  <View style={styles.ticketLeft}>
                    <View style={[
                      styles.priorityIndicator,
                      ticket.priority === 'urgent' && styles.priorityUrgent,
                      ticket.priority === 'high' && styles.priorityHigh,
                      ticket.priority === 'medium' && styles.priorityMedium,
                    ]} />
                    <View style={styles.ticketInfo}>
                      <Text style={styles.ticketNumber}>#{ticket.ticketNumber}</Text>
                      <Text style={styles.ticketUser}>{ticket.userName}</Text>
                      <Text style={styles.ticketCategory}>{ticket.category}</Text>
                    </View>
                  </View>
                  <View style={styles.ticketRight}>
                    <View style={[
                      styles.ticketStatusBadge,
                      ticket.status === 'open' && styles.statusOpen,
                      ticket.status === 'in_progress' && styles.statusInProgress,
                    ]}>
                      <Text style={styles.ticketStatusText}>
                        {ticket.status === 'open' ? 'Open' : 'In Progress'}
                      </Text>
                    </View>
                    <View style={styles.ticketTime}>
                      <Clock size={12} color={Colors.textTertiary} />
                      <Text style={styles.ticketTimeText}>
                        {new Date(ticket.createdAt).toLocaleDateString()}
                      </Text>
                    </View>
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          </View>
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
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 12,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  adminBadge: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: Colors.textInverse,
    justifyContent: 'center',
    alignItems: 'center',
  },
  welcomeText: {
    fontSize: 13,
    color: 'rgba(255, 255, 255, 0.8)',
  },
  userName: {
    fontSize: 18,
    fontWeight: '700' as const,
    color: Colors.textInverse,
  },
  logoutButton: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    flex: 1,
    marginTop: -10,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 16,
    gap: 12,
    marginTop: 20,
  },
  statCard: {
    width: '47%',
    backgroundColor: Colors.surface,
    borderRadius: 16,
    padding: 16,
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 8,
    elevation: 2,
  },
  statIconContainer: {
    width: 44,
    height: 44,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  statValue: {
    fontSize: 24,
    fontWeight: '700' as const,
    color: Colors.text,
  },
  statLabel: {
    fontSize: 13,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  statChange: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 8,
  },
  statChangeText: {
    fontSize: 12,
    fontWeight: '600' as const,
  },
  section: {
    marginTop: 24,
    paddingHorizontal: 20,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700' as const,
    color: Colors.text,
  },
  viewAllText: {
    fontSize: 14,
    color: '#8B5CF6',
    fontWeight: '600' as const,
  },
  activityList: {
    backgroundColor: Colors.surface,
    borderRadius: 16,
    overflow: 'hidden',
  },
  activityItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  activityDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#8B5CF6',
    marginRight: 12,
  },
  activityContent: {
    flex: 1,
  },
  activityMessage: {
    fontSize: 14,
    color: Colors.text,
    marginBottom: 2,
  },
  activityTime: {
    fontSize: 12,
    color: Colors.textTertiary,
  },
  quickActions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 12,
  },
  quickActionButton: {
    flex: 1,
    backgroundColor: Colors.surface,
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    gap: 8,
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 8,
    elevation: 2,
  },
  quickActionText: {
    fontSize: 12,
    fontWeight: '600' as const,
    color: Colors.text,
    textAlign: 'center',
  },
  ticketHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  ticketBadge: {
    backgroundColor: '#EF4444',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  ticketBadgeText: {
    fontSize: 12,
    fontWeight: '700' as const,
    color: Colors.textInverse,
  },
  ticketList: {
    backgroundColor: Colors.surface,
    borderRadius: 16,
    overflow: 'hidden',
  },
  ticketItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  ticketLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  priorityIndicator: {
    width: 4,
    height: 40,
    borderRadius: 2,
    backgroundColor: Colors.textTertiary,
    marginRight: 12,
  },
  priorityUrgent: {
    backgroundColor: '#EF4444',
  },
  priorityHigh: {
    backgroundColor: '#F59E0B',
  },
  priorityMedium: {
    backgroundColor: '#3B82F6',
  },
  ticketInfo: {
    flex: 1,
  },
  ticketNumber: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: Colors.text,
  },
  ticketUser: {
    fontSize: 13,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  ticketCategory: {
    fontSize: 12,
    color: Colors.textTertiary,
    marginTop: 2,
  },
  ticketRight: {
    alignItems: 'flex-end',
  },
  ticketStatusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    backgroundColor: Colors.surfaceSecondary,
  },
  statusOpen: {
    backgroundColor: '#FEE2E2',
  },
  statusInProgress: {
    backgroundColor: '#FEF3C7',
  },
  ticketStatusText: {
    fontSize: 11,
    fontWeight: '600' as const,
    color: Colors.text,
  },
  ticketTime: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 6,
  },
  ticketTimeText: {
    fontSize: 11,
    color: Colors.textTertiary,
  },
});
