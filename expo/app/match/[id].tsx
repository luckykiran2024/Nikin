import React, { useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import {
  Sparkles,
  Star,
  User,
  TrendingUp,
  Route,
  IndianRupee,
  Award,
  CheckCircle2,
  Info,
  ArrowRight,
  Package,
  MapPin,
  ShieldCheck,
} from 'lucide-react-native';
import Colors from '@/constants/colors';
import { trpc } from '@/lib/trpc';
import { useDataStore } from '@/contexts/DataStoreContext';
import { useAuth } from '@/contexts/AuthContext';

type Match = {
  quoteId: string;
  travelerId: string;
  travelerName: string;
  travelerRating: number;
  amount: number;
  score: number;
  reasons: string[];
};

export default function MatchDetailsScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const shipmentId = id ?? '';
  const router = useRouter();
  const { user } = useAuth();
  const { getShipmentById, getQuotesForShipment, acceptQuote, createConversation } = useDataStore();

  const shipment = getShipmentById(shipmentId);
  const quotes = getQuotesForShipment(shipmentId);

  const matchesQuery = trpc.quotes.getBestMatches.useQuery(
    { shipmentId, limit: 5 },
    { enabled: !!shipmentId, refetchInterval: 5000 },
  );

  const [accepting, setAccepting] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState<boolean>(false);

  const matches = useMemo<Match[]>(() => (matchesQuery.data as Match[] | undefined) ?? [], [matchesQuery.data]);
  const top = matches[0];

  const onRefresh = async () => {
    setRefreshing(true);
    await matchesQuery.refetch();
    setRefreshing(false);
  };

  const handleAccept = (m: Match) => {
    Alert.alert(
      'Accept Best Match',
      `Accept ${m.travelerName} for ₹${m.amount}?\n\nThey have 15 minutes to confirm the job before payment.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Accept',
          onPress: async () => {
            setAccepting(m.quoteId);
            try {
              await acceptQuote(m.quoteId, createConversation);
              Alert.alert(
                'Match Accepted',
                'Waiting for the traveler to confirm. You will be notified.',
                [{ text: 'OK', onPress: () => router.replace(`/shipment/${shipmentId}` as any) }],
              );
            } catch (e: any) {
              Alert.alert('Error', e?.message || 'Failed to accept');
            } finally {
              setAccepting(null);
            }
          },
        },
      ],
    );
  };

  if (!shipment) {
    return (
      <View style={styles.container}>
        <Stack.Screen options={{ title: 'Match Details' }} />
        <View style={styles.empty}>
          <Package size={56} color={Colors.textTertiary} />
          <Text style={styles.emptyText}>Shipment not found</Text>
        </View>
      </View>
    );
  }

  const isSender = user?.id === shipment.senderId;

  return (
    <View style={styles.container}>
      <Stack.Screen
        options={{
          title: 'Best Matches',
          headerStyle: { backgroundColor: Colors.primary },
          headerTintColor: Colors.textInverse,
        }}
      />
      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.primary} />}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.heroCard}>
          <View style={styles.heroHeader}>
            <Sparkles size={18} color={Colors.accent} />
            <Text style={styles.heroTitle}>AI Suggested Matches</Text>
          </View>
          <Text style={styles.heroSubtitle}>
            Ranked by route overlap, rating, price fit and experience.
          </Text>
          <View style={styles.routePill}>
            <MapPin size={14} color={Colors.primary} />
            <Text style={styles.routeText} numberOfLines={1}>
              {shipment.pickupCity} <Text style={styles.routeArrow}>→</Text> {shipment.destinationCity}
            </Text>
          </View>
          <View style={styles.metaRow}>
            <View style={styles.metaItem}>
              <Text style={styles.metaLabel}>Parcel</Text>
              <Text style={styles.metaValue} numberOfLines={1}>{shipment.parcelDetails.description}</Text>
            </View>
            <View style={styles.metaItem}>
              <Text style={styles.metaLabel}>Quotes</Text>
              <Text style={styles.metaValue}>{quotes.length}</Text>
            </View>
          </View>
        </View>

        {matchesQuery.isLoading ? (
          <View style={styles.loadingBox}>
            <ActivityIndicator color={Colors.primary} />
            <Text style={styles.loadingText}>Analysing quotes...</Text>
          </View>
        ) : matches.length === 0 ? (
          <View style={styles.emptyCard}>
            <Info size={28} color={Colors.textTertiary} />
            <Text style={styles.emptyTitle}>No matches yet</Text>
            <Text style={styles.emptySubtitle}>
              Matches appear as travelers submit quotes. Pull to refresh.
            </Text>
          </View>
        ) : (
          <>
            {top && (
              <View style={styles.topCard}>
                <View style={styles.topBadge}>
                  <Award size={14} color={Colors.textInverse} />
                  <Text style={styles.topBadgeText}>TOP MATCH</Text>
                </View>
                <View style={styles.topHeader}>
                  <View style={styles.avatarLg}>
                    <User size={28} color={Colors.textInverse} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.topName}>{top.travelerName}</Text>
                    <View style={styles.ratingRow}>
                      <Star size={14} color={Colors.accent} fill={Colors.accent} />
                      <Text style={styles.ratingText}>{top.travelerRating.toFixed(1)}</Text>
                      <View style={styles.dot} />
                      <Text style={styles.ratingText}>Score {Math.round(top.score * 100)}%</Text>
                    </View>
                  </View>
                  <View style={styles.amountBox}>
                    <Text style={styles.amountLabel}>Quote</Text>
                    <Text style={styles.amountValue}>₹{top.amount}</Text>
                  </View>
                </View>

                <ScoreBreakdown score={top.score} />

                {top.reasons.length > 0 && (
                  <View style={styles.reasonsRow}>
                    {top.reasons.map((r) => (
                      <View key={r} style={styles.reasonChip}>
                        <CheckCircle2 size={12} color={Colors.success} />
                        <Text style={styles.reasonText}>{r}</Text>
                      </View>
                    ))}
                  </View>
                )}

                {isSender && (shipment.status === 'created' || shipment.status === 'quoted') && (
                  <TouchableOpacity
                    style={[styles.acceptBtn, accepting === top.quoteId && styles.acceptBtnDisabled]}
                    onPress={() => handleAccept(top)}
                    disabled={accepting === top.quoteId}
                    testID="accept-top-match"
                  >
                    {accepting === top.quoteId ? (
                      <ActivityIndicator color={Colors.textInverse} />
                    ) : (
                      <>
                        <ShieldCheck size={18} color={Colors.textInverse} />
                        <Text style={styles.acceptBtnText}>Accept Top Match</Text>
                      </>
                    )}
                  </TouchableOpacity>
                )}
              </View>
            )}

            {matches.length > 1 && (
              <>
                <Text style={styles.sectionLabel}>Other strong matches</Text>
                {matches.slice(1).map((m, idx) => (
                  <View key={m.quoteId} style={styles.matchCard}>
                    <View style={styles.rankBadge}>
                      <Text style={styles.rankText}>#{idx + 2}</Text>
                    </View>
                    <View style={styles.matchRow}>
                      <View style={styles.avatar}>
                        <User size={20} color={Colors.textInverse} />
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.matchName}>{m.travelerName}</Text>
                        <View style={styles.ratingRow}>
                          <Star size={12} color={Colors.accent} fill={Colors.accent} />
                          <Text style={styles.ratingTextSm}>{m.travelerRating.toFixed(1)}</Text>
                          <View style={styles.dotSm} />
                          <Text style={styles.ratingTextSm}>Score {Math.round(m.score * 100)}%</Text>
                        </View>
                      </View>
                      <Text style={styles.matchAmount}>₹{m.amount}</Text>
                    </View>

                    {m.reasons.length > 0 && (
                      <View style={styles.reasonsRow}>
                        {m.reasons.map((r) => (
                          <View key={r} style={styles.reasonChipSm}>
                            <Text style={styles.reasonTextSm}>{r}</Text>
                          </View>
                        ))}
                      </View>
                    )}

                    {isSender && (shipment.status === 'created' || shipment.status === 'quoted') && (
                      <TouchableOpacity
                        style={styles.secondaryBtn}
                        onPress={() => handleAccept(m)}
                        disabled={accepting === m.quoteId}
                        testID={`accept-match-${idx}`}
                      >
                        {accepting === m.quoteId ? (
                          <ActivityIndicator color={Colors.primary} size="small" />
                        ) : (
                          <>
                            <Text style={styles.secondaryBtnText}>Choose</Text>
                            <ArrowRight size={14} color={Colors.primary} />
                          </>
                        )}
                      </TouchableOpacity>
                    )}
                  </View>
                ))}
              </>
            )}
          </>
        )}

        <TouchableOpacity
          style={styles.viewAllBtn}
          onPress={() => router.push(`/shipment/${shipmentId}` as any)}
        >
          <Text style={styles.viewAllText}>View all quotes & shipment</Text>
          <ArrowRight size={16} color={Colors.primary} />
        </TouchableOpacity>

        <View style={styles.howItWorks}>
          <Text style={styles.howTitle}>How matching works</Text>
          <HowRow icon={Route} color={Colors.primary} label="Route overlap" weight="40%" />
          <HowRow icon={Star} color={Colors.accent} label="Traveler rating" weight="30%" />
          <HowRow icon={IndianRupee} color={Colors.success} label="Price fit" weight="20%" />
          <HowRow icon={TrendingUp} color={Colors.info} label="Experience" weight="10%" />
        </View>
      </ScrollView>
    </View>
  );
}

function ScoreBreakdown({ score }: { score: number }) {
  const pct = Math.max(0, Math.min(1, score));
  return (
    <View style={styles.scoreBox}>
      <View style={styles.scoreBar}>
        <View style={[styles.scoreFill, { width: `${pct * 100}%` }]} />
      </View>
      <Text style={styles.scoreLabel}>Match confidence {Math.round(pct * 100)}%</Text>
    </View>
  );
}

function HowRow({ icon: Icon, color, label, weight }: { icon: any; color: string; label: string; weight: string }) {
  return (
    <View style={styles.howRow}>
      <View style={[styles.howIcon, { backgroundColor: color + '20' }]}>
        <Icon size={14} color={color} />
      </View>
      <Text style={styles.howLabel}>{label}</Text>
      <Text style={styles.howWeight}>{weight}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  content: { padding: 20, paddingBottom: 60 },
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 40 },
  emptyText: { marginTop: 12, color: Colors.textSecondary, fontSize: 15 },
  heroCard: {
    backgroundColor: Colors.surfaceInk,
    borderRadius: 20,
    padding: 18,
    marginBottom: 16,
  },
  heroHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 6 },
  heroTitle: { color: Colors.textInverse, fontSize: 16, fontWeight: '700' as const },
  heroSubtitle: { color: 'rgba(255,255,255,0.72)', fontSize: 13, lineHeight: 18, marginBottom: 14 },
  routePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(255,255,255,0.08)',
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
  },
  routeText: { color: Colors.textInverse, fontSize: 13, fontWeight: '600' as const },
  routeArrow: { color: Colors.accent },
  metaRow: { flexDirection: 'row', marginTop: 14, gap: 12 },
  metaItem: { flex: 1, backgroundColor: 'rgba(255,255,255,0.05)', padding: 10, borderRadius: 12 },
  metaLabel: { color: 'rgba(255,255,255,0.55)', fontSize: 11, textTransform: 'uppercase' as const, letterSpacing: 0.5 },
  metaValue: { color: Colors.textInverse, fontSize: 14, fontWeight: '600' as const, marginTop: 2 },
  loadingBox: { padding: 32, alignItems: 'center', gap: 10 },
  loadingText: { color: Colors.textSecondary, fontSize: 13 },
  emptyCard: { backgroundColor: Colors.surface, borderRadius: 16, padding: 24, alignItems: 'center', gap: 8 },
  emptyTitle: { fontSize: 16, fontWeight: '600' as const, color: Colors.text },
  emptySubtitle: { fontSize: 13, color: Colors.textSecondary, textAlign: 'center' },
  topCard: {
    backgroundColor: Colors.surface,
    borderRadius: 20,
    padding: 18,
    borderWidth: 2,
    borderColor: Colors.primary,
    marginBottom: 20,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 4,
  },
  topBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    alignSelf: 'flex-start',
    backgroundColor: Colors.primary,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    marginBottom: 12,
  },
  topBadgeText: { color: Colors.textInverse, fontSize: 11, fontWeight: '800' as const, letterSpacing: 0.8 },
  topHeader: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  avatarLg: {
    width: 52, height: 52, borderRadius: 26,
    backgroundColor: Colors.primary, alignItems: 'center', justifyContent: 'center',
  },
  avatar: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: Colors.primary, alignItems: 'center', justifyContent: 'center',
  },
  topName: { fontSize: 18, fontWeight: '700' as const, color: Colors.text },
  ratingRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 4 },
  ratingText: { fontSize: 13, color: Colors.textSecondary, fontWeight: '500' as const },
  ratingTextSm: { fontSize: 12, color: Colors.textSecondary },
  dot: { width: 3, height: 3, borderRadius: 2, backgroundColor: Colors.textTertiary },
  dotSm: { width: 2, height: 2, borderRadius: 1, backgroundColor: Colors.textTertiary },
  amountBox: { alignItems: 'flex-end' },
  amountLabel: { fontSize: 11, color: Colors.textTertiary, textTransform: 'uppercase' as const },
  amountValue: { fontSize: 22, fontWeight: '800' as const, color: Colors.primary },
  scoreBox: { marginTop: 16 },
  scoreBar: { height: 8, backgroundColor: Colors.surfaceSecondary, borderRadius: 4, overflow: 'hidden' },
  scoreFill: { height: '100%', backgroundColor: Colors.primary, borderRadius: 4 },
  scoreLabel: { fontSize: 12, color: Colors.textSecondary, marginTop: 6 },
  reasonsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 12 },
  reasonChip: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: Colors.successLight, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8,
  },
  reasonText: { fontSize: 11, fontWeight: '600' as const, color: Colors.success },
  reasonChipSm: { backgroundColor: Colors.surfaceSecondary, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
  reasonTextSm: { fontSize: 11, color: Colors.textSecondary, fontWeight: '500' as const },
  acceptBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    backgroundColor: Colors.primary, paddingVertical: 14, borderRadius: 12, marginTop: 16,
  },
  acceptBtnDisabled: { opacity: 0.6 },
  acceptBtnText: { color: Colors.textInverse, fontWeight: '700' as const, fontSize: 15 },
  sectionLabel: {
    fontSize: 13, fontWeight: '600' as const, color: Colors.textSecondary,
    marginBottom: 10, textTransform: 'uppercase' as const, letterSpacing: 0.5,
  },
  matchCard: {
    backgroundColor: Colors.surface, borderRadius: 16, padding: 14, marginBottom: 10,
    borderWidth: 1, borderColor: Colors.border,
  },
  rankBadge: {
    position: 'absolute', top: 12, right: 12,
    backgroundColor: Colors.surfaceSecondary, paddingHorizontal: 8, paddingVertical: 2,
    borderRadius: 6,
  },
  rankText: { fontSize: 11, fontWeight: '700' as const, color: Colors.textSecondary },
  matchRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  matchName: { fontSize: 15, fontWeight: '600' as const, color: Colors.text },
  matchAmount: { fontSize: 16, fontWeight: '700' as const, color: Colors.primary, marginRight: 32 },
  secondaryBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6,
    backgroundColor: Colors.primaryLight + '40', paddingVertical: 10, borderRadius: 10, marginTop: 12,
  },
  secondaryBtnText: { color: Colors.primary, fontWeight: '700' as const, fontSize: 14 },
  viewAllBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6,
    paddingVertical: 14, marginTop: 6,
  },
  viewAllText: { color: Colors.primary, fontWeight: '600' as const, fontSize: 14 },
  howItWorks: {
    backgroundColor: Colors.surface, borderRadius: 16, padding: 16, marginTop: 8,
    borderWidth: 1, borderColor: Colors.borderLight,
  },
  howTitle: { fontSize: 14, fontWeight: '700' as const, color: Colors.text, marginBottom: 12 },
  howRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  howIcon: { width: 26, height: 26, borderRadius: 13, alignItems: 'center', justifyContent: 'center', marginRight: 10 },
  howLabel: { flex: 1, fontSize: 13, color: Colors.text },
  howWeight: { fontSize: 13, fontWeight: '700' as const, color: Colors.textSecondary },
});
