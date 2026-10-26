import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Stack, useRouter } from 'expo-router';
import Colors from '@/constants/colors';

export default function KYCUnavailableScreen() {
  const router = useRouter();
  return (
    <View style={styles.container}>
      <Stack.Screen options={{ title: 'Identity verification' }} />
      <Text style={styles.title}>Identity verification is temporarily unavailable</Text>
      <Text style={styles.body}>
        We are setting up secure document capture and verified checks. Please try again later.
      </Text>
      <TouchableOpacity style={styles.button} onPress={() => router.replace('/(tabs)/profile')}>
        <Text style={styles.buttonText}>Back to profile</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', padding: 24, backgroundColor: Colors.background },
  title: { color: Colors.text, fontSize: 24, fontWeight: '700', marginBottom: 12 },
  body: { color: Colors.textSecondary, fontSize: 16, lineHeight: 24, marginBottom: 24 },
  button: { backgroundColor: Colors.primary, padding: 16, borderRadius: 12, alignItems: 'center' },
  buttonText: { color: Colors.textInverse, fontWeight: '700' },
});
