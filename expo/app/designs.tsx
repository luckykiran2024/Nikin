import React, { useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Stack, useRouter } from 'expo-router';
import { Image } from 'expo-image';
import {
  Package,
  Plane,
  Search,
  Bell,
  MapPin,
  ArrowRight,
  Star,
  Shield,
  Wallet,
  ChevronLeft,
  CheckCircle2,
  Clock,
  QrCode,
  MessageSquare,
  Send,
  Navigation,
  CreditCard,
  User,
  TrendingUp,
  Calendar,
  Users,
  FileText,
  AlertCircle,
  Camera,
  Fingerprint,
  Mail,
  Lock,
  ArrowUpRight,
  Sparkles,
  ShieldCheck,
  Banknote,
  ChevronRight,
  Circle,
} from 'lucide-react-native';
import Colors from '@/constants/colors';

const BRAND = {
  primary: Colors.primary,
  primaryDark: Colors.primaryDark,
  ink: Colors.secondary,
  cream: Colors.background,
  surface: Colors.surface,
  border: Colors.border,
  success: Colors.success,
  accent: Colors.accent,
};

const FRAME_W = 320;
const FRAME_H = 660;

const AVATARS = {
  a: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=200&q=80',
  b: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&q=80',
  c: 'https://images.unsplash.com/photo-1531123897727-8f129e1688ce?w=200&q=80',
  d: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=200&q=80',
  e: 'https://images.unsplash.com/photo-1502685104226-ee32379fefbe?w=200&q=80',
};

const HERO_BG =
  'https://images.unsplash.com/photo-1436491865332-7a61a109cc05?w=1200&q=80';
const MAP_BG =
  'https://images.unsplash.com/photo-1569336415962-a4bd9f69cd83?w=1200&q=80';

function StatusBar() {
  return (
    <View style={sb.bar}>
      <Text style={sb.time}>9:41</Text>
      <View style={sb.right}>
        <View style={sb.dots}>
          <Circle size={6} color={BRAND.ink} fill={BRAND.ink} />
          <Circle size={6} color={BRAND.ink} fill={BRAND.ink} />
          <Circle size={6} color={BRAND.ink} fill={BRAND.ink} />
          <Circle size={6} color={BRAND.ink} fill={BRAND.ink} />
        </View>
        <View style={sb.battery} />
      </View>
    </View>
  );
}

const sb = StyleSheet.create({
  bar: {
    height: 28,
    paddingHorizontal: 18,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  time: { fontSize: 12, fontWeight: '700', color: BRAND.ink },
  right: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  dots: { flexDirection: 'row', gap: 2 },
  battery: {
    width: 22,
    height: 10,
    borderWidth: 1.2,
    borderColor: BRAND.ink,
    borderRadius: 2,
    backgroundColor: BRAND.ink,
  },
});

type FrameProps = {
  title: string;
  subtitle: string;
  children: React.ReactNode;
  bg?: string;
};

function PhoneFrame({ title, subtitle, children, bg = BRAND.cream }: FrameProps) {
  return (
    <View style={styles.frameWrap}>
      <View style={styles.labelRow}>
        <View style={styles.labelDot} />
        <View style={{ flex: 1 }}>
          <Text style={styles.labelTitle}>{title}</Text>
          <Text style={styles.labelSub}>{subtitle}</Text>
        </View>
      </View>
      <View style={styles.phone}>
        <View style={styles.notch} />
        <View style={[styles.screen, { backgroundColor: bg }]}>
          <StatusBar />
          <View style={{ flex: 1 }}>{children}</View>
        </View>
      </View>
    </View>
  );
}

function Logo({ size = 14, light }: { size?: number; light?: boolean }) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
      <View
        style={{
          width: size + 8,
          height: size + 8,
          borderRadius: (size + 8) / 2,
          backgroundColor: BRAND.primary,
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Plane size={size - 2} color="#fff" strokeWidth={2.5} />
      </View>
      <Text
        style={{
          fontSize: size + 2,
          fontWeight: '800',
          color: light ? '#fff' : BRAND.ink,
          letterSpacing: -0.5,
        }}
      >
        Parcel<Text style={{ color: BRAND.primary }}>Peer</Text>
      </Text>
    </View>
  );
}

// ---------- SCREENS ----------

function SplashScreen() {
  return (
    <View style={{ flex: 1, backgroundColor: BRAND.ink }}>
      <Image
        source={HERO_BG}
        style={StyleSheet.absoluteFillObject}
        contentFit="cover"
        transition={0}
      />
      <View
        style={[
          StyleSheet.absoluteFillObject,
          { backgroundColor: 'rgba(11,27,43,0.72)' },
        ]}
      />
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 }}>
        <View
          style={{
            width: 80,
            height: 80,
            borderRadius: 24,
            backgroundColor: BRAND.primary,
            alignItems: 'center',
            justifyContent: 'center',
            shadowColor: BRAND.primary,
            shadowOpacity: 0.5,
            shadowRadius: 30,
            shadowOffset: { width: 0, height: 10 },
          }}
        >
          <Plane size={40} color="#fff" strokeWidth={2.5} />
        </View>
        <Text style={{ fontSize: 28, fontWeight: '800', color: '#fff', marginTop: 20, letterSpacing: -0.5 }}>
          Parcel<Text style={{ color: BRAND.primary }}>Peer</Text>
        </Text>
        <Text style={{ color: 'rgba(255,255,255,0.7)', marginTop: 8, textAlign: 'center', fontSize: 13 }}>
          Send anything with trusted travelers{'\n'}heading your way.
        </Text>
      </View>
      <View style={{ padding: 20, gap: 10 }}>
        <View
          style={{
            backgroundColor: BRAND.primary,
            paddingVertical: 14,
            borderRadius: 14,
            alignItems: 'center',
          }}
        >
          <Text style={{ color: '#fff', fontWeight: '700' }}>Get Started</Text>
        </View>
        <Text style={{ textAlign: 'center', color: 'rgba(255,255,255,0.7)', fontSize: 12 }}>
          Already have an account? <Text style={{ color: '#fff', fontWeight: '700' }}>Sign in</Text>
        </Text>
      </View>
    </View>
  );
}

function LoginScreen() {
  return (
    <View style={{ flex: 1, padding: 20 }}>
      <Logo />
      <Text style={{ fontSize: 26, fontWeight: '800', color: BRAND.ink, marginTop: 28, letterSpacing: -0.5 }}>
        Welcome back
      </Text>
      <Text style={{ color: Colors.textSecondary, marginTop: 4, fontSize: 13 }}>
        Log in to send or deliver parcels.
      </Text>

      <View style={{ marginTop: 24, gap: 12 }}>
        <InputField icon={<Mail size={16} color={Colors.textSecondary} />} value="alex@parcelpeer.app" />
        <InputField icon={<Lock size={16} color={Colors.textSecondary} />} value="••••••••••" />
      </View>

      <Text style={{ color: BRAND.primary, fontSize: 12, fontWeight: '600', alignSelf: 'flex-end', marginTop: 10 }}>
        Forgot password?
      </Text>

      <View style={{ backgroundColor: BRAND.primary, padding: 14, borderRadius: 14, alignItems: 'center', marginTop: 20 }}>
        <Text style={{ color: '#fff', fontWeight: '700' }}>Log in</Text>
      </View>

      <View style={{ flexDirection: 'row', alignItems: 'center', marginVertical: 18, gap: 8 }}>
        <View style={{ flex: 1, height: 1, backgroundColor: BRAND.border }} />
        <Text style={{ color: Colors.textTertiary, fontSize: 11 }}>or continue with</Text>
        <View style={{ flex: 1, height: 1, backgroundColor: BRAND.border }} />
      </View>

      <View style={{ flexDirection: 'row', gap: 10 }}>
        <SocialBtn label="Google" />
        <SocialBtn label="Apple" />
      </View>

      <Text style={{ textAlign: 'center', color: Colors.textSecondary, fontSize: 12, marginTop: 'auto', marginBottom: 10 }}>
        New here? <Text style={{ color: BRAND.primary, fontWeight: '700' }}>Create account</Text>
      </Text>
    </View>
  );
}

function InputField({ icon, value }: { icon: React.ReactNode; value: string }) {
  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
        paddingHorizontal: 14,
        paddingVertical: 12,
        backgroundColor: BRAND.surface,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: BRAND.border,
      }}
    >
      {icon}
      <Text style={{ color: BRAND.ink, fontSize: 13 }}>{value}</Text>
    </View>
  );
}

function SocialBtn({ label }: { label: string }) {
  return (
    <View
      style={{
        flex: 1,
        padding: 12,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: BRAND.border,
        alignItems: 'center',
        backgroundColor: BRAND.surface,
      }}
    >
      <Text style={{ fontWeight: '600', color: BRAND.ink, fontSize: 13 }}>{label}</Text>
    </View>
  );
}

function RoleSelectScreen() {
  return (
    <View style={{ flex: 1, padding: 20 }}>
      <Logo />
      <Text style={{ fontSize: 24, fontWeight: '800', color: BRAND.ink, marginTop: 28, letterSpacing: -0.5 }}>
        How will you use{'\n'}ParcelPeer?
      </Text>
      <Text style={{ color: Colors.textSecondary, marginTop: 6, fontSize: 13 }}>
        You can switch roles anytime.
      </Text>

      <View style={{ marginTop: 24, gap: 14 }}>
        <RoleCard
          selected
          icon={<Package size={24} color="#fff" />}
          title="Send a parcel"
          desc="Post a shipment and get matched with travelers."
        />
        <RoleCard
          icon={<Plane size={24} color={BRAND.primary} />}
          title="Deliver & earn"
          desc="Carry parcels on trips you're already making."
        />
      </View>

      <View style={{ marginTop: 'auto', backgroundColor: BRAND.primary, padding: 14, borderRadius: 14, alignItems: 'center' }}>
        <Text style={{ color: '#fff', fontWeight: '700' }}>Continue</Text>
      </View>
    </View>
  );
}

function RoleCard({
  selected,
  icon,
  title,
  desc,
}: {
  selected?: boolean;
  icon: React.ReactNode;
  title: string;
  desc: string;
}) {
  return (
    <View
      style={{
        flexDirection: 'row',
        gap: 14,
        padding: 16,
        borderRadius: 16,
        backgroundColor: selected ? BRAND.ink : BRAND.surface,
        borderWidth: 1,
        borderColor: selected ? BRAND.ink : BRAND.border,
      }}
    >
      <View
        style={{
          width: 48,
          height: 48,
          borderRadius: 12,
          backgroundColor: selected ? BRAND.primary : Colors.primaryLight,
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        {icon}
      </View>
      <View style={{ flex: 1 }}>
        <Text style={{ fontWeight: '700', color: selected ? '#fff' : BRAND.ink, fontSize: 15 }}>
          {title}
        </Text>
        <Text style={{ color: selected ? 'rgba(255,255,255,0.7)' : Colors.textSecondary, fontSize: 12, marginTop: 2 }}>
          {desc}
        </Text>
      </View>
      {selected && <CheckCircle2 size={20} color={BRAND.primary} />}
    </View>
  );
}

function HomeScreen() {
  return (
    <View style={{ flex: 1 }}>
      <View style={{ paddingHorizontal: 18, paddingTop: 8, paddingBottom: 14 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
            <Image source={AVATARS.a} style={{ width: 36, height: 36, borderRadius: 18 }} />
            <View>
              <Text style={{ fontSize: 11, color: Colors.textSecondary }}>Good morning</Text>
              <Text style={{ fontSize: 14, fontWeight: '700', color: BRAND.ink }}>Alex Kumar</Text>
            </View>
          </View>
          <View style={{ flexDirection: 'row', gap: 8 }}>
            <IconBtn><Search size={16} color={BRAND.ink} /></IconBtn>
            <IconBtn badge><Bell size={16} color={BRAND.ink} /></IconBtn>
          </View>
        </View>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 60 }}>
        <View style={{ marginHorizontal: 18, borderRadius: 20, overflow: 'hidden', backgroundColor: BRAND.ink }}>
          <Image
            source={HERO_BG}
            style={{ position: 'absolute', width: '100%', height: '100%', opacity: 0.35 }}
            contentFit="cover"
          />
          <View style={{ padding: 18 }}>
            <Text style={{ color: 'rgba(255,255,255,0.8)', fontSize: 11, fontWeight: '600' }}>
              FAST · VERIFIED · INSURED
            </Text>
            <Text style={{ color: '#fff', fontSize: 22, fontWeight: '800', marginTop: 6, letterSpacing: -0.5 }}>
              Send a parcel with{'\n'}someone heading your way
            </Text>
            <View
              style={{
                marginTop: 14,
                backgroundColor: BRAND.primary,
                alignSelf: 'flex-start',
                flexDirection: 'row',
                alignItems: 'center',
                gap: 6,
                paddingHorizontal: 14,
                paddingVertical: 9,
                borderRadius: 20,
              }}
            >
              <Text style={{ color: '#fff', fontWeight: '700', fontSize: 12 }}>Create shipment</Text>
              <ArrowRight size={14} color="#fff" />
            </View>
          </View>
        </View>

        <View style={{ paddingHorizontal: 18, marginTop: 20 }}>
          <Text style={{ fontWeight: '700', color: BRAND.ink, marginBottom: 10 }}>Quick actions</Text>
          <View style={{ flexDirection: 'row', gap: 10 }}>
            <QuickTile icon={<Package size={18} color={BRAND.primary} />} label="New parcel" />
            <QuickTile icon={<Plane size={18} color={BRAND.primary} />} label="Post trip" />
            <QuickTile icon={<Navigation size={18} color={BRAND.primary} />} label="Track" />
          </View>
        </View>

        <View style={{ paddingHorizontal: 18, marginTop: 22 }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
            <Text style={{ fontWeight: '700', color: BRAND.ink }}>Active shipments</Text>
            <Text style={{ color: BRAND.primary, fontSize: 12, fontWeight: '600' }}>See all</Text>
          </View>
          <ShipmentCard
            from="Mumbai"
            to="Bengaluru"
            status="In Transit"
            statusColor={Colors.statusInTransit}
            eta="Today · 6:40 PM"
            progress={0.7}
          />
          <ShipmentCard
            from="Delhi"
            to="Pune"
            status="Assigned"
            statusColor={Colors.statusAssigned}
            eta="Tomorrow · 11:00 AM"
            progress={0.2}
          />
        </View>
      </ScrollView>

      <BottomBar active="home" />
    </View>
  );
}

function IconBtn({ children, badge }: { children: React.ReactNode; badge?: boolean }) {
  return (
    <View
      style={{
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: BRAND.surface,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1,
        borderColor: BRAND.border,
      }}
    >
      {children}
      {badge && (
        <View
          style={{
            position: 'absolute',
            top: 6,
            right: 8,
            width: 8,
            height: 8,
            borderRadius: 4,
            backgroundColor: BRAND.primary,
            borderWidth: 1.5,
            borderColor: BRAND.surface,
          }}
        />
      )}
    </View>
  );
}

function QuickTile({ icon, label }: { icon: React.ReactNode; label: string }) {
  return (
    <View
      style={{
        flex: 1,
        backgroundColor: BRAND.surface,
        padding: 12,
        borderRadius: 14,
        borderWidth: 1,
        borderColor: BRAND.border,
        alignItems: 'center',
        gap: 6,
      }}
    >
      <View
        style={{
          width: 36,
          height: 36,
          borderRadius: 18,
          backgroundColor: Colors.primaryLight,
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        {icon}
      </View>
      <Text style={{ fontSize: 11, color: BRAND.ink, fontWeight: '600' }}>{label}</Text>
    </View>
  );
}

function ShipmentCard({
  from,
  to,
  status,
  statusColor,
  eta,
  progress,
}: {
  from: string;
  to: string;
  status: string;
  statusColor: string;
  eta: string;
  progress: number;
}) {
  return (
    <View
      style={{
        backgroundColor: BRAND.surface,
        borderRadius: 16,
        padding: 14,
        borderWidth: 1,
        borderColor: BRAND.border,
        marginBottom: 10,
      }}
    >
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
        <View
          style={{
            backgroundColor: statusColor + '22',
            paddingHorizontal: 8,
            paddingVertical: 3,
            borderRadius: 20,
          }}
        >
          <Text style={{ color: statusColor, fontSize: 10, fontWeight: '700' }}>{status.toUpperCase()}</Text>
        </View>
        <Text style={{ fontSize: 11, color: Colors.textSecondary }}>{eta}</Text>
      </View>

      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginVertical: 6 }}>
        <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: BRAND.primary }} />
        <Text style={{ fontWeight: '700', color: BRAND.ink }}>{from}</Text>
        <View style={{ flex: 1, height: 1.5, backgroundColor: BRAND.border, borderStyle: 'dashed' }} />
        <ArrowRight size={12} color={Colors.textSecondary} />
        <View style={{ flex: 1, height: 1.5, backgroundColor: BRAND.border }} />
        <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: BRAND.ink }} />
        <Text style={{ fontWeight: '700', color: BRAND.ink }}>{to}</Text>
      </View>

      <View style={{ height: 4, backgroundColor: BRAND.border, borderRadius: 2, marginTop: 8, overflow: 'hidden' }}>
        <View style={{ width: `${progress * 100}%`, height: '100%', backgroundColor: BRAND.primary }} />
      </View>
    </View>
  );
}

function BottomBar({ active }: { active: 'home' | 'ship' | 'msg' | 'profile' | 'earn' }) {
  const tabs: { key: string; icon: React.ReactNode; label: string }[] = [
    { key: 'home', icon: <Package size={18} />, label: 'Home' },
    { key: 'ship', icon: <Navigation size={18} />, label: 'Shipments' },
    { key: 'msg', icon: <MessageSquare size={18} />, label: 'Quotes' },
    { key: 'profile', icon: <User size={18} />, label: 'Profile' },
  ];
  return (
    <View
      style={{
        flexDirection: 'row',
        backgroundColor: BRAND.surface,
        borderTopWidth: 1,
        borderTopColor: BRAND.border,
        paddingVertical: 8,
        paddingBottom: 14,
      }}
    >
      {tabs.map((t) => {
        const isActive = t.key === active;
        return (
          <View key={t.key} style={{ flex: 1, alignItems: 'center', gap: 2 }}>
            {React.cloneElement(t.icon as React.ReactElement<{ color: string }>, {
              color: isActive ? BRAND.primary : Colors.textTertiary,
            })}
            <Text style={{ fontSize: 10, color: isActive ? BRAND.primary : Colors.textTertiary, fontWeight: '600' }}>
              {t.label}
            </Text>
          </View>
        );
      })}
    </View>
  );
}

function CreateShipmentScreen() {
  return (
    <View style={{ flex: 1 }}>
      <HeaderBar title="New Shipment" />
      <ScrollView contentContainerStyle={{ padding: 18, gap: 14 }}>
        <StepIndicator current={2} total={4} label="Package details" />

        <FieldGroup label="From">
          <FieldRow icon={<MapPin size={14} color={BRAND.primary} />} value="Bandra West, Mumbai" />
        </FieldGroup>
        <FieldGroup label="To">
          <FieldRow icon={<MapPin size={14} color={BRAND.ink} />} value="Koramangala, Bengaluru" />
        </FieldGroup>

        <FieldGroup label="Package">
          <View
            style={{
              backgroundColor: BRAND.surface,
              borderRadius: 14,
              padding: 14,
              borderWidth: 1,
              borderColor: BRAND.border,
              flexDirection: 'row',
              alignItems: 'center',
              gap: 12,
            }}
          >
            <Image
              source="https://images.unsplash.com/photo-1607344645866-009c320b63e0?w=300&q=80"
              style={{ width: 52, height: 52, borderRadius: 10 }}
            />
            <View style={{ flex: 1 }}>
              <Text style={{ fontWeight: '700', color: BRAND.ink }}>Documents & Electronics</Text>
              <Text style={{ fontSize: 11, color: Colors.textSecondary, marginTop: 2 }}>
                2.5 kg · 30×20×10 cm · ₹5,000 value
              </Text>
            </View>
          </View>
        </FieldGroup>

        <FieldGroup label="Pickup window">
          <View style={{ flexDirection: 'row', gap: 10 }}>
            <ChipOption label="Today" icon={<Calendar size={12} color={BRAND.ink} />} />
            <ChipOption label="Tomorrow" selected icon={<Calendar size={12} color="#fff" />} />
            <ChipOption label="Pick date" icon={<Calendar size={12} color={BRAND.ink} />} />
          </View>
        </FieldGroup>

        <View
          style={{
            backgroundColor: Colors.primaryLight,
            padding: 12,
            borderRadius: 12,
            flexDirection: 'row',
            gap: 10,
          }}
        >
          <Sparkles size={16} color={BRAND.primaryDark} />
          <Text style={{ flex: 1, color: BRAND.primaryDark, fontSize: 12, fontWeight: '500' }}>
            3 travelers matched. Typical quotes ₹280 – ₹420.
          </Text>
        </View>
      </ScrollView>
      <View style={{ padding: 16, borderTopWidth: 1, borderTopColor: BRAND.border, backgroundColor: BRAND.surface }}>
        <View style={{ backgroundColor: BRAND.primary, padding: 14, borderRadius: 14, alignItems: 'center' }}>
          <Text style={{ color: '#fff', fontWeight: '700' }}>Find travelers →</Text>
        </View>
      </View>
    </View>
  );
}

function StepIndicator({ current, total, label }: { current: number; total: number; label: string }) {
  return (
    <View style={{ gap: 8 }}>
      <View style={{ flexDirection: 'row', gap: 4 }}>
        {Array.from({ length: total }).map((_, i) => (
          <View
            key={i}
            style={{
              flex: 1,
              height: 4,
              borderRadius: 2,
              backgroundColor: i < current ? BRAND.primary : BRAND.border,
            }}
          />
        ))}
      </View>
      <Text style={{ fontSize: 12, color: Colors.textSecondary, fontWeight: '600' }}>
        Step {current} of {total} · {label}
      </Text>
    </View>
  );
}

function FieldGroup({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <View style={{ gap: 6 }}>
      <Text style={{ fontSize: 11, fontWeight: '700', color: Colors.textSecondary, textTransform: 'uppercase', letterSpacing: 0.5 }}>
        {label}
      </Text>
      {children}
    </View>
  );
}

function FieldRow({ icon, value }: { icon: React.ReactNode; value: string }) {
  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
        backgroundColor: BRAND.surface,
        padding: 14,
        borderRadius: 14,
        borderWidth: 1,
        borderColor: BRAND.border,
      }}
    >
      {icon}
      <Text style={{ fontWeight: '600', color: BRAND.ink, fontSize: 13 }}>{value}</Text>
    </View>
  );
}

function ChipOption({
  label,
  selected,
  icon,
}: {
  label: string;
  selected?: boolean;
  icon?: React.ReactNode;
}) {
  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        paddingVertical: 10,
        paddingHorizontal: 14,
        borderRadius: 20,
        backgroundColor: selected ? BRAND.ink : BRAND.surface,
        borderWidth: 1,
        borderColor: selected ? BRAND.ink : BRAND.border,
      }}
    >
      {icon}
      <Text style={{ color: selected ? '#fff' : BRAND.ink, fontWeight: '600', fontSize: 12 }}>
        {label}
      </Text>
    </View>
  );
}

function HeaderBar({ title, right }: { title: string; right?: React.ReactNode }) {
  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 12,
        paddingVertical: 10,
        backgroundColor: BRAND.cream,
      }}
    >
      <View
        style={{
          width: 36,
          height: 36,
          borderRadius: 18,
          backgroundColor: BRAND.surface,
          alignItems: 'center',
          justifyContent: 'center',
          borderWidth: 1,
          borderColor: BRAND.border,
        }}
      >
        <ChevronLeft size={18} color={BRAND.ink} />
      </View>
      <Text style={{ flex: 1, textAlign: 'center', fontWeight: '700', color: BRAND.ink, fontSize: 15 }}>
        {title}
      </Text>
      {right || <View style={{ width: 36 }} />}
    </View>
  );
}

function MatchScreen() {
  const travelers = [
    { name: 'Priya Sharma', rating: 4.9, trips: 142, price: '₹320', eta: '6 hrs', avatar: AVATARS.c, verified: true, match: 98 },
    { name: 'Rahul Mehta', rating: 4.8, trips: 87, price: '₹280', eta: '8 hrs', avatar: AVATARS.b, verified: true, match: 94 },
    { name: 'Anita Desai', rating: 4.7, trips: 56, price: '₹420', eta: '4 hrs', avatar: AVATARS.d, verified: true, match: 89 },
  ];
  return (
    <View style={{ flex: 1 }}>
      <HeaderBar title="Best Matches" />
      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 30 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 14 }}>
          <Sparkles size={14} color={BRAND.primary} />
          <Text style={{ color: Colors.textSecondary, fontSize: 12 }}>
            <Text style={{ color: BRAND.ink, fontWeight: '700' }}>3 travelers</Text> matched for your route
          </Text>
        </View>

        {travelers.map((t, idx) => (
          <View
            key={idx}
            style={{
              backgroundColor: BRAND.surface,
              borderRadius: 16,
              padding: 14,
              marginBottom: 10,
              borderWidth: idx === 0 ? 2 : 1,
              borderColor: idx === 0 ? BRAND.primary : BRAND.border,
            }}
          >
            {idx === 0 && (
              <View
                style={{
                  position: 'absolute',
                  top: -10,
                  left: 14,
                  backgroundColor: BRAND.primary,
                  paddingHorizontal: 8,
                  paddingVertical: 3,
                  borderRadius: 10,
                }}
              >
                <Text style={{ color: '#fff', fontSize: 9, fontWeight: '800' }}>TOP MATCH · {t.match}%</Text>
              </View>
            )}
            <View style={{ flexDirection: 'row', gap: 12 }}>
              <Image source={t.avatar} style={{ width: 52, height: 52, borderRadius: 26 }} />
              <View style={{ flex: 1 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}>
                  <Text style={{ fontWeight: '700', color: BRAND.ink, fontSize: 14 }}>{t.name}</Text>
                  {t.verified && <ShieldCheck size={13} color={BRAND.success} />}
                </View>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 3 }}>
                  <Star size={11} color={BRAND.accent} fill={BRAND.accent} />
                  <Text style={{ fontSize: 11, color: Colors.textSecondary }}>
                    {t.rating} · {t.trips} trips
                  </Text>
                </View>
                <View style={{ flexDirection: 'row', gap: 8, marginTop: 6 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 3, backgroundColor: Colors.infoLight, paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6 }}>
                    <Clock size={10} color={Colors.info} />
                    <Text style={{ fontSize: 10, color: Colors.info, fontWeight: '700' }}>{t.eta}</Text>
                  </View>
                </View>
              </View>
              <View style={{ alignItems: 'flex-end' }}>
                <Text style={{ fontSize: 18, fontWeight: '800', color: BRAND.ink }}>{t.price}</Text>
                <Text style={{ fontSize: 10, color: Colors.textSecondary }}>total</Text>
              </View>
            </View>
            <View style={{ flexDirection: 'row', gap: 8, marginTop: 12 }}>
              <View style={{ flex: 1, padding: 10, borderRadius: 10, borderWidth: 1, borderColor: BRAND.border, alignItems: 'center' }}>
                <Text style={{ fontSize: 12, fontWeight: '600', color: BRAND.ink }}>Message</Text>
              </View>
              <View style={{ flex: 1, padding: 10, borderRadius: 10, backgroundColor: BRAND.primary, alignItems: 'center' }}>
                <Text style={{ fontSize: 12, fontWeight: '700', color: '#fff' }}>Accept quote</Text>
              </View>
            </View>
          </View>
        ))}
      </ScrollView>
    </View>
  );
}

function HandoverScreen() {
  return (
    <View style={{ flex: 1, backgroundColor: BRAND.ink }}>
      <View style={{ paddingHorizontal: 12, paddingVertical: 10, flexDirection: 'row', alignItems: 'center' }}>
        <View style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: 'rgba(255,255,255,0.1)', alignItems: 'center', justifyContent: 'center' }}>
          <ChevronLeft size={18} color="#fff" />
        </View>
        <Text style={{ flex: 1, textAlign: 'center', color: '#fff', fontWeight: '700' }}>Secure Handover</Text>
        <View style={{ width: 36 }} />
      </View>

      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 }}>
        <Text style={{ color: 'rgba(255,255,255,0.65)', fontSize: 12, fontWeight: '600', letterSpacing: 0.5 }}>
          SHOW THIS TO YOUR TRAVELER
        </Text>
        <View
          style={{
            width: 200,
            height: 200,
            backgroundColor: '#fff',
            borderRadius: 24,
            marginTop: 18,
            alignItems: 'center',
            justifyContent: 'center',
            padding: 20,
          }}
        >
          <QrCode size={160} color={BRAND.ink} strokeWidth={1.5} />
        </View>

        <Text style={{ color: '#fff', fontSize: 30, fontWeight: '800', letterSpacing: 8, marginTop: 24 }}>
          4 7 2 9
        </Text>
        <Text style={{ color: 'rgba(255,255,255,0.7)', fontSize: 12, marginTop: 4 }}>
          Pickup OTP · Expires in 14:32
        </Text>

        <View
          style={{
            marginTop: 30,
            backgroundColor: 'rgba(255,255,255,0.08)',
            borderRadius: 16,
            padding: 16,
            width: '100%',
            flexDirection: 'row',
            gap: 12,
            alignItems: 'center',
          }}
        >
          <Image source={AVATARS.c} style={{ width: 44, height: 44, borderRadius: 22 }} />
          <View style={{ flex: 1 }}>
            <Text style={{ color: '#fff', fontWeight: '700' }}>Priya Sharma</Text>
            <Text style={{ color: 'rgba(255,255,255,0.6)', fontSize: 11 }}>ETA 6 min · 200m away</Text>
          </View>
          <View style={{ backgroundColor: BRAND.primary, width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' }}>
            <MessageSquare size={18} color="#fff" />
          </View>
        </View>
      </View>
    </View>
  );
}

function TrackingScreen() {
  return (
    <View style={{ flex: 1 }}>
      <View style={{ height: 300, position: 'relative' }}>
        <Image source={MAP_BG} style={StyleSheet.absoluteFillObject} contentFit="cover" />
        <View style={[StyleSheet.absoluteFillObject, { backgroundColor: 'rgba(255,255,255,0.25)' }]} />
        <View style={{ paddingHorizontal: 12, paddingVertical: 10, flexDirection: 'row', alignItems: 'center' }}>
          <View style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: BRAND.surface, alignItems: 'center', justifyContent: 'center' }}>
            <ChevronLeft size={18} color={BRAND.ink} />
          </View>
          <View style={{ flex: 1 }} />
          <View style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: BRAND.surface, alignItems: 'center', justifyContent: 'center' }}>
            <Navigation size={16} color={BRAND.primary} />
          </View>
        </View>
        <View style={{ position: 'absolute', top: '50%', left: '40%' }}>
          <View style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(255,90,31,0.3)', alignItems: 'center', justifyContent: 'center' }}>
            <View style={{ width: 16, height: 16, borderRadius: 8, backgroundColor: BRAND.primary, borderWidth: 3, borderColor: '#fff' }} />
          </View>
        </View>
      </View>

      <View
        style={{
          flex: 1,
          backgroundColor: BRAND.surface,
          borderTopLeftRadius: 24,
          borderTopRightRadius: 24,
          marginTop: -24,
          padding: 18,
        }}
      >
        <View style={{ width: 40, height: 4, borderRadius: 2, backgroundColor: BRAND.border, alignSelf: 'center', marginBottom: 12 }} />
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
          <View>
            <Text style={{ fontSize: 10, color: Colors.textSecondary, fontWeight: '700', letterSpacing: 0.5 }}>IN TRANSIT</Text>
            <Text style={{ fontSize: 20, fontWeight: '800', color: BRAND.ink, marginTop: 2 }}>Arriving 6:40 PM</Text>
          </View>
          <View style={{ alignItems: 'center' }}>
            <Image source={AVATARS.c} style={{ width: 44, height: 44, borderRadius: 22 }} />
            <Text style={{ fontSize: 10, color: Colors.textSecondary, marginTop: 2 }}>Priya</Text>
          </View>
        </View>

        <View style={{ marginTop: 16, gap: 10 }}>
          <TimelineStep icon={<CheckCircle2 size={16} color={BRAND.success} />} label="Picked up" time="2:14 PM" done />
          <TimelineStep icon={<CheckCircle2 size={16} color={BRAND.success} />} label="In transit" time="Now" active />
          <TimelineStep icon={<Clock size={16} color={Colors.textTertiary} />} label="Out for delivery" time="6:20 PM" />
          <TimelineStep icon={<Clock size={16} color={Colors.textTertiary} />} label="Delivered" time="6:40 PM" />
        </View>
      </View>
    </View>
  );
}

function TimelineStep({ icon, label, time, done, active }: { icon: React.ReactNode; label: string; time: string; done?: boolean; active?: boolean }) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
      {icon}
      <Text style={{ flex: 1, color: done || active ? BRAND.ink : Colors.textTertiary, fontWeight: active ? '700' : '500', fontSize: 13 }}>
        {label}
      </Text>
      <Text style={{ fontSize: 11, color: Colors.textSecondary }}>{time}</Text>
    </View>
  );
}

function ChatScreen() {
  return (
    <View style={{ flex: 1 }}>
      <View
        style={{
          paddingHorizontal: 12,
          paddingVertical: 10,
          flexDirection: 'row',
          alignItems: 'center',
          gap: 10,
          backgroundColor: BRAND.surface,
          borderBottomWidth: 1,
          borderBottomColor: BRAND.border,
        }}
      >
        <ChevronLeft size={20} color={BRAND.ink} />
        <Image source={AVATARS.c} style={{ width: 36, height: 36, borderRadius: 18 }} />
        <View style={{ flex: 1 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}>
            <Text style={{ fontWeight: '700', color: BRAND.ink, fontSize: 14 }}>Priya Sharma</Text>
            <ShieldCheck size={12} color={BRAND.success} />
          </View>
          <Text style={{ fontSize: 11, color: BRAND.success, fontWeight: '600' }}>● online</Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={{ padding: 14, gap: 10 }}>
        <View style={{ alignSelf: 'center', backgroundColor: BRAND.border, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 10 }}>
          <Text style={{ fontSize: 10, color: Colors.textSecondary, fontWeight: '600' }}>TODAY</Text>
        </View>
        <ChatBubble text="Hi! Heading to Bengaluru tomorrow morning 🚆" />
        <ChatBubble me text="Great! Can you pick up from Bandra by 9 AM?" />
        <ChatBubble text="Yes, that works. Sending my ETA & vehicle details." />
        <View style={{ alignSelf: 'flex-start', backgroundColor: BRAND.surface, borderRadius: 14, padding: 10, borderWidth: 1, borderColor: BRAND.border, gap: 8, maxWidth: '78%' }}>
          <View style={{ flexDirection: 'row', gap: 10 }}>
            <View style={{ width: 40, height: 40, borderRadius: 10, backgroundColor: Colors.primaryLight, alignItems: 'center', justifyContent: 'center' }}>
              <FileText size={18} color={BRAND.primary} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ fontWeight: '700', color: BRAND.ink, fontSize: 12 }}>Trip confirmation</Text>
              <Text style={{ fontSize: 10, color: Colors.textSecondary }}>Mumbai → Bengaluru · 8:00 AM</Text>
            </View>
          </View>
        </View>
        <ChatBubble me text="Confirmed. See you tomorrow 👋" />
      </ScrollView>

      <View style={{ padding: 10, flexDirection: 'row', gap: 8, backgroundColor: BRAND.surface, borderTopWidth: 1, borderTopColor: BRAND.border }}>
        <View style={{ flex: 1, backgroundColor: BRAND.cream, borderRadius: 20, paddingHorizontal: 14, paddingVertical: 10, borderWidth: 1, borderColor: BRAND.border }}>
          <Text style={{ color: Colors.textTertiary, fontSize: 13 }}>Type a message…</Text>
        </View>
        <View style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: BRAND.primary, alignItems: 'center', justifyContent: 'center' }}>
          <Send size={16} color="#fff" />
        </View>
      </View>
    </View>
  );
}

function ChatBubble({ text, me }: { text: string; me?: boolean }) {
  return (
    <View
      style={{
        alignSelf: me ? 'flex-end' : 'flex-start',
        backgroundColor: me ? BRAND.primary : BRAND.surface,
        padding: 10,
        paddingHorizontal: 14,
        borderRadius: 16,
        borderBottomRightRadius: me ? 4 : 16,
        borderBottomLeftRadius: me ? 16 : 4,
        borderWidth: me ? 0 : 1,
        borderColor: BRAND.border,
        maxWidth: '78%',
      }}
    >
      <Text style={{ color: me ? '#fff' : BRAND.ink, fontSize: 13 }}>{text}</Text>
    </View>
  );
}

function PaymentScreen() {
  return (
    <View style={{ flex: 1 }}>
      <HeaderBar title="Payment" />
      <ScrollView contentContainerStyle={{ padding: 18 }}>
        <View
          style={{
            backgroundColor: BRAND.ink,
            borderRadius: 20,
            padding: 20,
            overflow: 'hidden',
          }}
        >
          <Image source={HERO_BG} style={[StyleSheet.absoluteFillObject, { opacity: 0.2 }]} contentFit="cover" />
          <Text style={{ color: 'rgba(255,255,255,0.7)', fontSize: 11, fontWeight: '600' }}>TOTAL TO PAY</Text>
          <Text style={{ color: '#fff', fontSize: 36, fontWeight: '800', marginTop: 4 }}>₹320</Text>
          <View style={{ marginTop: 10, flexDirection: 'row', gap: 6, alignItems: 'center' }}>
            <ShieldCheck size={13} color={BRAND.accent} />
            <Text style={{ color: 'rgba(255,255,255,0.8)', fontSize: 11 }}>
              Held in escrow · Released on delivery
            </Text>
          </View>
        </View>

        <Text style={{ fontWeight: '700', color: BRAND.ink, marginTop: 20, marginBottom: 10 }}>Payment method</Text>

        <PaymentOption icon="💳" title="ICICI Debit Card" subtitle="•••• 4521" selected />
        <PaymentOption icon="🅿️" title="UPI" subtitle="alex@okhdfc" />
        <PaymentOption icon="💰" title="ParcelPeer Wallet" subtitle="₹1,240 balance" />

        <View style={{ marginTop: 16, padding: 12, backgroundColor: Colors.successLight, borderRadius: 10, flexDirection: 'row', gap: 8 }}>
          <Sparkles size={14} color={BRAND.success} />
          <Text style={{ color: BRAND.success, fontSize: 12, fontWeight: '600', flex: 1 }}>
            Use 100 points to save ₹10
          </Text>
        </View>
      </ScrollView>
      <View style={{ padding: 16, borderTopWidth: 1, borderTopColor: BRAND.border, backgroundColor: BRAND.surface }}>
        <View style={{ backgroundColor: BRAND.primary, padding: 14, borderRadius: 14, alignItems: 'center' }}>
          <Text style={{ color: '#fff', fontWeight: '700' }}>Pay ₹320 securely</Text>
        </View>
      </View>
    </View>
  );
}

function PaymentOption({ icon, title, subtitle, selected }: { icon: string; title: string; subtitle: string; selected?: boolean }) {
  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        padding: 14,
        borderRadius: 14,
        backgroundColor: BRAND.surface,
        borderWidth: 1.5,
        borderColor: selected ? BRAND.primary : BRAND.border,
        marginBottom: 8,
      }}
    >
      <View style={{ width: 40, height: 40, borderRadius: 10, backgroundColor: BRAND.cream, alignItems: 'center', justifyContent: 'center' }}>
        <Text style={{ fontSize: 18 }}>{icon}</Text>
      </View>
      <View style={{ flex: 1 }}>
        <Text style={{ fontWeight: '700', color: BRAND.ink, fontSize: 13 }}>{title}</Text>
        <Text style={{ fontSize: 11, color: Colors.textSecondary }}>{subtitle}</Text>
      </View>
      <View
        style={{
          width: 20,
          height: 20,
          borderRadius: 10,
          borderWidth: 2,
          borderColor: selected ? BRAND.primary : BRAND.border,
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        {selected && <View style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: BRAND.primary }} />}
      </View>
    </View>
  );
}

function TravelerDashboard() {
  return (
    <View style={{ flex: 1 }}>
      <View style={{ backgroundColor: BRAND.ink, paddingHorizontal: 18, paddingTop: 10, paddingBottom: 24, borderBottomLeftRadius: 24, borderBottomRightRadius: 24 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
          <View>
            <Text style={{ color: 'rgba(255,255,255,0.7)', fontSize: 11 }}>This week</Text>
            <Text style={{ color: '#fff', fontSize: 26, fontWeight: '800', marginTop: 2 }}>₹ 12,480</Text>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 2 }}>
              <TrendingUp size={12} color={BRAND.success} />
              <Text style={{ color: BRAND.success, fontSize: 11, fontWeight: '700' }}>+24% vs last week</Text>
            </View>
          </View>
          <Image source={AVATARS.c} style={{ width: 44, height: 44, borderRadius: 22, borderWidth: 2, borderColor: BRAND.primary }} />
        </View>
        <View style={{ flexDirection: 'row', marginTop: 18, gap: 10 }}>
          <StatPill value="14" label="Deliveries" />
          <StatPill value="4.9" label="Rating" />
          <StatPill value="98%" label="On-time" />
        </View>
      </View>

      <ScrollView contentContainerStyle={{ padding: 18 }}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
          <Text style={{ fontWeight: '700', color: BRAND.ink }}>Requests on your route</Text>
          <Text style={{ color: BRAND.primary, fontSize: 12, fontWeight: '600' }}>View all</Text>
        </View>

        <RequestCard
          from="Mumbai"
          to="Bengaluru"
          price="₹320"
          weight="2.5 kg"
          category="Documents"
          sender="Alex K."
          avatar={AVATARS.a}
        />
        <RequestCard
          from="Mumbai"
          to="Pune"
          price="₹180"
          weight="1.2 kg"
          category="Small gift"
          sender="Meera P."
          avatar={AVATARS.d}
        />

        <View style={{ marginTop: 16, backgroundColor: BRAND.surface, borderRadius: 16, padding: 14, borderWidth: 1, borderColor: BRAND.border, flexDirection: 'row', gap: 12, alignItems: 'center' }}>
          <View style={{ width: 44, height: 44, borderRadius: 12, backgroundColor: Colors.primaryLight, alignItems: 'center', justifyContent: 'center' }}>
            <Plane size={22} color={BRAND.primary} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={{ fontWeight: '700', color: BRAND.ink, fontSize: 13 }}>Post your next trip</Text>
            <Text style={{ fontSize: 11, color: Colors.textSecondary }}>Get matched automatically</Text>
          </View>
          <ArrowUpRight size={18} color={BRAND.primary} />
        </View>
      </ScrollView>
    </View>
  );
}

function StatPill({ value, label }: { value: string; label: string }) {
  return (
    <View style={{ flex: 1, backgroundColor: 'rgba(255,255,255,0.08)', borderRadius: 12, padding: 10 }}>
      <Text style={{ color: '#fff', fontWeight: '800', fontSize: 16 }}>{value}</Text>
      <Text style={{ color: 'rgba(255,255,255,0.65)', fontSize: 10 }}>{label}</Text>
    </View>
  );
}

function RequestCard({
  from,
  to,
  price,
  weight,
  category,
  sender,
  avatar,
}: {
  from: string;
  to: string;
  price: string;
  weight: string;
  category: string;
  sender: string;
  avatar: string;
}) {
  return (
    <View style={{ backgroundColor: BRAND.surface, borderRadius: 16, padding: 14, marginBottom: 10, borderWidth: 1, borderColor: BRAND.border }}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          <Image source={avatar} style={{ width: 28, height: 28, borderRadius: 14 }} />
          <Text style={{ fontSize: 12, fontWeight: '600', color: BRAND.ink }}>{sender}</Text>
        </View>
        <Text style={{ fontSize: 18, fontWeight: '800', color: BRAND.primary }}>{price}</Text>
      </View>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
        <Text style={{ fontWeight: '700', color: BRAND.ink, fontSize: 13 }}>{from}</Text>
        <ArrowRight size={12} color={Colors.textSecondary} />
        <Text style={{ fontWeight: '700', color: BRAND.ink, fontSize: 13 }}>{to}</Text>
      </View>
      <View style={{ flexDirection: 'row', gap: 6, marginTop: 8 }}>
        <TagBadge label={weight} />
        <TagBadge label={category} />
      </View>
      <View style={{ marginTop: 12, backgroundColor: BRAND.ink, padding: 10, borderRadius: 10, alignItems: 'center' }}>
        <Text style={{ color: '#fff', fontWeight: '700', fontSize: 12 }}>Accept request</Text>
      </View>
    </View>
  );
}

function TagBadge({ label }: { label: string }) {
  return (
    <View style={{ backgroundColor: BRAND.cream, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 }}>
      <Text style={{ fontSize: 10, color: Colors.textSecondary, fontWeight: '600' }}>{label}</Text>
    </View>
  );
}

function ReviewScreen() {
  return (
    <View style={{ flex: 1 }}>
      <HeaderBar title="Rate your delivery" />
      <ScrollView contentContainerStyle={{ padding: 20, alignItems: 'center' }}>
        <Image source={AVATARS.c} style={{ width: 90, height: 90, borderRadius: 45, borderWidth: 3, borderColor: BRAND.primary }} />
        <Text style={{ fontSize: 18, fontWeight: '800', color: BRAND.ink, marginTop: 14 }}>Priya Sharma</Text>
        <Text style={{ fontSize: 12, color: Colors.textSecondary }}>Delivered on time · Mumbai → Bengaluru</Text>

        <View style={{ flexDirection: 'row', gap: 8, marginTop: 22 }}>
          {[1, 2, 3, 4, 5].map((i) => (
            <Star
              key={i}
              size={36}
              color={i <= 5 ? BRAND.accent : BRAND.border}
              fill={i <= 5 ? BRAND.accent : 'transparent'}
            />
          ))}
        </View>
        <Text style={{ fontSize: 11, color: Colors.textSecondary, marginTop: 6 }}>Amazing!</Text>

        <View style={{ marginTop: 26, width: '100%' }}>
          <Text style={{ fontSize: 12, fontWeight: '700', color: Colors.textSecondary, marginBottom: 10 }}>
            What went well?
          </Text>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
            {['On time', 'Careful handling', 'Great comms', 'Polite', 'Safe packaging'].map((t, i) => (
              <ChipOption key={t} label={t} selected={i < 3} />
            ))}
          </View>
        </View>

        <View style={{ marginTop: 20, width: '100%', backgroundColor: BRAND.surface, borderWidth: 1, borderColor: BRAND.border, borderRadius: 14, padding: 14, minHeight: 80 }}>
          <Text style={{ color: BRAND.ink, fontSize: 13 }}>Priya was super friendly and delivered early! Will definitely use again.</Text>
        </View>
      </ScrollView>
      <View style={{ padding: 16, borderTopWidth: 1, borderTopColor: BRAND.border, backgroundColor: BRAND.surface }}>
        <View style={{ backgroundColor: BRAND.primary, padding: 14, borderRadius: 14, alignItems: 'center' }}>
          <Text style={{ color: '#fff', fontWeight: '700' }}>Submit review</Text>
        </View>
      </View>
    </View>
  );
}

function KYCScreen() {
  return (
    <View style={{ flex: 1 }}>
      <HeaderBar title="Verify your identity" />
      <ScrollView contentContainerStyle={{ padding: 20 }}>
        <View style={{ alignItems: 'center', marginBottom: 20 }}>
          <View style={{ width: 72, height: 72, borderRadius: 20, backgroundColor: Colors.primaryLight, alignItems: 'center', justifyContent: 'center' }}>
            <Shield size={32} color={BRAND.primary} />
          </View>
          <Text style={{ fontSize: 18, fontWeight: '800', color: BRAND.ink, marginTop: 12 }}>KYC verification</Text>
          <Text style={{ textAlign: 'center', fontSize: 12, color: Colors.textSecondary, marginTop: 4 }}>
            Required for trustworthy delivery.{'\n'}Takes under 2 minutes.
          </Text>
        </View>

        <KYCStep
          num={1}
          done
          title="Aadhaar verified"
          desc="•••• •••• 4729"
        />
        <KYCStep
          num={2}
          active
          title="Selfie with ID"
          desc="We match it to your Aadhaar photo"
          icon={<Camera size={18} color="#fff" />}
        />
        <KYCStep
          num={3}
          title="Bank details"
          desc="For escrow payouts"
        />

        <View style={{ marginTop: 20, backgroundColor: Colors.infoLight, padding: 14, borderRadius: 12, flexDirection: 'row', gap: 10 }}>
          <Fingerprint size={18} color={Colors.info} />
          <Text style={{ flex: 1, color: Colors.info, fontSize: 12, fontWeight: '500' }}>
            Your data is encrypted end-to-end and never shared with travelers.
          </Text>
        </View>
      </ScrollView>
      <View style={{ padding: 16, borderTopWidth: 1, borderTopColor: BRAND.border, backgroundColor: BRAND.surface }}>
        <View style={{ backgroundColor: BRAND.primary, padding: 14, borderRadius: 14, alignItems: 'center' }}>
          <Text style={{ color: '#fff', fontWeight: '700' }}>Take selfie →</Text>
        </View>
      </View>
    </View>
  );
}

function KYCStep({ num, title, desc, done, active, icon }: { num: number; title: string; desc: string; done?: boolean; active?: boolean; icon?: React.ReactNode }) {
  return (
    <View
      style={{
        flexDirection: 'row',
        gap: 12,
        padding: 14,
        backgroundColor: BRAND.surface,
        borderRadius: 14,
        borderWidth: active ? 2 : 1,
        borderColor: active ? BRAND.primary : BRAND.border,
        marginBottom: 10,
      }}
    >
      <View
        style={{
          width: 36,
          height: 36,
          borderRadius: 18,
          backgroundColor: done ? BRAND.success : active ? BRAND.primary : BRAND.border,
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        {done ? <CheckCircle2 size={18} color="#fff" /> : active && icon ? icon : <Text style={{ color: '#fff', fontWeight: '800' }}>{num}</Text>}
      </View>
      <View style={{ flex: 1 }}>
        <Text style={{ fontWeight: '700', color: BRAND.ink, fontSize: 13 }}>{title}</Text>
        <Text style={{ fontSize: 11, color: Colors.textSecondary, marginTop: 2 }}>{desc}</Text>
      </View>
      {done && <Text style={{ color: BRAND.success, fontSize: 11, fontWeight: '700' }}>DONE</Text>}
    </View>
  );
}

function ProfileScreen() {
  return (
    <View style={{ flex: 1 }}>
      <View style={{ backgroundColor: BRAND.ink, paddingTop: 24, paddingBottom: 30, alignItems: 'center', borderBottomLeftRadius: 24, borderBottomRightRadius: 24 }}>
        <Image source={HERO_BG} style={[StyleSheet.absoluteFillObject, { opacity: 0.15 }]} contentFit="cover" />
        <Image source={AVATARS.a} style={{ width: 88, height: 88, borderRadius: 44, borderWidth: 3, borderColor: BRAND.primary }} />
        <Text style={{ color: '#fff', fontWeight: '800', fontSize: 18, marginTop: 10 }}>Alex Kumar</Text>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: 4 }}>
          <ShieldCheck size={13} color={BRAND.success} />
          <Text style={{ color: 'rgba(255,255,255,0.8)', fontSize: 12 }}>Verified · Member since 2024</Text>
        </View>
        <View style={{ flexDirection: 'row', gap: 20, marginTop: 16 }}>
          <View style={{ alignItems: 'center' }}>
            <Text style={{ color: '#fff', fontWeight: '800', fontSize: 16 }}>28</Text>
            <Text style={{ color: 'rgba(255,255,255,0.6)', fontSize: 10 }}>Shipments</Text>
          </View>
          <View style={{ width: 1, backgroundColor: 'rgba(255,255,255,0.15)' }} />
          <View style={{ alignItems: 'center' }}>
            <Text style={{ color: '#fff', fontWeight: '800', fontSize: 16 }}>4.9★</Text>
            <Text style={{ color: 'rgba(255,255,255,0.6)', fontSize: 10 }}>Rating</Text>
          </View>
          <View style={{ width: 1, backgroundColor: 'rgba(255,255,255,0.15)' }} />
          <View style={{ alignItems: 'center' }}>
            <Text style={{ color: '#fff', fontWeight: '800', fontSize: 16 }}>₹1.2K</Text>
            <Text style={{ color: 'rgba(255,255,255,0.6)', fontSize: 10 }}>Wallet</Text>
          </View>
        </View>
      </View>

      <ScrollView contentContainerStyle={{ padding: 18 }}>
        <ProfileRow icon={<Wallet size={16} color={BRAND.primary} />} label="Wallet & payments" />
        <ProfileRow icon={<Shield size={16} color={BRAND.primary} />} label="Trust & verification" right="Verified" />
        <ProfileRow icon={<Banknote size={16} color={BRAND.primary} />} label="Referral — earn ₹100" badge="NEW" />
        <ProfileRow icon={<Bell size={16} color={BRAND.primary} />} label="Notifications" />
        <ProfileRow icon={<FileText size={16} color={BRAND.primary} />} label="Legal & support" />
      </ScrollView>
      <BottomBar active="profile" />
    </View>
  );
}

function ProfileRow({ icon, label, right, badge }: { icon: React.ReactNode; label: string; right?: string; badge?: string }) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, padding: 12, backgroundColor: BRAND.surface, borderRadius: 12, marginBottom: 8, borderWidth: 1, borderColor: BRAND.border }}>
      <View style={{ width: 34, height: 34, borderRadius: 17, backgroundColor: Colors.primaryLight, alignItems: 'center', justifyContent: 'center' }}>
        {icon}
      </View>
      <Text style={{ flex: 1, fontWeight: '600', color: BRAND.ink, fontSize: 13 }}>{label}</Text>
      {badge && (
        <View style={{ backgroundColor: BRAND.primary, paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 }}>
          <Text style={{ color: '#fff', fontSize: 9, fontWeight: '800' }}>{badge}</Text>
        </View>
      )}
      {right && <Text style={{ fontSize: 11, color: BRAND.success, fontWeight: '700' }}>{right}</Text>}
      <ChevronRight size={14} color={Colors.textTertiary} />
    </View>
  );
}

function AdminDashboard() {
  return (
    <View style={{ flex: 1 }}>
      <View style={{ paddingHorizontal: 18, paddingTop: 10, paddingBottom: 12, flexDirection: 'row', alignItems: 'center', gap: 10 }}>
        <View style={{ width: 36, height: 36, borderRadius: 10, backgroundColor: BRAND.ink, alignItems: 'center', justifyContent: 'center' }}>
          <Shield size={16} color={BRAND.primary} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={{ fontSize: 10, color: Colors.textSecondary, fontWeight: '700' }}>ADMIN</Text>
          <Text style={{ fontWeight: '800', color: BRAND.ink, fontSize: 15 }}>Operations Dashboard</Text>
        </View>
        <IconBtn badge><Bell size={16} color={BRAND.ink} /></IconBtn>
      </View>

      <ScrollView contentContainerStyle={{ padding: 16 }}>
        <View style={{ flexDirection: 'row', gap: 10, marginBottom: 12 }}>
          <MetricCard value="1,248" label="Active users" delta="+4.2%" positive />
          <MetricCard value="342" label="Live shipments" delta="+12" positive />
        </View>
        <View style={{ flexDirection: 'row', gap: 10, marginBottom: 16 }}>
          <MetricCard value="₹84K" label="Today revenue" delta="+18%" positive />
          <MetricCard value="7" label="KYC pending" delta="urgent" />
        </View>

        <View style={{ backgroundColor: BRAND.surface, borderRadius: 16, padding: 14, borderWidth: 1, borderColor: BRAND.border, marginBottom: 14 }}>
          <Text style={{ fontWeight: '700', color: BRAND.ink, marginBottom: 10 }}>Weekly volume</Text>
          <View style={{ flexDirection: 'row', gap: 8, alignItems: 'flex-end', height: 100 }}>
            {[30, 55, 40, 70, 90, 65, 80].map((h, i) => (
              <View key={i} style={{ flex: 1, gap: 4, alignItems: 'center' }}>
                <View
                  style={{
                    width: '100%',
                    height: `${h}%`,
                    backgroundColor: i === 4 ? BRAND.primary : Colors.primaryLight,
                    borderRadius: 6,
                  }}
                />
                <Text style={{ fontSize: 9, color: Colors.textTertiary }}>
                  {['M', 'T', 'W', 'T', 'F', 'S', 'S'][i]}
                </Text>
              </View>
            ))}
          </View>
        </View>

        <Text style={{ fontWeight: '700', color: BRAND.ink, marginBottom: 10 }}>Needs attention</Text>
        <AdminRow icon={<AlertCircle size={16} color={Colors.warning} />} bg={Colors.warningLight} title="3 disputes open" subtitle="Avg age: 2h 14m" />
        <AdminRow icon={<Users size={16} color={Colors.info} />} bg={Colors.infoLight} title="7 KYC reviews" subtitle="Oldest 3h waiting" />
        <AdminRow icon={<CreditCard size={16} color={BRAND.primary} />} bg={Colors.primaryLight} title="2 payout requests" subtitle="₹14,200 total" />
      </ScrollView>
    </View>
  );
}

function MetricCard({ value, label, delta, positive }: { value: string; label: string; delta: string; positive?: boolean }) {
  return (
    <View style={{ flex: 1, backgroundColor: BRAND.surface, borderRadius: 14, padding: 12, borderWidth: 1, borderColor: BRAND.border }}>
      <Text style={{ fontSize: 10, color: Colors.textSecondary, fontWeight: '700' }}>{label.toUpperCase()}</Text>
      <Text style={{ fontSize: 20, fontWeight: '800', color: BRAND.ink, marginTop: 4 }}>{value}</Text>
      <Text style={{ fontSize: 10, color: positive ? BRAND.success : BRAND.primary, fontWeight: '700', marginTop: 2 }}>
        {delta}
      </Text>
    </View>
  );
}

function AdminRow({ icon, bg, title, subtitle }: { icon: React.ReactNode; bg: string; title: string; subtitle: string }) {
  return (
    <View style={{ flexDirection: 'row', gap: 12, alignItems: 'center', padding: 12, backgroundColor: BRAND.surface, borderRadius: 12, borderWidth: 1, borderColor: BRAND.border, marginBottom: 8 }}>
      <View style={{ width: 34, height: 34, borderRadius: 10, backgroundColor: bg, alignItems: 'center', justifyContent: 'center' }}>
        {icon}
      </View>
      <View style={{ flex: 1 }}>
        <Text style={{ fontWeight: '700', color: BRAND.ink, fontSize: 13 }}>{title}</Text>
        <Text style={{ fontSize: 11, color: Colors.textSecondary }}>{subtitle}</Text>
      </View>
      <ChevronRight size={14} color={Colors.textTertiary} />
    </View>
  );
}

// ---------- Gallery ----------

type Section = { name: string; frames: FrameProps[] };

const SECTIONS: Section[] = [
  {
    name: 'Onboarding & Auth',
    frames: [
      { title: '01 · Splash', subtitle: 'First impression, brand moment', children: <SplashScreen /> },
      { title: '02 · Log in', subtitle: 'Email + social sign-in', children: <LoginScreen /> },
      { title: '03 · Role select', subtitle: 'Sender or Traveler', children: <RoleSelectScreen /> },
    ],
  },
  {
    name: 'Sender flow',
    frames: [
      { title: '04 · Home', subtitle: 'Dashboard · active shipments', children: <HomeScreen /> },
      { title: '05 · Create shipment', subtitle: '4-step wizard with AI hints', children: <CreateShipmentScreen /> },
      { title: '06 · Match travelers', subtitle: 'Ranked offers with trust', children: <MatchScreen /> },
      { title: '07 · Payment', subtitle: 'Escrow-secured checkout', children: <PaymentScreen /> },
      { title: '08 · Tracking', subtitle: 'Live map + timeline', children: <TrackingScreen /> },
      { title: '09 · Review', subtitle: 'Rating + tags + feedback', children: <ReviewScreen /> },
    ],
  },
  {
    name: 'Traveler flow',
    frames: [
      { title: '10 · Earnings dashboard', subtitle: 'Weekly earnings & stats', children: <TravelerDashboard /> },
      { title: '11 · Handover', subtitle: 'QR + OTP secure pickup', children: <HandoverScreen /> },
    ],
  },
  {
    name: 'Shared',
    frames: [
      { title: '12 · Chat', subtitle: 'In-app messaging & docs', children: <ChatScreen /> },
      { title: '13 · KYC verify', subtitle: 'Aadhaar · selfie · bank', children: <KYCScreen /> },
      { title: '14 · Profile', subtitle: 'Identity, wallet, referrals', children: <ProfileScreen /> },
    ],
  },
  {
    name: 'Admin',
    frames: [
      { title: '15 · Admin dashboard', subtitle: 'Ops metrics & moderation', children: <AdminDashboard /> },
    ],
  },
];

export default function DesignsScreen() {
  const router = useRouter();
  const [filter, setFilter] = useState<string>('All');

  const filtered = useMemo(() => {
    if (filter === 'All') return SECTIONS;
    return SECTIONS.filter((s) => s.name === filter);
  }, [filter]);

  const tabs = ['All', ...SECTIONS.map((s) => s.name)];

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: BRAND.ink }} edges={['top']} testID="designs-screen">
      <Stack.Screen options={{ headerShown: false }} />

      <View style={{ paddingHorizontal: 20, paddingVertical: 14, flexDirection: 'row', alignItems: 'center', gap: 12 }}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.1)', alignItems: 'center', justifyContent: 'center' }}
          testID="designs-back"
        >
          <ChevronLeft size={20} color="#fff" />
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={{ color: 'rgba(255,255,255,0.6)', fontSize: 11, fontWeight: '700', letterSpacing: 1 }}>
            DESIGN SYSTEM · v1
          </Text>
          <Text style={{ color: '#fff', fontSize: 20, fontWeight: '800', letterSpacing: -0.5 }}>
            ParcelPeer Hi-Fi Screens
          </Text>
        </View>
        <Logo size={12} light />
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 10, gap: 8 }}
      >
        {tabs.map((t) => {
          const active = t === filter;
          return (
            <TouchableOpacity
              key={t}
              onPress={() => setFilter(t)}
              style={{
                paddingHorizontal: 14,
                paddingVertical: 8,
                borderRadius: 20,
                backgroundColor: active ? BRAND.primary : 'rgba(255,255,255,0.08)',
              }}
              testID={`filter-${t}`}
            >
              <Text style={{ color: '#fff', fontWeight: '700', fontSize: 12 }}>{t}</Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      <ScrollView contentContainerStyle={{ paddingBottom: 80 }} showsVerticalScrollIndicator={false}>
        {filtered.map((section) => (
          <View key={section.name} style={{ marginTop: 24 }}>
            <View style={{ paddingHorizontal: 20, marginBottom: 12, flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <View style={{ width: 4, height: 18, backgroundColor: BRAND.primary, borderRadius: 2 }} />
              <Text style={{ color: '#fff', fontWeight: '800', fontSize: 16 }}>{section.name}</Text>
              <Text style={{ color: 'rgba(255,255,255,0.4)', fontSize: 12 }}>· {section.frames.length} screens</Text>
            </View>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ paddingHorizontal: 20, gap: 22 }}
            >
              {section.frames.map((f, i) => (
                <PhoneFrame key={i} {...f} />
              ))}
            </ScrollView>
          </View>
        ))}

        <View style={{ padding: 24, alignItems: 'center', marginTop: 16 }}>
          <Logo size={16} light />
          <Text style={{ color: 'rgba(255,255,255,0.4)', fontSize: 11, marginTop: 8 }}>
            © 2026 ParcelPeer · Design kit
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  frameWrap: {
    width: FRAME_W,
    gap: 10,
  },
  labelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  labelDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: BRAND.primary,
  },
  labelTitle: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 13,
  },
  labelSub: {
    color: 'rgba(255,255,255,0.55)',
    fontSize: 11,
    marginTop: 1,
  },
  phone: {
    width: FRAME_W,
    height: FRAME_H,
    borderRadius: 40,
    backgroundColor: '#111',
    padding: 6,
    shadowColor: '#000',
    shadowOpacity: 0.5,
    shadowRadius: 30,
    shadowOffset: { width: 0, height: 16 },
    elevation: 20,
  },
  notch: {
    position: 'absolute',
    top: 12,
    alignSelf: 'center',
    width: 100,
    height: 26,
    borderRadius: 14,
    backgroundColor: '#000',
    zIndex: 10,
  },
  screen: {
    flex: 1,
    borderRadius: 34,
    overflow: 'hidden',
  },
});
