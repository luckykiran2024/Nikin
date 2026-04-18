import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { Plane, ShieldCheck, Wallet, CheckCircle2 } from 'lucide-react-native';
import Colors from '@/constants/colors';
import { useAuth } from '@/contexts/AuthContext';

export default function BecomeTravelerScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const kycApproved = user?.kycStatus === 'approved';

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ padding: 20 }}>
      <Stack.Screen options={{ title: 'Become a Traveler', headerStyle: { backgroundColor: Colors.primary }, headerTintColor: Colors.textInverse }} />
      <View style={styles.hero}>
        <Plane size={44} color={Colors.primary} />
        <Text style={styles.title}>Earn on your trips</Text>
        <Text style={styles.sub}>Deliver parcels along your route and earn real money.</Text>
      </View>

      <View style={styles.card}>
        <Benefit icon={<Wallet size={20} color={Colors.primary} />} text="Earn ₹200–₹2000 per trip" />
        <Benefit icon={<ShieldCheck size={20} color={Colors.primary} />} text="Escrow-protected payouts" />
        <Benefit icon={<CheckCircle2 size={20} color={Colors.primary} />} text="You stay in control of what you carry" />
      </View>

      <View style={styles.stepCard}>
        <Text style={styles.stepTitle}>Unlock in 2 steps</Text>
        <Step n={1} title="Complete KYC" done={kycApproved} />
        <Step n={2} title="Add a travel route" done={false} />
      </View>

      {!kycApproved ? (
        <TouchableOpacity style={styles.cta} onPress={() => router.push('/kyc')} testID="start-kyc">
          <Text style={styles.ctaText}>Start KYC</Text>
        </TouchableOpacity>
      ) : (
        <TouchableOpacity style={styles.cta} onPress={() => router.push('/create-route')} testID="create-route">
          <Text style={styles.ctaText}>Add Your First Route</Text>
        </TouchableOpacity>
      )}
    </ScrollView>
  );
}

function Benefit({ icon, text }: { icon: React.ReactNode; text: string }) {
  return (
    <View style={styles.benefit}>
      {icon}
      <Text style={styles.benefitText}>{text}</Text>
    </View>
  );
}

function Step({ n, title, done }: { n: number; title: string; done: boolean }) {
  return (
    <View style={styles.step}>
      <View style={[styles.stepNum, done && styles.stepNumDone]}>
        {done ? <CheckCircle2 size={18} color={Colors.textInverse} /> : <Text style={styles.stepNumText}>{n}</Text>}
      </View>
      <Text style={[styles.stepText, done && { color: Colors.textTertiary, textDecorationLine: 'line-through' }]}>{title}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  hero: { alignItems: 'center', paddingVertical: 24 },
  title: { fontSize: 24, fontWeight: '800', color: Colors.text, marginTop: 12 },
  sub: { fontSize: 14, color: Colors.textSecondary, marginTop: 6, textAlign: 'center' },
  card: { backgroundColor: Colors.surface, borderRadius: 16, padding: 16, gap: 12, marginTop: 8, borderWidth: 1, borderColor: Colors.borderLight },
  benefit: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  benefitText: { color: Colors.text, fontSize: 14 },
  stepCard: { backgroundColor: Colors.surface, borderRadius: 16, padding: 16, marginTop: 16, borderWidth: 1, borderColor: Colors.borderLight },
  stepTitle: { fontSize: 16, fontWeight: '700', color: Colors.text, marginBottom: 12 },
  step: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 8 },
  stepNum: { width: 28, height: 28, borderRadius: 14, backgroundColor: Colors.primaryLight, alignItems: 'center', justifyContent: 'center' },
  stepNumDone: { backgroundColor: Colors.success },
  stepNumText: { color: Colors.primary, fontWeight: '700' },
  stepText: { color: Colors.text, fontSize: 15 },
  cta: { backgroundColor: Colors.primary, borderRadius: 14, padding: 16, alignItems: 'center', marginTop: 24 },
  ctaText: { color: Colors.textInverse, fontWeight: '700', fontSize: 16 },
});
