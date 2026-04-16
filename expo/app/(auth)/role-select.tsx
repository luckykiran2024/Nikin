import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Send, Plane, Shield, ArrowRight, Package2 } from 'lucide-react-native';
import Colors from '@/constants/colors';

type Role = 'sender' | 'traveler' | 'admin';

interface RoleCardProps {
  role: Role;
  title: string;
  subtitle: string;
  tag?: string;
  icon: React.ReactNode;
  onPress: () => void;
  accent: string;
  ink?: boolean;
  testId: string;
}

function RoleCard({ title, subtitle, tag, icon, onPress, accent, ink, testId }: RoleCardProps) {
  return (
    <TouchableOpacity
      testID={testId}
      style={[styles.card, ink && styles.cardInk]}
      onPress={onPress}
      activeOpacity={0.85}
    >
      <View style={[styles.cardIcon, { backgroundColor: accent }]}>{icon}</View>
      <View style={styles.cardBody}>
        <View style={styles.cardTitleRow}>
          <Text style={[styles.cardTitle, ink && styles.cardTitleInk]}>{title}</Text>
          {tag ? (
            <View style={[styles.tag, { backgroundColor: accent }]}>
              <Text style={styles.tagText}>{tag}</Text>
            </View>
          ) : null}
        </View>
        <Text style={[styles.cardSubtitle, ink && styles.cardSubtitleInk]}>{subtitle}</Text>
      </View>
      <View style={[styles.cardArrow, ink && styles.cardArrowInk]}>
        <ArrowRight size={18} color={ink ? Colors.textInverse : Colors.text} />
      </View>
    </TouchableOpacity>
  );
}

export default function RoleSelectionScreen() {
  const router = useRouter();

  const handleRoleSelect = (role: Role) => {
    router.push({ pathname: '/(auth)/login', params: { role } });
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <ScrollView
        contentContainerStyle={styles.container}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.heroRow}>
          <View style={styles.logoMark}>
            <Package2 size={22} color={Colors.textInverse} strokeWidth={2.5} />
          </View>
          <Text style={styles.brand}>ParcelPeer</Text>
        </View>

        <View style={styles.headerBlock}>
          <Text style={styles.kicker}>WELCOME</Text>
          <Text style={styles.title}>
            Move parcels{`
`}the human way.
          </Text>
          <Text style={styles.subtitle}>
            A peer-to-peer courier network. Choose how you&apos;d like to start.
          </Text>
        </View>

        <View style={styles.cards}>
          <RoleCard
            testId="role-sender"
            role="sender"
            title="I&apos;m sending"
            subtitle="Ship a parcel with a verified traveler heading your way."
            accent={Colors.primary}
            icon={<Send size={22} color={Colors.textInverse} />}
            onPress={() => handleRoleSelect('sender')}
          />
          <RoleCard
            testId="role-traveler"
            role="traveler"
            title="I&apos;m travelling"
            subtitle="Earn from trips you&apos;re already making. KYC required."
            tag="EARN"
            accent={Colors.accent}
            icon={<Plane size={22} color={Colors.textInverse} />}
            onPress={() => handleRoleSelect('traveler')}
          />
          <RoleCard
            testId="role-admin"
            role="admin"
            title="Operations / Admin"
            subtitle="Manage users, KYC, payouts and disputes."
            accent={Colors.primary}
            ink
            icon={<Shield size={22} color={Colors.textInverse} />}
            onPress={() => handleRoleSelect('admin')}
          />
        </View>

        <Text style={styles.footer}>
          By continuing you agree to our Terms & Privacy Policy.
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.background },
  container: {
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 32,
  },
  heroRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 40,
  },
  logoMark: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: Colors.secondary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  brand: {
    fontSize: 18,
    fontWeight: '800' as const,
    color: Colors.text,
    letterSpacing: -0.3,
  },
  headerBlock: {
    marginBottom: 36,
  },
  kicker: {
    fontSize: 12,
    fontWeight: '700' as const,
    color: Colors.primary,
    letterSpacing: 2,
    marginBottom: 12,
  },
  title: {
    fontSize: 40,
    lineHeight: 44,
    fontWeight: '800' as const,
    color: Colors.text,
    letterSpacing: -1.2,
  },
  subtitle: {
    marginTop: 12,
    fontSize: 15,
    lineHeight: 22,
    color: Colors.textSecondary,
  },
  cards: {
    gap: 14,
  },
  card: {
    backgroundColor: Colors.surface,
    borderRadius: 20,
    padding: 18,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
    ...Platform.select({
      ios: {
        shadowColor: Colors.shadow,
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.08,
        shadowRadius: 14,
      },
      android: { elevation: 2 },
      default: {},
    }),
  },
  cardInk: {
    backgroundColor: Colors.secondary,
    borderColor: Colors.secondary,
  },
  cardIcon: {
    width: 48,
    height: 48,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  cardBody: { flex: 1 },
  cardTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  cardTitle: {
    fontSize: 17,
    fontWeight: '700' as const,
    color: Colors.text,
    letterSpacing: -0.3,
  },
  cardTitleInk: { color: Colors.textInverse },
  cardSubtitle: {
    fontSize: 13,
    lineHeight: 18,
    color: Colors.textSecondary,
  },
  cardSubtitleInk: { color: 'rgba(255,255,255,0.7)' },
  cardArrow: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: Colors.surfaceSecondary,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 8,
  },
  cardArrowInk: {
    backgroundColor: 'rgba(255,255,255,0.12)',
  },
  tag: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  tagText: {
    fontSize: 10,
    fontWeight: '800' as const,
    color: Colors.textInverse,
    letterSpacing: 1,
  },
  footer: {
    marginTop: 28,
    textAlign: 'center',
    fontSize: 12,
    color: Colors.textTertiary,
  },
});
