import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { Stack, useLocalSearchParams } from 'expo-router';
import Colors from '@/constants/colors';
import { LEGAL_DOCS, LegalDocId } from '@/constants/legal';

export default function LegalDocScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const doc = LEGAL_DOCS[id as LegalDocId];

  if (!doc) {
    return (
      <View style={styles.container}>
        <Stack.Screen options={{ title: 'Not Found' }} />
        <Text style={styles.notFound}>This document could not be found.</Text>
      </View>
    );
  }

  return (
    <View style={styles.container} testID={`legal-doc-${doc.id}`}>
      <Stack.Screen
        options={{
          title: doc.title,
          headerStyle: { backgroundColor: Colors.primary },
          headerTintColor: Colors.textInverse,
        }}
      />
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.title}>{doc.title}</Text>
        <Text style={styles.subtitle}>{doc.subtitle}</Text>
        <View style={styles.divider} />

        {doc.sections.map((s, i) => (
          <View key={`${doc.id}-${i}`} style={styles.section}>
            <Text style={styles.heading}>{s.heading}</Text>
            <Text style={styles.body}>{s.body}</Text>
          </View>
        ))}

        <Text style={styles.footer}>
          This document is provided for clarity and is subject to our full Terms of Service.
        </Text>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  scroll: { flex: 1 },
  content: { padding: 20, paddingBottom: 48 },
  title: {
    fontSize: 26,
    fontWeight: '800' as const,
    color: Colors.text,
    letterSpacing: -0.4,
  },
  subtitle: {
    fontSize: 13,
    color: Colors.textSecondary,
    marginTop: 6,
  },
  divider: {
    height: 1,
    backgroundColor: Colors.border,
    marginVertical: 20,
  },
  section: { marginBottom: 20 },
  heading: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: Colors.text,
    marginBottom: 8,
  },
  body: {
    fontSize: 14,
    color: Colors.textSecondary,
    lineHeight: 22,
  },
  footer: {
    fontSize: 12,
    color: Colors.textTertiary,
    textAlign: 'center',
    marginTop: 16,
  },
  notFound: {
    padding: 24,
    color: Colors.textSecondary,
    textAlign: 'center',
  },
});
