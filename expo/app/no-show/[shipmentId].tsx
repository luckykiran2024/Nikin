import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, ScrollView } from 'react-native';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { AlertOctagon, RefreshCw } from 'lucide-react-native';
import Colors from '@/constants/colors';

export default function NoShowScreen() {
  const { shipmentId } = useLocalSearchParams<{ shipmentId: string }>();
  const router = useRouter();
  const [submitting, setSubmitting] = useState<boolean>(false);

  const act = (action: 'no_show' | 'reassign') => {
    setSubmitting(true);
    console.log('[no-show]', { shipmentId, action });
    setTimeout(() => {
      setSubmitting(false);
      Alert.alert(
        action === 'no_show' ? 'Marked as No-Show' : 'Reassignment Requested',
        action === 'no_show'
          ? 'The traveler has been flagged. You may request reassignment.'
          : 'We are finding a new traveler for your shipment.',
        [{ text: 'OK', onPress: () => router.back() }],
      );
    }, 600);
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ padding: 20 }}>
      <Stack.Screen options={{ title: 'No-Show / Delay', headerStyle: { backgroundColor: Colors.primary }, headerTintColor: Colors.textInverse }} />

      <View style={styles.warnBox}>
        <AlertOctagon size={24} color={Colors.warning} />
        <Text style={styles.warnText}>Use this only if the traveler is significantly late or unreachable beyond the pickup window.</Text>
      </View>

      <TouchableOpacity style={[styles.btn, styles.btnDanger]} onPress={() => act('no_show')} disabled={submitting} testID="mark-no-show">
        <AlertOctagon size={20} color={Colors.textInverse} />
        <Text style={styles.btnText}>Mark as No-Show</Text>
      </TouchableOpacity>

      <TouchableOpacity style={[styles.btn, styles.btnPrimary]} onPress={() => act('reassign')} disabled={submitting} testID="request-reassign">
        <RefreshCw size={20} color={Colors.textInverse} />
        <Text style={styles.btnText}>Request Reassignment</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  warnBox: { flexDirection: 'row', gap: 12, backgroundColor: Colors.warningLight, padding: 14, borderRadius: 12, marginBottom: 20 },
  warnText: { flex: 1, color: Colors.text, fontSize: 13 },
  btn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, padding: 16, borderRadius: 12, marginBottom: 12 },
  btnDanger: { backgroundColor: Colors.error },
  btnPrimary: { backgroundColor: Colors.primary },
  btnText: { color: Colors.textInverse, fontWeight: '700', fontSize: 16 },
});
