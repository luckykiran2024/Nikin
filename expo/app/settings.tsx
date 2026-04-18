import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Switch } from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { Bell, Globe, Moon, Shield, FileText, Trash2, ChevronRight } from 'lucide-react-native';
import Colors from '@/constants/colors';

export default function SettingsScreen() {
  const router = useRouter();
  const [pushEnabled, setPushEnabled] = React.useState<boolean>(true);
  const [darkMode, setDarkMode] = React.useState<boolean>(false);

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ padding: 16 }}>
      <Stack.Screen options={{ title: 'Settings', headerStyle: { backgroundColor: Colors.primary }, headerTintColor: Colors.textInverse }} />

      <Section title="Preferences">
        <Row icon={<Bell size={20} color={Colors.primary} />} label="Push notifications" right={<Switch value={pushEnabled} onValueChange={setPushEnabled} />} />
        <Row icon={<Moon size={20} color={Colors.primary} />} label="Dark mode" right={<Switch value={darkMode} onValueChange={setDarkMode} />} />
        <Row icon={<Globe size={20} color={Colors.primary} />} label="Language" value="English" onPress={() => {}} />
      </Section>

      <Section title="Privacy & Legal">
        <Row icon={<Shield size={20} color={Colors.primary} />} label="Privacy Policy" onPress={() => router.push('/legal/privacy' as any)} />
        <Row icon={<FileText size={20} color={Colors.primary} />} label="Terms of Service" onPress={() => router.push('/legal/terms' as any)} />
        <Row icon={<FileText size={20} color={Colors.primary} />} label="Prohibited Items" onPress={() => router.push('/legal/prohibited' as any)} />
      </Section>

      <Section title="Account">
        <Row icon={<Trash2 size={20} color={Colors.error} />} label="Delete account" labelColor={Colors.error} onPress={() => router.push('/support')} />
      </Section>
    </ScrollView>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <View style={{ marginBottom: 20 }}>
      <Text style={styles.section}>{title}</Text>
      <View style={styles.card}>{children}</View>
    </View>
  );
}

function Row({ icon, label, value, right, onPress, labelColor }: { icon: React.ReactNode; label: string; value?: string; right?: React.ReactNode; onPress?: () => void; labelColor?: string }) {
  return (
    <TouchableOpacity style={styles.row} onPress={onPress} disabled={!onPress} activeOpacity={0.7}>
      <View style={styles.rowLeft}>
        {icon}
        <Text style={[styles.rowLabel, labelColor ? { color: labelColor } : null]}>{label}</Text>
      </View>
      <View style={styles.rowRight}>
        {value ? <Text style={styles.rowValue}>{value}</Text> : null}
        {right ?? (onPress ? <ChevronRight size={18} color={Colors.textTertiary} /> : null)}
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  section: { fontSize: 13, fontWeight: '600', color: Colors.textSecondary, marginBottom: 8, marginLeft: 4, textTransform: 'uppercase', letterSpacing: 0.5 },
  card: { backgroundColor: Colors.surface, borderRadius: 14, borderWidth: 1, borderColor: Colors.borderLight, overflow: 'hidden' },
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 14, borderBottomWidth: 1, borderBottomColor: Colors.borderLight },
  rowLeft: { flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1 },
  rowLabel: { fontSize: 15, color: Colors.text },
  rowRight: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  rowValue: { fontSize: 14, color: Colors.textSecondary },
});
