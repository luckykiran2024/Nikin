import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { Stack, useRouter } from 'expo-router';
import {
  FileText,
  Shield,
  AlertTriangle,
  Scale,
  RefreshCcw,
  HeartHandshake,
  Users,
  ChevronRight,
} from 'lucide-react-native';
import Colors from '@/constants/colors';
import { LEGAL_DOCS, LEGAL_VERSION, LEGAL_EFFECTIVE_DATE, LegalDocId } from '@/constants/legal';

const ICONS: Record<LegalDocId, React.ComponentType<{ size: number; color: string }>> = {
  terms: FileText,
  privacy: Shield,
  prohibited: AlertTriangle,
  liability: Scale,
  refund: RefreshCcw,
  safety: HeartHandshake,
  community: Users,
};

const ACCENTS: Record<LegalDocId, string> = {
  terms: Colors.primary,
  privacy: Colors.info,
  prohibited: Colors.error,
  liability: Colors.secondary,
  refund: Colors.warning,
  safety: Colors.success,
  community: Colors.accent,
};

export default function LegalIndexScreen() {
  const router = useRouter();
  const docs = Object.values(LEGAL_DOCS);

  return (
    <View style={styles.container} testID="legal-index">
      <Stack.Screen
        options={{
          title: 'Legal & Policies',
          headerStyle: { backgroundColor: Colors.primary },
          headerTintColor: Colors.textInverse,
        }}
      />
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.hero}>
          <Text style={styles.heroTitle}>Our Policies</Text>
          <Text style={styles.heroSubtitle}>
            Plain-English documents that govern how ParcelPeer works. Effective {LEGAL_EFFECTIVE_DATE} · v{LEGAL_VERSION}
          </Text>
        </View>

        {docs.map((d) => {
          const Icon = ICONS[d.id];
          const accent = ACCENTS[d.id];
          return (
            <TouchableOpacity
              key={d.id}
              testID={`legal-${d.id}`}
              style={styles.card}
              activeOpacity={0.85}
              onPress={() => router.push(`/legal/${d.id}` as any)}
            >
              <View style={[styles.iconWrap, { backgroundColor: accent + '1A' }]}>
                <Icon size={22} color={accent} />
              </View>
              <View style={styles.cardBody}>
                <Text style={styles.cardTitle}>{d.title}</Text>
                <Text style={styles.cardSub} numberOfLines={2}>
                  {d.subtitle}
                </Text>
              </View>
              <ChevronRight size={20} color={Colors.textTertiary} />
            </TouchableOpacity>
          );
        })}

        <Text style={styles.footer}>
          Have questions or concerns? Reach our grievance officer at grievance@parcelpeer.app.
        </Text>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  scroll: { flex: 1 },
  content: { padding: 20, paddingBottom: 48 },
  hero: {
    backgroundColor: Colors.secondary,
    padding: 20,
    borderRadius: 20,
    marginBottom: 20,
  },
  heroTitle: {
    color: Colors.textInverse,
    fontSize: 24,
    fontWeight: '800' as const,
    letterSpacing: -0.3,
  },
  heroSubtitle: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 13,
    marginTop: 6,
    lineHeight: 18,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    padding: 16,
    borderRadius: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: Colors.border,
    gap: 14,
  },
  iconWrap: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardBody: { flex: 1 },
  cardTitle: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: Colors.text,
  },
  cardSub: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  footer: {
    fontSize: 12,
    color: Colors.textTertiary,
    textAlign: 'center',
    marginTop: 24,
    lineHeight: 18,
  },
});
