import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native';
import { useRouter, Stack } from 'expo-router';
import { MapPin, Calendar, ChevronDown } from 'lucide-react-native';
import Colors from '@/constants/colors';
import { cities } from '@/mocks/data';

export default function CreateRouteScreen() {
  const router = useRouter();
  const [fromCity, setFromCity] = useState('');
  const [toCity, setToCity] = useState('');
  const [travelDate, setTravelDate] = useState('');
  
  const [description, setDescription] = useState('');
  const [showFromCities, setShowFromCities] = useState(false);
  const [showToCities, setShowToCities] = useState(false);

  const handleSubmit = () => {
    if (!fromCity || !toCity || !travelDate) {
      Alert.alert('Missing Information', 'Please fill in all required fields');
      return;
    }
    Alert.alert(
      'Route Published',
      'Your travel route has been published. You will receive quotes for matching shipments!',
      [{ text: 'OK', onPress: () => router.back() }]
    );
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <Stack.Screen options={{ title: 'Add Travel Route' }} />
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.infoCard}>
          <Text style={styles.infoTitle}>Publish Your Journey</Text>
          <Text style={styles.infoText}>
            Share your travel plans and earn by carrying parcels along your route.
            Senders with matching routes will be able to request your service.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Route Details</Text>
          
          <Text style={styles.label}>From City *</Text>
          <TouchableOpacity
            style={styles.selectInput}
            onPress={() => setShowFromCities(!showFromCities)}
          >
            <MapPin size={20} color={Colors.primary} />
            <Text style={[styles.selectText, !fromCity && styles.placeholder]}>
              {fromCity || 'Select departure city'}
            </Text>
            <ChevronDown size={20} color={Colors.textTertiary} />
          </TouchableOpacity>
          {showFromCities && (
            <View style={styles.dropdown}>
              <ScrollView style={{ maxHeight: 200 }} nestedScrollEnabled>
                {cities.map((city) => (
                  <TouchableOpacity
                    key={city.id}
                    style={styles.dropdownItem}
                    onPress={() => {
                      setFromCity(city.name);
                      setShowFromCities(false);
                    }}
                  >
                    <Text style={styles.dropdownText}>{city.name}, {city.state}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          )}

          <Text style={styles.label}>To City *</Text>
          <TouchableOpacity
            style={styles.selectInput}
            onPress={() => setShowToCities(!showToCities)}
          >
            <MapPin size={20} color={Colors.success} />
            <Text style={[styles.selectText, !toCity && styles.placeholder]}>
              {toCity || 'Select destination city'}
            </Text>
            <ChevronDown size={20} color={Colors.textTertiary} />
          </TouchableOpacity>
          {showToCities && (
            <View style={styles.dropdown}>
              <ScrollView style={{ maxHeight: 200 }} nestedScrollEnabled>
                {cities.map((city) => (
                  <TouchableOpacity
                    key={city.id}
                    style={styles.dropdownItem}
                    onPress={() => {
                      setToCity(city.name);
                      setShowToCities(false);
                    }}
                  >
                    <Text style={styles.dropdownText}>{city.name}, {city.state}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          )}

          <Text style={styles.label}>Travel Date *</Text>
          <View style={styles.selectInput}>
            <Calendar size={20} color={Colors.primary} />
            <TextInput
              style={[styles.selectText, { flex: 1 }]}
              placeholder="YYYY-MM-DD"
              placeholderTextColor={Colors.textTertiary}
              value={travelDate}
              onChangeText={setTravelDate}
            />
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Additional Details</Text>
          
          <Text style={styles.label}>Description (Optional)</Text>
          <TextInput
            style={[styles.textInput, styles.textArea]}
            placeholder="Add details about your travel (e.g., mode of transport, timings)"
            placeholderTextColor={Colors.textTertiary}
            value={description}
            onChangeText={setDescription}
            multiline
            numberOfLines={3}
          />
        </View>

        <View style={styles.tipsCard}>
          <Text style={styles.tipsTitle}>Tips for Better Matches</Text>
          <Text style={styles.tipItem}>• Submit competitive quotes for shipments</Text>
          <Text style={styles.tipItem}>• Add clear descriptions about your travel mode</Text>
          <Text style={styles.tipItem}>• Publish routes 3-5 days in advance</Text>
        </View>

        <TouchableOpacity style={styles.submitButton} onPress={handleSubmit}>
          <Text style={styles.submitButtonText}>Publish Route</Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
  },
  infoCard: {
    backgroundColor: Colors.primaryLight + '20',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    borderLeftWidth: 4,
    borderLeftColor: Colors.primary,
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: Colors.primary,
    marginBottom: 8,
  },
  infoText: {
    fontSize: 14,
    color: Colors.primaryDark,
    lineHeight: 20,
  },
  section: {
    backgroundColor: Colors.surface,
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600' as const,
    color: Colors.text,
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '500' as const,
    color: Colors.textSecondary,
    marginBottom: 8,
  },
  textInput: {
    backgroundColor: Colors.surfaceSecondary,
    borderRadius: 12,
    padding: 14,
    fontSize: 16,
    color: Colors.text,
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: 16,
  },
  textArea: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  selectInput: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surfaceSecondary,
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: 16,
    gap: 10,
  },
  selectText: {
    flex: 1,
    fontSize: 16,
    color: Colors.text,
  },
  placeholder: {
    color: Colors.textTertiary,
  },
  dropdown: {
    backgroundColor: Colors.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.border,
    marginTop: -12,
    marginBottom: 16,
  },
  dropdownItem: {
    padding: 14,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  dropdownText: {
    fontSize: 15,
    color: Colors.text,
  },
  tipsCard: {
    backgroundColor: Colors.warningLight,
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
  },
  tipsTitle: {
    fontSize: 15,
    fontWeight: '600' as const,
    color: Colors.secondaryDark,
    marginBottom: 8,
  },
  tipItem: {
    fontSize: 14,
    color: Colors.secondaryDark,
    lineHeight: 22,
  },
  submitButton: {
    backgroundColor: Colors.success,
    borderRadius: 14,
    padding: 18,
    alignItems: 'center',
    marginTop: 8,
  },
  submitButtonText: {
    fontSize: 17,
    fontWeight: '600' as const,
    color: Colors.textInverse,
  },
});
