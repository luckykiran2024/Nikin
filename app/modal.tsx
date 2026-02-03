import { StatusBar } from 'expo-status-bar';
import { Platform, StyleSheet, View, Text, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { X, HelpCircle, MessageCircle, Phone } from 'lucide-react-native';
import Colors from '@/constants/colors';

export default function HelpModal() {
  const router = useRouter();

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Help & Support</Text>
        <TouchableOpacity style={styles.closeButton} onPress={() => router.back()}>
          <X size={24} color={Colors.text} />
        </TouchableOpacity>
      </View>

      <View style={styles.content}>
        <TouchableOpacity style={styles.option}>
          <View style={[styles.iconContainer, { backgroundColor: Colors.primaryLight + '20' }]}>
            <HelpCircle size={24} color={Colors.primary} />
          </View>
          <View style={styles.optionText}>
            <Text style={styles.optionTitle}>FAQs</Text>
            <Text style={styles.optionSubtitle}>Find answers to common questions</Text>
          </View>
        </TouchableOpacity>

        <TouchableOpacity style={styles.option}>
          <View style={[styles.iconContainer, { backgroundColor: Colors.successLight }]}>
            <MessageCircle size={24} color={Colors.success} />
          </View>
          <View style={styles.optionText}>
            <Text style={styles.optionTitle}>Chat Support</Text>
            <Text style={styles.optionSubtitle}>Talk to our support team</Text>
          </View>
        </TouchableOpacity>

        <TouchableOpacity style={styles.option}>
          <View style={[styles.iconContainer, { backgroundColor: Colors.warningLight }]}>
            <Phone size={24} color={Colors.warning} />
          </View>
          <View style={styles.optionText}>
            <Text style={styles.optionTitle}>Call Us</Text>
            <Text style={styles.optionSubtitle}>+91 1800-XXX-XXXX</Text>
          </View>
        </TouchableOpacity>
      </View>

      <StatusBar style={Platform.OS === 'ios' ? 'light' : 'auto'} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  title: {
    fontSize: 20,
    fontWeight: '600' as const,
    color: Colors.text,
  },
  closeButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.surfaceSecondary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    padding: 20,
  },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    gap: 14,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  optionText: {
    flex: 1,
  },
  optionTitle: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: Colors.text,
  },
  optionSubtitle: {
    fontSize: 13,
    color: Colors.textSecondary,
    marginTop: 2,
  },
});
