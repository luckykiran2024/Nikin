import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ScrollView, Alert } from 'react-native';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { AlertTriangle } from 'lucide-react-native';
import Colors from '@/constants/colors';
import type { DisputeType } from '@/types';

const TYPES: { id: DisputeType; label: string }[] = [
  { id: 'not_delivered', label: 'Not delivered' },
  { id: 'wrong_item', label: 'Wrong item' },
  { id: 'damaged', label: 'Damaged' },
  { id: 'payment_issue', label: 'Payment issue' },
  { id: 'other', label: 'Other' },
];

export default function RaiseDisputeScreen() {
  const { shipmentId } = useLocalSearchParams<{ shipmentId: string }>();
  const router = useRouter();
  const [type, setType] = useState<DisputeType>('not_delivered');
  const [desc, setDesc] = useState<string>('');

  const submit = () => {
    if (desc.trim().length < 10) {
      Alert.alert('Please describe the issue', 'Add at least 10 characters.');
      return;
    }
    console.log('[dispute] submit', { shipmentId, type, desc });
    Alert.alert('Dispute raised', 'Our team will review within 24 hours.', [
      { text: 'OK', onPress: () => router.back() },
    ]);
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ padding: 16 }}>
      <Stack.Screen options={{ title: 'Raise Dispute', headerStyle: { backgroundColor: Colors.primary }, headerTintColor: Colors.textInverse }} />
      <View style={styles.banner}>
        <AlertTriangle size={20} color={Colors.warning} />
        <Text style={styles.bannerText}>Disputes can be raised after pickup or within 48h of delivery.</Text>
      </View>
      <Text style={styles.label}>Reason</Text>
      <View style={styles.chips}>
        {TYPES.map((t) => (
          <TouchableOpacity
            key={t.id}
            style={[styles.chip, type === t.id && styles.chipActive]}
            onPress={() => setType(t.id)}
            testID={`dispute-type-${t.id}`}
          >
            <Text style={[styles.chipText, type === t.id && styles.chipTextActive]}>{t.label}</Text>
          </TouchableOpacity>
        ))}
      </View>
      <Text style={styles.label}>Describe what happened</Text>
      <TextInput
        style={styles.input}
        value={desc}
        onChangeText={setDesc}
        multiline
        placeholder="Details, timeline, evidence..."
        placeholderTextColor={Colors.textTertiary}
        testID="dispute-desc"
      />
      <TouchableOpacity style={styles.submit} onPress={submit} testID="dispute-submit">
        <Text style={styles.submitText}>Submit Dispute</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  banner: { flexDirection: 'row', gap: 10, backgroundColor: Colors.warningLight, padding: 12, borderRadius: 12, marginBottom: 16, alignItems: 'center' },
  bannerText: { flex: 1, color: Colors.text, fontSize: 13 },
  label: { fontSize: 14, fontWeight: '600', color: Colors.text, marginBottom: 8, marginTop: 8 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 8 },
  chip: { paddingVertical: 8, paddingHorizontal: 14, backgroundColor: Colors.surface, borderRadius: 999, borderWidth: 1, borderColor: Colors.border },
  chipActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  chipText: { color: Colors.textSecondary, fontSize: 13, fontWeight: '500' },
  chipTextActive: { color: Colors.textInverse },
  input: { backgroundColor: Colors.surface, borderRadius: 12, padding: 14, borderWidth: 1, borderColor: Colors.border, minHeight: 140, textAlignVertical: 'top', color: Colors.text },
  submit: { backgroundColor: Colors.primary, borderRadius: 12, padding: 16, alignItems: 'center', marginTop: 24 },
  submitText: { color: Colors.textInverse, fontWeight: '700', fontSize: 16 },
});
