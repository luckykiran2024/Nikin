import React from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity } from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { Bell, Package, Wallet, ShieldCheck, MessageSquare } from 'lucide-react-native';
import Colors from '@/constants/colors';
import type { Notification, NotificationType } from '@/types';

const MOCK: Notification[] = [
  { id: '1', userId: 'u1', title: 'Quote accepted', message: 'Your quote for DEL → BLR was accepted.', type: 'quote', read: false, createdAt: new Date().toISOString() },
  { id: '2', userId: 'u1', title: 'Payment held in escrow', message: '₹450 is held safely.', type: 'payment', read: false, createdAt: new Date().toISOString() },
  { id: '3', userId: 'u1', title: 'KYC approved', message: 'You can now accept trips.', type: 'kyc', read: true, createdAt: new Date().toISOString() },
];

const iconFor = (t: NotificationType) => {
  if (t === 'payment') return Wallet;
  if (t === 'kyc') return ShieldCheck;
  if (t === 'chat') return MessageSquare;
  if (t === 'shipment' || t === 'tracking' || t === 'quote') return Package;
  return Bell;
};

export default function NotificationsScreen() {
  const router = useRouter();
  return (
    <View style={styles.container} testID="notifications-screen">
      <Stack.Screen options={{ title: 'Notifications', headerStyle: { backgroundColor: Colors.primary }, headerTintColor: Colors.textInverse }} />
      <FlatList
        data={MOCK}
        keyExtractor={(i) => i.id}
        contentContainerStyle={{ padding: 16 }}
        ItemSeparatorComponent={() => <View style={{ height: 10 }} />}
        ListEmptyComponent={<Text style={styles.empty}>No notifications yet</Text>}
        renderItem={({ item }) => {
          const Icon = iconFor(item.type);
          return (
            <TouchableOpacity
              style={[styles.row, !item.read && styles.rowUnread]}
              onPress={() => item.actionUrl && router.push(item.actionUrl as any)}
              testID={`notif-${item.id}`}
            >
              <View style={styles.iconWrap}>
                <Icon size={20} color={Colors.primary} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.title}>{item.title}</Text>
                <Text style={styles.msg}>{item.message}</Text>
              </View>
              {!item.read && <View style={styles.dot} />}
            </TouchableOpacity>
          );
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  row: { flexDirection: 'row', backgroundColor: Colors.surface, padding: 14, borderRadius: 14, alignItems: 'center', gap: 12, borderWidth: 1, borderColor: Colors.borderLight },
  rowUnread: { borderColor: Colors.primaryLight, backgroundColor: '#FFF8F4' },
  iconWrap: { width: 40, height: 40, borderRadius: 20, backgroundColor: Colors.primaryLight, alignItems: 'center', justifyContent: 'center' },
  title: { fontSize: 15, fontWeight: '600', color: Colors.text, marginBottom: 2 },
  msg: { fontSize: 13, color: Colors.textSecondary },
  dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: Colors.primary },
  empty: { textAlign: 'center', color: Colors.textTertiary, marginTop: 60 },
});
