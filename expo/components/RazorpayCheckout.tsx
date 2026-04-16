import React, { useEffect, useMemo, useRef } from 'react';
import { Modal, Platform, StyleSheet, View, ActivityIndicator, Text, TouchableOpacity } from 'react-native';
import { WebView } from 'react-native-webview';
import { X } from 'lucide-react-native';
import Colors from '@/constants/colors';
import { PaymentMethod } from '@/types';

export interface RazorpayCheckoutProps {
  visible: boolean;
  keyId: string;
  orderId: string;
  amount: number;
  currency?: string;
  name: string;
  description: string;
  prefill?: { name?: string; email?: string; contact?: string };
  method?: PaymentMethod;
  onSuccess: (data: { razorpayPaymentId: string; razorpayOrderId: string; razorpaySignature: string }) => void;
  onDismiss: (reason?: string) => void;
}

function mapMethodToConfig(method?: PaymentMethod) {
  switch (method) {
    case 'upi':
      return { upi: true, card: false, netbanking: false, wallet: false, paylater: false, emi: false };
    case 'card':
      return { card: true, upi: false, netbanking: false, wallet: false, paylater: false, emi: false };
    case 'netbanking':
      return { netbanking: true, upi: false, card: false, wallet: false, paylater: false, emi: false };
    case 'wallet':
      return { wallet: true, upi: false, card: false, netbanking: false, paylater: false, emi: false };
    case 'paylater':
      return { paylater: true, upi: false, card: false, netbanking: false, wallet: false, emi: false };
    case 'emi':
      return { emi: true, card: true, upi: false, netbanking: false, wallet: false, paylater: false };
    default:
      return undefined;
  }
}

function buildCheckoutHtml(props: RazorpayCheckoutProps): string {
  const methodCfg = mapMethodToConfig(props.method);
  const options = {
    key: props.keyId,
    order_id: props.orderId,
    amount: props.amount,
    currency: props.currency || 'INR',
    name: props.name,
    description: props.description,
    prefill: props.prefill || {},
    theme: { color: Colors.primary },
    method: methodCfg,
  };

  return `<!DOCTYPE html>
<html>
<head>
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
<style>
  body { margin:0; padding:0; background:#0b0b0b; color:#fff; font-family:-apple-system,Roboto,sans-serif; height:100vh; display:flex; align-items:center; justify-content:center; }
  .box { text-align:center; padding:24px; }
  .spinner { width:36px; height:36px; border:3px solid rgba(255,255,255,0.2); border-top-color:#fff; border-radius:50%; animation: spin 0.8s linear infinite; margin:0 auto 12px; }
  @keyframes spin { to { transform: rotate(360deg); } }
</style>
</head>
<body>
<div class="box"><div class="spinner"></div><div>Opening secure checkout…</div></div>
<script src="https://checkout.razorpay.com/v1/checkout.js"></script>
<script>
  function post(msg){ if (window.ReactNativeWebView) { window.ReactNativeWebView.postMessage(JSON.stringify(msg)); } }
  try {
    var options = ${JSON.stringify(options)};
    options.handler = function(response) {
      post({ type: 'success', data: response });
    };
    options.modal = {
      ondismiss: function(){ post({ type: 'dismiss' }); },
      escape: true,
      backdropclose: false,
    };
    var rzp = new Razorpay(options);
    rzp.on('payment.failed', function (resp){ post({ type: 'failed', data: resp.error }); });
    setTimeout(function(){ rzp.open(); }, 200);
  } catch (e) {
    post({ type: 'error', message: String(e && e.message || e) });
  }
</script>
</body>
</html>`;
}

export default function RazorpayCheckout(props: RazorpayCheckoutProps) {
  const { visible, onSuccess, onDismiss } = props;
  const openedRef = useRef<boolean>(false);

  const html = useMemo(() => buildCheckoutHtml(props), [props]);

  useEffect(() => {
    if (Platform.OS !== 'web') return;
    if (!visible) { openedRef.current = false; return; }
    if (openedRef.current) return;
    openedRef.current = true;

    let cancelled = false;
    const loadScript = (): Promise<void> => new Promise((resolve, reject) => {
      if (typeof document === 'undefined') { reject(new Error('No DOM')); return; }
      const existing = document.getElementById('razorpay-checkout-js') as HTMLScriptElement | null;
      if (existing && (window as any).Razorpay) { resolve(); return; }
      const s = document.createElement('script');
      s.id = 'razorpay-checkout-js';
      s.src = 'https://checkout.razorpay.com/v1/checkout.js';
      s.onload = () => resolve();
      s.onerror = () => reject(new Error('Failed to load Razorpay'));
      document.body.appendChild(s);
    });

    (async () => {
      try {
        await loadScript();
        if (cancelled) return;
        const Razorpay = (window as any).Razorpay;
        if (!Razorpay) throw new Error('Razorpay not available');
        const methodCfg = mapMethodToConfig(props.method);
        const rzp = new Razorpay({
          key: props.keyId,
          order_id: props.orderId,
          amount: props.amount,
          currency: props.currency || 'INR',
          name: props.name,
          description: props.description,
          prefill: props.prefill || {},
          theme: { color: Colors.primary },
          method: methodCfg,
          handler: (response: any) => {
            onSuccess({
              razorpayPaymentId: response.razorpay_payment_id,
              razorpayOrderId: response.razorpay_order_id,
              razorpaySignature: response.razorpay_signature,
            });
          },
          modal: {
            ondismiss: () => onDismiss('dismiss'),
          },
        });
        rzp.on('payment.failed', (resp: any) => {
          console.log('[Razorpay web] payment.failed', resp?.error);
          onDismiss('failed');
        });
        rzp.open();
      } catch (e: any) {
        console.log('[Razorpay web] error', e?.message);
        onDismiss('error');
      }
    })();

    return () => { cancelled = true; };
  }, [visible, props, onSuccess, onDismiss]);

  if (Platform.OS === 'web') {
    return null;
  }

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={() => onDismiss('close')}>
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Secure Checkout</Text>
          <TouchableOpacity onPress={() => onDismiss('close')} style={styles.closeBtn} testID="rzp-close">
            <X size={22} color={Colors.text} />
          </TouchableOpacity>
        </View>
        <WebView
          originWhitelist={["*"]}
          source={{ html, baseUrl: 'https://checkout.razorpay.com' }}
          javaScriptEnabled
          domStorageEnabled
          startInLoadingState
          mixedContentMode="always"
          setSupportMultipleWindows={false}
          onMessage={(event) => {
            try {
              const msg = JSON.parse(event.nativeEvent.data);
              if (msg.type === 'success' && msg.data) {
                onSuccess({
                  razorpayPaymentId: msg.data.razorpay_payment_id,
                  razorpayOrderId: msg.data.razorpay_order_id,
                  razorpaySignature: msg.data.razorpay_signature,
                });
              } else if (msg.type === 'dismiss') {
                onDismiss('dismiss');
              } else if (msg.type === 'failed') {
                onDismiss('failed');
              } else if (msg.type === 'error') {
                console.log('[Razorpay] webview error', msg.message);
                onDismiss('error');
              }
            } catch (e) {
              console.log('[Razorpay] parse error', e);
            }
          }}
          renderLoading={() => (
            <View style={styles.loading}><ActivityIndicator size="large" color={Colors.primary} /></View>
          )}
        />
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: Platform.OS === 'ios' ? 54 : 16,
    paddingBottom: 12,
    backgroundColor: Colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  headerTitle: { fontSize: 16, fontWeight: '600' as const, color: Colors.text },
  closeBtn: { padding: 6 },
  loading: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, alignItems: 'center', justifyContent: 'center' },
});
