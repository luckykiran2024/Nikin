import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, Alert } from 'react-native';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { Star } from 'lucide-react-native';
import Colors from '@/constants/colors';

export default function ReviewScreen() {
  const { shipmentId } = useLocalSearchParams<{ shipmentId: string }>();
  const router = useRouter();
  const [rating, setRating] = useState<number>(5);
  const [comment, setComment] = useState<string>('');

  const submit = () => {
    console.log('[review] submit', { shipmentId, rating, comment });
    Alert.alert('Thanks!', 'Your review has been submitted.', [
      { text: 'OK', onPress: () => router.back() },
    ]);
  };

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ title: 'Rate & Review', headerStyle: { backgroundColor: Colors.primary }, headerTintColor: Colors.textInverse }} />
      <Text style={styles.heading}>How was your experience?</Text>
      <View style={styles.stars}>
        {[1, 2, 3, 4, 5].map((n) => (
          <TouchableOpacity key={n} onPress={() => setRating(n)} testID={`star-${n}`}>
            <Star size={40} color={Colors.accent} fill={n <= rating ? Colors.accent : 'transparent'} />
          </TouchableOpacity>
        ))}
      </View>
      <TextInput
        style={styles.input}
        multiline
        placeholder="Share a few words..."
        placeholderTextColor={Colors.textTertiary}
        value={comment}
        onChangeText={setComment}
        testID="review-comment"
      />
      <TouchableOpacity style={styles.submit} onPress={submit} testID="review-submit">
        <Text style={styles.submitText}>Submit Review</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background, padding: 20 },
  heading: { fontSize: 20, fontWeight: '700', color: Colors.text, marginTop: 12, marginBottom: 20, textAlign: 'center' },
  stars: { flexDirection: 'row', justifyContent: 'center', gap: 8, marginBottom: 24 },
  input: { backgroundColor: Colors.surface, borderRadius: 12, padding: 14, borderWidth: 1, borderColor: Colors.border, minHeight: 120, textAlignVertical: 'top', color: Colors.text },
  submit: { backgroundColor: Colors.primary, borderRadius: 12, padding: 16, alignItems: 'center', marginTop: 24 },
  submitText: { color: Colors.textInverse, fontWeight: '700', fontSize: 16 },
});
