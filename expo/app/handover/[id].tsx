import React, { useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Image,
  TextInput,
  Platform,
  ActivityIndicator,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import * as Haptics from 'expo-haptics';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import {
  ShieldCheck,
  Key,
  Camera,
  X,
  User,
  Phone,
  Package,
  MapPin,
  CheckCircle2,
  AlertTriangle,
  Copy,
  MessageCircle,
  Lock,
  FileText,
  ChevronRight,
} from 'lucide-react-native';
import * as Clipboard from 'expo-clipboard';
import Colors from '@/constants/colors';
import { useAuth } from '@/contexts/AuthContext';
import { useDataStore } from '@/contexts/DataStoreContext';

export default function HandoverScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const shipmentId = id ?? '';
  const router = useRouter();
  const { user } = useAuth();
  const {
    getShipmentById,
    verifyPickupOTP,
    updateShipment,
  } = useDataStore();

  const shipment = getShipmentById(shipmentId);
  const isSender = user?.id === shipment?.senderId;
  const isTraveler = user?.id === shipment?.assignedTravelerId;

  const [pickupImages, setPickupImages] = useState<string[]>([]);
  const [otp, setOtp] = useState<string>('');
  const [verifying, setVerifying] = useState<boolean>(false);
  const [checklist, setChecklist] = useState<{ sealed: boolean; match: boolean; consent: boolean }>({
    sealed: false,
    match: false,
    consent: false,
  });

  const steps = useMemo(() => {
    const otpReady = !!shipment?.pickupOtp;
    const photoTaken = isTraveler ? pickupImages.length > 0 : !!shipment?.travelerParcelImage;
    const verified = !!shipment?.pickupOtpVerified;
    return [
      { key: 'meet', label: 'Meet & verify ID', done: true },
      { key: 'photo', label: 'Capture parcel photo', done: photoTaken },
      { key: 'otp', label: 'OTP handshake', done: otpReady },
      { key: 'confirm', label: 'Confirm handover', done: verified },
    ];
  }, [shipment, pickupImages, isTraveler]);

  if (!shipment) {
    return (
      <View style={styles.container}>
        <Stack.Screen options={{ title: 'Handover' }} />
        <View style={styles.center}>
          <Package size={56} color={Colors.textTertiary} />
          <Text style={styles.emptyText}>Shipment not found</Text>
        </View>
      </View>
    );
  }

  const canHandover =
    shipment.status === 'confirmed' ||
    shipment.status === 'assigned' ||
    shipment.status === 'payment_pending';

  const handleCopyOTP = async () => {
    if (!shipment.pickupOtp) return;
    try {
      await Clipboard.setStringAsync(shipment.pickupOtp);
      if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      Alert.alert('Copied', 'Pickup OTP copied to clipboard.');
    } catch {}
  };

  const pickImage = async () => {
    const perm = await ImagePicker.requestCameraPermissionsAsync();
    if (perm.granted === false) {
      Alert.alert('Permission Required', 'Camera access is needed to capture parcel photos.');
      return;
    }
    Alert.alert('Parcel Photo', 'Take a clear photo of the parcel at handover.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Camera',
        onPress: async () => {
          const result = await ImagePicker.launchCameraAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            quality: 0.8,
            allowsEditing: true,
            aspect: [4, 3],
          });
          if (!result.canceled && result.assets[0]) {
            setPickupImages((prev) => [...prev, result.assets[0].uri]);
          }
        },
      },
      {
        text: 'Gallery',
        onPress: async () => {
          const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            quality: 0.8,
            allowsEditing: true,
            aspect: [4, 3],
          });
          if (!result.canceled && result.assets[0]) {
            setPickupImages((prev) => [...prev, result.assets[0].uri]);
          }
        },
      },
    ]);
  };

  const handleVerify = async () => {
    if (!checklist.sealed || !checklist.match || !checklist.consent) {
      Alert.alert('Complete Checklist', 'Please confirm all safety checks before proceeding.');
      return;
    }
    if (pickupImages.length === 0) {
      Alert.alert('Photo Required', 'Please capture at least one parcel photo.');
      return;
    }
    if (otp.length !== 4) {
      Alert.alert('Invalid OTP', 'Enter the 4-digit OTP shared by the sender.');
      return;
    }
    setVerifying(true);
    try {
      await updateShipment(shipment.id, { pickupImages });
      const ok = await verifyPickupOTP(shipment.id, otp);
      if (ok) {
        if (Platform.OS !== 'web') Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        Alert.alert('Handover Complete', 'Pickup verified. You can start transit now.', [
          { text: 'OK', onPress: () => router.replace(`/shipment/${shipment.id}` as any) },
        ]);
      } else {
        if (Platform.OS !== 'web') Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        Alert.alert('Invalid OTP', 'The OTP you entered is incorrect. Please try again.');
      }
    } catch (e: any) {
      Alert.alert('Error', e?.message || 'Failed to verify handover');
    } finally {
      setVerifying(false);
    }
  };

  const removeImage = (index: number) => {
    setPickupImages((prev) => prev.filter((_, i) => i !== index));
  };

  const counterparty = isSender
    ? { name: shipment.assignedTravelerName || 'Traveler', phone: shipment.assignedTravelerPhone }
    : { name: shipment.senderName, phone: shipment.senderPhone };

  return (
    <View style={styles.container}>
      <Stack.Screen
        options={{
          title: 'Secure Handover',
          headerStyle: { backgroundColor: Colors.primary },
          headerTintColor: Colors.textInverse,
        }}
      />
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.heroCard}>
          <View style={styles.heroIconWrap}>
            <ShieldCheck size={22} color={Colors.textInverse} />
          </View>
          <Text style={styles.heroTitle}>Secure Handover</Text>
          <Text style={styles.heroSubtitle}>
            {isTraveler
              ? 'Verify the parcel and OTP in person with the sender.'
              : isSender
              ? 'Share the OTP only after you verify the traveler’s identity.'
              : 'Tracking the in-person handover between sender and traveler.'}
          </Text>

          <View style={styles.stepper}>
            {steps.map((s, i) => (
              <React.Fragment key={s.key}>
                <View style={styles.stepItem}>
                  <View style={[styles.stepDot, s.done && styles.stepDotDone]}>
                    {s.done ? (
                      <CheckCircle2 size={14} color={Colors.textInverse} />
                    ) : (
                      <Text style={styles.stepNum}>{i + 1}</Text>
                    )}
                  </View>
                  <Text style={[styles.stepLabel, s.done && styles.stepLabelDone]} numberOfLines={2}>
                    {s.label}
                  </Text>
                </View>
                {i < steps.length - 1 && <View style={[styles.stepLine, s.done && styles.stepLineDone]} />}
              </React.Fragment>
            ))}
          </View>
        </View>

        <View style={styles.parcelCard}>
          <View style={styles.rowBetween}>
            <View style={styles.parcelIdPill}>
              <Text style={styles.parcelIdText}>{shipment.parcelRequestId}</Text>
            </View>
            <TouchableOpacity
              style={styles.chatBtn}
              onPress={() => {
                if (shipment.chatId) router.push(`/chat/${shipment.chatId}` as any);
              }}
              disabled={!shipment.chatId}
            >
              <MessageCircle size={14} color={Colors.primary} />
              <Text style={styles.chatBtnText}>Chat</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.routeRow}>
            <MapPin size={14} color={Colors.primary} />
            <Text style={styles.routeText} numberOfLines={1}>
              {shipment.pickupCity} → {shipment.destinationCity}
            </Text>
          </View>

          <View style={styles.counterparty}>
            <View style={styles.avatar}>
              <User size={22} color={Colors.textInverse} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.counterpartyLabel}>
                {isSender ? 'Your traveler' : 'Your sender'}
              </Text>
              <Text style={styles.counterpartyName}>{counterparty.name}</Text>
              {counterparty.phone && (
                <View style={styles.phoneRow}>
                  <Phone size={12} color={Colors.textSecondary} />
                  <Text style={styles.phoneText}>{counterparty.phone}</Text>
                </View>
              )}
            </View>
            <View style={styles.kycBadge}>
              <Lock size={12} color={Colors.success} />
              <Text style={styles.kycBadgeText}>KYC</Text>
            </View>
          </View>

          <View style={styles.parcelMeta}>
            <View style={styles.parcelMetaItem}>
              <Text style={styles.metaLabel}>Weight</Text>
              <Text style={styles.metaValue}>{shipment.parcelDetails.weight} kg</Text>
            </View>
            <View style={styles.parcelMetaDivider} />
            <View style={styles.parcelMetaItem}>
              <Text style={styles.metaLabel}>Category</Text>
              <Text style={styles.metaValue} numberOfLines={1}>{shipment.parcelDetails.category}</Text>
            </View>
            <View style={styles.parcelMetaDivider} />
            <View style={styles.parcelMetaItem}>
              <Text style={styles.metaLabel}>Value</Text>
              <Text style={styles.metaValue}>₹{shipment.parcelDetails.estimatedValue}</Text>
            </View>
          </View>
        </View>

        {!canHandover && (
          <View style={styles.warnCard}>
            <AlertTriangle size={18} color={Colors.warning} />
            <Text style={styles.warnText}>
              Handover is not available in “{shipment.status}”. Complete payment and pickup details first.
            </Text>
          </View>
        )}

        {isSender && shipment.pickupOtp && (
          <View style={styles.otpCardSender}>
            <View style={styles.otpHeader}>
              <Key size={18} color={Colors.warning} />
              <Text style={styles.otpTitle}>Pickup OTP</Text>
              <View style={styles.liveDot} />
              <Text style={styles.liveText}>Private</Text>
            </View>
            <View style={styles.otpRow}>
              {shipment.pickupOtp.split('').map((d, i) => (
                <View key={i} style={styles.otpDigit}>
                  <Text style={styles.otpDigitText}>{d}</Text>
                </View>
              ))}
            </View>
            <TouchableOpacity style={styles.copyBtn} onPress={handleCopyOTP} testID="copy-pickup-otp">
              <Copy size={14} color={Colors.primary} />
              <Text style={styles.copyBtnText}>Copy OTP</Text>
            </TouchableOpacity>
            <Text style={styles.otpHint}>
              Share this OTP with the traveler only after verifying their identity in person.
            </Text>
          </View>
        )}

        {isTraveler && canHandover && !shipment.pickupOtpVerified && (
          <>
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Safety checklist</Text>
              <CheckItem
                label="Parcel is sealed & undamaged"
                checked={checklist.sealed}
                onToggle={() => setChecklist((c) => ({ ...c, sealed: !c.sealed }))}
              />
              <CheckItem
                label="Sender’s ID matches KYC name"
                checked={checklist.match}
                onToggle={() => setChecklist((c) => ({ ...c, match: !c.match }))}
              />
              <CheckItem
                label="I agree to carry no prohibited items"
                checked={checklist.consent}
                onToggle={() => setChecklist((c) => ({ ...c, consent: !c.consent }))}
              />
            </View>

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Parcel photos</Text>
              <Text style={styles.sectionHint}>Capture at least one clear photo as proof.</Text>
              {pickupImages.length > 0 && (
                <View style={styles.imageGrid}>
                  {pickupImages.map((uri, idx) => (
                    <View key={`${uri}-${idx}`} style={styles.thumbWrap}>
                      <Image source={{ uri }} style={styles.thumb} />
                      <TouchableOpacity style={styles.removeBtn} onPress={() => removeImage(idx)}>
                        <X size={12} color={Colors.textInverse} />
                      </TouchableOpacity>
                    </View>
                  ))}
                </View>
              )}
              <TouchableOpacity style={styles.captureBtn} onPress={pickImage} testID="capture-parcel">
                <Camera size={18} color={Colors.textInverse} />
                <Text style={styles.captureText}>
                  {pickupImages.length > 0 ? 'Add another photo' : 'Capture parcel photo'}
                </Text>
              </TouchableOpacity>
            </View>

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Enter pickup OTP</Text>
              <Text style={styles.sectionHint}>Ask the sender to share their 4-digit OTP.</Text>
              <TextInput
                style={styles.otpInput}
                value={otp}
                onChangeText={(t) => setOtp(t.replace(/[^0-9]/g, '').slice(0, 4))}
                keyboardType="number-pad"
                placeholder="••••"
                placeholderTextColor={Colors.textTertiary}
                maxLength={4}
                testID="handover-otp-input"
              />
            </View>

            <TouchableOpacity
              style={[styles.confirmBtn, verifying && styles.confirmBtnDisabled]}
              onPress={handleVerify}
              disabled={verifying}
              testID="confirm-handover"
            >
              {verifying ? (
                <ActivityIndicator color={Colors.textInverse} />
              ) : (
                <>
                  <ShieldCheck size={20} color={Colors.textInverse} />
                  <Text style={styles.confirmBtnText}>Confirm Handover</Text>
                </>
              )}
            </TouchableOpacity>
          </>
        )}

        {shipment.pickupOtpVerified && (
          <View style={styles.successCard}>
            <CheckCircle2 size={28} color={Colors.success} />
            <Text style={styles.successTitle}>Handover complete</Text>
            <Text style={styles.successText}>
              Pickup verified on{' '}
              {new Date(shipment.updatedAt).toLocaleString()}
            </Text>
            <TouchableOpacity
              style={styles.successBtn}
              onPress={() => router.replace(`/shipment/${shipment.id}` as any)}
            >
              <Text style={styles.successBtnText}>Back to shipment</Text>
              <ChevronRight size={16} color={Colors.textInverse} />
            </TouchableOpacity>
          </View>
        )}

        <View style={styles.tipsCard}>
          <View style={styles.tipsHeader}>
            <FileText size={16} color={Colors.info} />
            <Text style={styles.tipsTitle}>Handover best practices</Text>
          </View>
          <Tip text="Meet in a public, well-lit location." />
          <Tip text="Never share OTP before meeting in person." />
          <Tip text="Photograph the parcel clearly from multiple angles." />
          <Tip text="Report any suspicious behaviour from support." />
        </View>
      </ScrollView>
    </View>
  );
}

function CheckItem({ label, checked, onToggle }: { label: string; checked: boolean; onToggle: () => void }) {
  return (
    <TouchableOpacity style={styles.checkItem} onPress={onToggle} activeOpacity={0.7}>
      <View style={[styles.checkbox, checked && styles.checkboxChecked]}>
        {checked && <CheckCircle2 size={14} color={Colors.textInverse} />}
      </View>
      <Text style={[styles.checkLabel, checked && styles.checkLabelDone]}>{label}</Text>
    </TouchableOpacity>
  );
}

function Tip({ text }: { text: string }) {
  return (
    <View style={styles.tipRow}>
      <View style={styles.tipDot} />
      <Text style={styles.tipText}>{text}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  content: { padding: 20, paddingBottom: 60 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 40 },
  emptyText: { marginTop: 12, color: Colors.textSecondary, fontSize: 15 },
  heroCard: {
    backgroundColor: Colors.surfaceInk,
    borderRadius: 22,
    padding: 20,
    marginBottom: 16,
  },
  heroIconWrap: {
    width: 44, height: 44, borderRadius: 14,
    backgroundColor: Colors.primary, alignItems: 'center', justifyContent: 'center', marginBottom: 12,
  },
  heroTitle: { color: Colors.textInverse, fontSize: 20, fontWeight: '800' as const },
  heroSubtitle: { color: 'rgba(255,255,255,0.72)', fontSize: 13, lineHeight: 19, marginTop: 6, marginBottom: 18 },
  stepper: { flexDirection: 'row', alignItems: 'flex-start' },
  stepItem: { alignItems: 'center', width: 64 },
  stepDot: {
    width: 28, height: 28, borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.1)', alignItems: 'center', justifyContent: 'center',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.2)',
  },
  stepDotDone: { backgroundColor: Colors.success, borderColor: Colors.success },
  stepNum: { color: Colors.textInverse, fontWeight: '700' as const, fontSize: 12 },
  stepLabel: { color: 'rgba(255,255,255,0.55)', fontSize: 10, marginTop: 6, textAlign: 'center' },
  stepLabelDone: { color: Colors.textInverse },
  stepLine: { flex: 1, height: 1, backgroundColor: 'rgba(255,255,255,0.15)', marginTop: 14, marginHorizontal: 2 },
  stepLineDone: { backgroundColor: Colors.success },
  parcelCard: {
    backgroundColor: Colors.surface, borderRadius: 18, padding: 16, marginBottom: 16,
    shadowColor: Colors.shadow, shadowOffset: { width: 0, height: 2 }, shadowOpacity: 1, shadowRadius: 8, elevation: 2,
  },
  rowBetween: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  parcelIdPill: {
    backgroundColor: Colors.primary, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8, alignSelf: 'flex-start',
  },
  parcelIdText: { color: Colors.textInverse, fontWeight: '700' as const, fontSize: 11, letterSpacing: 0.5 },
  chatBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8, backgroundColor: Colors.primaryLight + '30',
  },
  chatBtnText: { color: Colors.primary, fontWeight: '600' as const, fontSize: 12 },
  routeRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 12 },
  routeText: { fontSize: 14, fontWeight: '600' as const, color: Colors.text },
  counterparty: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    backgroundColor: Colors.surfaceSecondary, borderRadius: 14, padding: 12,
  },
  avatar: {
    width: 44, height: 44, borderRadius: 22, backgroundColor: Colors.primary,
    alignItems: 'center', justifyContent: 'center',
  },
  counterpartyLabel: { fontSize: 11, color: Colors.textTertiary, textTransform: 'uppercase' as const, letterSpacing: 0.5 },
  counterpartyName: { fontSize: 15, fontWeight: '700' as const, color: Colors.text, marginTop: 2 },
  phoneRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 2 },
  phoneText: { fontSize: 12, color: Colors.textSecondary },
  kycBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 3,
    backgroundColor: Colors.successLight, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8,
  },
  kycBadgeText: { fontSize: 10, fontWeight: '700' as const, color: Colors.success, letterSpacing: 0.5 },
  parcelMeta: {
    flexDirection: 'row', marginTop: 12, backgroundColor: Colors.surfaceSecondary,
    borderRadius: 12, paddingVertical: 10,
  },
  parcelMetaItem: { flex: 1, alignItems: 'center' },
  parcelMetaDivider: { width: 1, backgroundColor: Colors.border, marginVertical: 4 },
  metaLabel: { fontSize: 10, color: Colors.textTertiary, textTransform: 'uppercase' as const },
  metaValue: { fontSize: 13, fontWeight: '700' as const, color: Colors.text, marginTop: 2 },
  warnCard: {
    flexDirection: 'row', alignItems: 'center', gap: 10, padding: 14,
    backgroundColor: Colors.warningLight, borderRadius: 12, marginBottom: 16,
  },
  warnText: { flex: 1, fontSize: 13, color: Colors.warning, fontWeight: '500' as const },
  otpCardSender: {
    backgroundColor: Colors.surface, borderRadius: 18, padding: 18, marginBottom: 16,
    borderWidth: 2, borderColor: Colors.warning,
  },
  otpHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 14 },
  otpTitle: { fontSize: 16, fontWeight: '700' as const, color: Colors.text, flex: 1 },
  liveDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: Colors.warning },
  liveText: { fontSize: 11, color: Colors.warning, fontWeight: '600' as const },
  otpRow: { flexDirection: 'row', justifyContent: 'center', gap: 10, marginBottom: 14 },
  otpDigit: {
    width: 56, height: 64, borderRadius: 14, backgroundColor: Colors.warningLight,
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 2, borderColor: Colors.warning,
  },
  otpDigitText: { fontSize: 28, fontWeight: '800' as const, color: Colors.warning },
  copyBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6,
    paddingVertical: 10, borderRadius: 10, backgroundColor: Colors.primaryLight + '30',
  },
  copyBtnText: { color: Colors.primary, fontWeight: '700' as const, fontSize: 13 },
  otpHint: { fontSize: 12, color: Colors.textSecondary, textAlign: 'center', marginTop: 10, lineHeight: 17 },
  section: {
    backgroundColor: Colors.surface, borderRadius: 16, padding: 16, marginBottom: 14,
  },
  sectionTitle: { fontSize: 15, fontWeight: '700' as const, color: Colors.text, marginBottom: 4 },
  sectionHint: { fontSize: 12, color: Colors.textSecondary, marginBottom: 12 },
  checkItem: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    paddingVertical: 10,
  },
  checkbox: {
    width: 22, height: 22, borderRadius: 6, borderWidth: 2, borderColor: Colors.border,
    alignItems: 'center', justifyContent: 'center',
  },
  checkboxChecked: { backgroundColor: Colors.success, borderColor: Colors.success },
  checkLabel: { flex: 1, fontSize: 14, color: Colors.text },
  checkLabelDone: { color: Colors.textSecondary },
  imageGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 12 },
  thumbWrap: { position: 'relative' },
  thumb: { width: 80, height: 80, borderRadius: 10 },
  removeBtn: {
    position: 'absolute', top: -6, right: -6, width: 22, height: 22, borderRadius: 11,
    backgroundColor: Colors.error, alignItems: 'center', justifyContent: 'center',
  },
  captureBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    backgroundColor: Colors.primary, paddingVertical: 14, borderRadius: 12,
  },
  captureText: { color: Colors.textInverse, fontWeight: '700' as const, fontSize: 14 },
  otpInput: {
    height: 64, borderRadius: 14, borderWidth: 2, borderColor: Colors.border,
    backgroundColor: Colors.surfaceSecondary, textAlign: 'center',
    fontSize: 28, fontWeight: '800' as const, letterSpacing: 16, color: Colors.text,
  },
  confirmBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10,
    backgroundColor: Colors.success, paddingVertical: 16, borderRadius: 14, marginBottom: 20,
  },
  confirmBtnDisabled: { opacity: 0.6 },
  confirmBtnText: { color: Colors.textInverse, fontWeight: '800' as const, fontSize: 16 },
  successCard: {
    backgroundColor: Colors.successLight, borderRadius: 16, padding: 20,
    alignItems: 'center', marginBottom: 16,
  },
  successTitle: { fontSize: 18, fontWeight: '800' as const, color: Colors.success, marginTop: 10 },
  successText: { fontSize: 13, color: Colors.success, marginTop: 4, textAlign: 'center' },
  successBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    marginTop: 14, backgroundColor: Colors.success,
    paddingHorizontal: 16, paddingVertical: 10, borderRadius: 10,
  },
  successBtnText: { color: Colors.textInverse, fontWeight: '700' as const },
  tipsCard: {
    backgroundColor: Colors.infoLight, borderRadius: 14, padding: 14,
  },
  tipsHeader: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 10 },
  tipsTitle: { fontSize: 14, fontWeight: '700' as const, color: Colors.info },
  tipRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 8, marginBottom: 6 },
  tipDot: { width: 5, height: 5, borderRadius: 3, backgroundColor: Colors.info, marginTop: 7 },
  tipText: { flex: 1, fontSize: 13, color: Colors.info, lineHeight: 18 },
});
