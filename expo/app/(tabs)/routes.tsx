import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Route, Plus, Calendar } from 'lucide-react-native';
import Colors from '@/constants/colors';
import { mockTravelRoutes } from '@/mocks/data';

export default function RoutesScreen() {
  const router = useRouter();
  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = () => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 1000);
  };

  const myRoutes = mockTravelRoutes;

  return (
    <View style={styles.container}>
      <SafeAreaView edges={['top']} style={styles.header}>
        <Text style={styles.headerTitle}>My Routes</Text>
        <TouchableOpacity
          style={styles.addButton}
          onPress={() => router.push('/create-route')}
        >
          <Plus size={20} color={Colors.textInverse} />
          <Text style={styles.addButtonText}>Add Route</Text>
        </TouchableOpacity>
      </SafeAreaView>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.primary} />
        }
      >
        {myRoutes.length === 0 ? (
          <View style={styles.emptyState}>
            <Route size={64} color={Colors.textTertiary} />
            <Text style={styles.emptyTitle}>No routes published</Text>
            <Text style={styles.emptySubtitle}>
              Add your travel routes to receive shipment requests
            </Text>
            <TouchableOpacity
              style={styles.createButton}
              onPress={() => router.push('/create-route')}
            >
              <Text style={styles.createButtonText}>Add Your First Route</Text>
            </TouchableOpacity>
          </View>
        ) : (
          myRoutes.map((route) => (
            <View key={route.id} style={styles.routeCard}>
              <View style={styles.routeHeader}>
                <View style={styles.dateContainer}>
                  <Calendar size={16} color={Colors.primary} />
                  <Text style={styles.dateText}>{route.travelDate}</Text>
                </View>
              </View>

              <View style={styles.routePath}>
                <View style={styles.pathPoint}>
                  <View style={[styles.pathDot, { backgroundColor: Colors.primary }]} />
                  <View style={styles.pathInfo}>
                    <Text style={styles.pathLabel}>From</Text>
                    <Text style={styles.pathCity}>{route.fromCity}</Text>
                  </View>
                </View>
                <View style={styles.pathLine}>
                  <View style={styles.pathLineDashed} />
                </View>
                <View style={styles.pathPoint}>
                  <View style={[styles.pathDot, { backgroundColor: Colors.success }]} />
                  <View style={styles.pathInfo}>
                    <Text style={styles.pathLabel}>To</Text>
                    <Text style={styles.pathCity}>{route.toCity}</Text>
                  </View>
                </View>
              </View>

              {route.description && (
                <Text style={styles.routeDescription}>{route.description}</Text>
              )}

              <View style={styles.routeFooter}>
                <View style={styles.routeActions}>
                  <TouchableOpacity style={styles.editButton}>
                    <Text style={styles.editButtonText}>Edit</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.viewMatchesButton}>
                    <Text style={styles.viewMatchesText}>View Matches</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          ))
        )}

        <View style={styles.tipsCard}>
          <Text style={styles.tipsTitle}>Tips for Travelers</Text>
          <View style={styles.tipItem}>
            <View style={styles.tipDot} />
            <Text style={styles.tipText}>Add routes in advance to get more requests</Text>
          </View>
          <View style={styles.tipItem}>
            <View style={styles.tipDot} />
            <Text style={styles.tipText}>Complete KYC to build trust with senders</Text>
          </View>
          <View style={styles.tipItem}>
            <View style={styles.tipDot} />
            <Text style={styles.tipText}>Set competitive prices based on distance</Text>
          </View>
        </View>
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
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
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
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.primary,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 10,
    gap: 6,
  },
  addButtonText: {
    fontSize: 14,
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
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 64,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '600' as const,
    color: Colors.text,
    marginTop: 16,
  },
  emptySubtitle: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginTop: 8,
    textAlign: 'center',
    lineHeight: 20,
  },
  createButton: {
    backgroundColor: Colors.primary,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
    marginTop: 24,
  },
  createButtonText: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: Colors.textInverse,
  },
  routeCard: {
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
  routeHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  dateContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: Colors.primaryLight + '20',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  dateText: {
    fontSize: 13,
    fontWeight: '600' as const,
    color: Colors.primary,
  },
  
  routePath: {
    marginBottom: 12,
  },
  pathPoint: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  pathDot: {
    width: 14,
    height: 14,
    borderRadius: 7,
  },
  pathInfo: {
    flex: 1,
  },
  pathLabel: {
    fontSize: 11,
    color: Colors.textTertiary,
    textTransform: 'uppercase' as const,
    letterSpacing: 0.5,
  },
  pathCity: {
    fontSize: 18,
    fontWeight: '600' as const,
    color: Colors.text,
  },
  pathLine: {
    marginLeft: 6,
    height: 28,
    justifyContent: 'center',
  },
  pathLineDashed: {
    width: 2,
    height: '100%',
    backgroundColor: Colors.border,
    borderStyle: 'dashed' as const,
  },
  routeDescription: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginBottom: 16,
    lineHeight: 20,
  },
  routeFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  routeActions: {
    flexDirection: 'row',
    gap: 8,
  },
  editButton: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: Colors.surfaceSecondary,
  },
  editButtonText: {
    fontSize: 13,
    fontWeight: '600' as const,
    color: Colors.textSecondary,
  },
  viewMatchesButton: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: Colors.primary,
  },
  viewMatchesText: {
    fontSize: 13,
    fontWeight: '600' as const,
    color: Colors.textInverse,
  },
  tipsCard: {
    backgroundColor: Colors.infoLight,
    borderRadius: 16,
    padding: 16,
    marginTop: 8,
  },
  tipsTitle: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: Colors.info,
    marginBottom: 12,
  },
  tipItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    marginBottom: 8,
  },
  tipDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: Colors.info,
    marginTop: 6,
  },
  tipText: {
    flex: 1,
    fontSize: 14,
    color: Colors.info,
    lineHeight: 20,
  },
});
