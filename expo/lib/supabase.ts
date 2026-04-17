import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { Platform } from 'react-native';
import * as WebBrowser from 'expo-web-browser';
import * as Linking from 'expo-linking';

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || '';

const checkSupabaseConfigured = (): boolean => {
  return Boolean(
    supabaseUrl && 
    supabaseAnonKey && 
    supabaseUrl !== 'https://your-project-id.supabase.co' &&
    supabaseAnonKey !== 'your-anon-key-here'
  );
};

let supabaseClient: SupabaseClient | null = null;

export const getSupabaseClient = (): SupabaseClient | null => {
  if (!checkSupabaseConfigured()) {
    console.log('[Supabase] Not configured - missing URL or key');
    return null;
  }
  
  if (!supabaseClient) {
    supabaseClient = createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        storage: AsyncStorage,
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: Platform.OS === 'web',
      },
    });
    console.log('[Supabase] Client initialized');
  }
  
  return supabaseClient;
};

export const supabase = getSupabaseClient() || createClient('https://placeholder.supabase.co', 'placeholder-key', {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: Platform.OS === 'web',
  },
});

export const isSupabaseConfigured = (): boolean => checkSupabaseConfigured();

export const initSupabaseAuth = async () => {
  if (!checkSupabaseConfigured()) {
    console.log('[Supabase Auth] Skipping - Supabase not configured');
    return null;
  }
  
  try {
    const client = getSupabaseClient();
    if (!client) return null;
    
    const { data: { session }, error } = await client.auth.getSession();
    if (error) {
      console.error('[Supabase Auth] Error getting session:', error.message);
      return null;
    }
    
    console.log('[Supabase Auth] Session loaded:', session ? 'active' : 'none');
    return session;
  } catch (error) {
    console.error('[Supabase Auth] Init error:', error);
    return null;
  }
};

export const signUpWithEmail = async (email: string, password: string) => {
  if (!checkSupabaseConfigured()) {
    throw new Error('Supabase not configured');
  }
  
  const client = getSupabaseClient();
  if (!client) throw new Error('Supabase client not available');
  
  const { data, error } = await client.auth.signUp({
    email,
    password,
  });
  
  if (error) throw error;
  return data;
};

export const signInWithEmail = async (email: string, password: string) => {
  if (!checkSupabaseConfigured()) {
    throw new Error('Supabase not configured');
  }
  
  const client = getSupabaseClient();
  if (!client) throw new Error('Supabase client not available');
  
  const { data, error } = await client.auth.signInWithPassword({
    email,
    password,
  });
  
  if (error) throw error;
  return data;
};

export const signInWithPhone = async (phone: string) => {
  if (!checkSupabaseConfigured()) {
    throw new Error('Supabase not configured');
  }
  
  const client = getSupabaseClient();
  if (!client) throw new Error('Supabase client not available');
  
  const { data, error } = await client.auth.signInWithOtp({
    phone,
  });
  
  if (error) throw error;
  return data;
};

export const verifyPhoneOTP = async (phone: string, token: string) => {
  if (!checkSupabaseConfigured()) {
    throw new Error('Supabase not configured');
  }
  
  const client = getSupabaseClient();
  if (!client) throw new Error('Supabase client not available');
  
  const { data, error } = await client.auth.verifyOtp({
    phone,
    token,
    type: 'sms',
  });
  
  if (error) throw error;
  return data;
};

export const signInWithGoogle = async () => {
  if (!checkSupabaseConfigured()) {
    throw new Error('Supabase not configured');
  }

  const client = getSupabaseClient();
  if (!client) throw new Error('Supabase client not available');

  if (Platform.OS === 'web') {
    const redirectTo = typeof window !== 'undefined' ? window.location.origin : undefined;
    const { data, error } = await client.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo },
    });
    if (error) throw error;
    return data;
  }

  const redirectTo = Linking.createURL('/auth/callback');
  console.log('[Supabase] Google OAuth redirectTo:', redirectTo);

  const { data, error } = await client.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo,
      skipBrowserRedirect: true,
    },
  });
  if (error) throw error;
  if (!data?.url) throw new Error('No OAuth URL returned');

  const result = await WebBrowser.openAuthSessionAsync(data.url, redirectTo);
  if (result.type !== 'success' || !result.url) {
    throw new Error('Google sign-in was cancelled');
  }

  const parsed = Linking.parse(result.url);
  const params = (parsed.queryParams || {}) as Record<string, string | undefined>;
  let access_token = params.access_token;
  let refresh_token = params.refresh_token;

  if ((!access_token || !refresh_token) && result.url.includes('#')) {
    const hash = result.url.split('#')[1] ?? '';
    const hashParams = new URLSearchParams(hash);
    access_token = access_token || hashParams.get('access_token') || undefined;
    refresh_token = refresh_token || hashParams.get('refresh_token') || undefined;
  }

  if (!access_token || !refresh_token) {
    throw new Error('Missing tokens from Google sign-in');
  }

  const { data: sessionData, error: sessionError } = await client.auth.setSession({
    access_token,
    refresh_token,
  });
  if (sessionError) throw sessionError;
  return sessionData;
};

export const signOut = async () => {
  if (!checkSupabaseConfigured()) {
    return;
  }
  
  const client = getSupabaseClient();
  if (!client) return;
  
  const { error } = await client.auth.signOut();
  if (error) throw error;
};

export const getCurrentUser = async () => {
  if (!checkSupabaseConfigured()) {
    return null;
  }
  
  const client = getSupabaseClient();
  if (!client) return null;
  
  const { data: { user }, error } = await client.auth.getUser();
  if (error) {
    console.error('[Supabase] Error getting user:', error.message);
    return null;
  }
  
  return user;
};

export const onAuthStateChange = (callback: (event: string, session: any) => void) => {
  if (!checkSupabaseConfigured()) {
    return { data: { subscription: { unsubscribe: () => {} } } };
  }
  
  const client = getSupabaseClient();
  if (!client) {
    return { data: { subscription: { unsubscribe: () => {} } } };
  }
  
  return client.auth.onAuthStateChange(callback);
};

export const testSupabaseConnection = async (): Promise<{ connected: boolean; message: string; details?: Record<string, unknown> }> => {
  console.log('[Supabase] Testing connection...');
  
  const url = process.env.EXPO_PUBLIC_SUPABASE_URL || '';
  const key = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || '';
  
  console.log('[Supabase] URL configured:', url ? url.substring(0, 30) + '...' : 'NOT SET');
  console.log('[Supabase] Key configured:', key ? 'SET (length: ' + key.length + ')' : 'NOT SET');
  
  if (!checkSupabaseConfigured()) {
    return {
      connected: false,
      message: 'Supabase not configured - missing or invalid URL/key',
      details: {
        urlSet: Boolean(url),
        keySet: Boolean(key),
        urlValid: url && url !== 'https://your-project-id.supabase.co',
        keyValid: key && key !== 'your-anon-key-here' && key.length > 20,
      }
    };
  }
  
  try {
    const client = getSupabaseClient();
    if (!client) {
      return {
        connected: false,
        message: 'Failed to create Supabase client',
      };
    }
    
    // Test connection by checking if we can reach the database
    const startTime = Date.now();
    const { error } = await client.from('users').select('id').limit(1);
    const responseTime = Date.now() - startTime;
    
    if (error) {
      // Check if it's a "relation does not exist" error (tables not created yet)
      if (error.message.includes('does not exist') || error.code === '42P01') {
        return {
          connected: true,
          message: 'Connected to Supabase, but tables not created yet. Run the migrations.',
          details: {
            responseTime: `${responseTime}ms`,
            tablesExist: false,
            errorCode: error.code,
          }
        };
      }
      
      return {
        connected: false,
        message: `Database error: ${error.message}`,
        details: {
          errorCode: error.code,
          errorHint: error.hint,
        }
      };
    }
    
    console.log('[Supabase] Connection successful!');
    return {
      connected: true,
      message: 'Successfully connected to Supabase!',
      details: {
        responseTime: `${responseTime}ms`,
        tablesExist: true,
      }
    };
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : 'Unknown error';
    console.error('[Supabase] Connection test failed:', errorMessage);
    return {
      connected: false,
      message: `Connection failed: ${errorMessage}`,
    };
  }
};

export type Database = {
  public: {
    Tables: {
      users: {
        Row: {
          id: string;
          name: string;
          email: string;
          phone: string;
          roles: string[];
          avatar_url: string | null;
          rating: number;
          total_deliveries: number;
          total_shipments: number;
          is_verified: boolean;
          kyc_status: string;
          bank_account_number: string | null;
          bank_ifsc: string | null;
          bank_account_holder: string | null;
          upi_id: string | null;
          created_at: string;
        };
        Insert: Omit<Database['public']['Tables']['users']['Row'], 'id' | 'created_at'>;
        Update: Partial<Database['public']['Tables']['users']['Insert']>;
      };
      shipments: {
        Row: {
          id: string;
          parcel_request_id: string;
          sender_id: string;
          assigned_traveler_id: string | null;
          title: string;
          description: string | null;
          category: string;
          weight: number;
          dimensions: Record<string, number> | null;
          pickup_address: string;
          pickup_city: string;
          pickup_pincode: string;
          destination_address: string;
          destination_city: string;
          destination_pincode: string;
          sender_name: string | null;
          sender_phone: string | null;
          receiver_name: string | null;
          receiver_phone: string | null;
          preferred_date: string | null;
          flexible_dates: boolean;
          budget_min: number | null;
          budget_max: number | null;
          images: string[] | null;
          parcel_image: string | null;
          status: string;
          quotes_count: number;
          accepted_quote_id: string | null;
          final_price: number | null;
          pickup_otp: string | null;
          delivery_otp: string | null;
          pickup_verified: boolean;
          delivery_verified: boolean;
          traveler_transport_mode: string | null;
          traveler_expected_delivery: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database['public']['Tables']['shipments']['Row'], 'id' | 'parcel_request_id' | 'created_at' | 'updated_at' | 'quotes_count' | 'pickup_otp' | 'delivery_otp'>;
        Update: Partial<Database['public']['Tables']['shipments']['Insert']>;
      };
      quotes: {
        Row: {
          id: string;
          shipment_id: string;
          traveler_id: string;
          price: number;
          estimated_delivery: string;
          message: string | null;
          status: string;
          created_at: string;
        };
        Insert: Omit<Database['public']['Tables']['quotes']['Row'], 'id' | 'created_at'>;
        Update: Partial<Database['public']['Tables']['quotes']['Insert']>;
      };
      travel_routes: {
        Row: {
          id: string;
          traveler_id: string;
          from_city: string;
          to_city: string;
          travel_date: string;
          available_capacity: number;
          price_per_kg: number;
          is_active: boolean;
          created_at: string;
        };
        Insert: Omit<Database['public']['Tables']['travel_routes']['Row'], 'id' | 'created_at'>;
        Update: Partial<Database['public']['Tables']['travel_routes']['Insert']>;
      };
      payments: {
        Row: {
          id: string;
          shipment_id: string;
          sender_id: string;
          traveler_id: string;
          amount: number;
          platform_fee: number;
          traveler_payout: number;
          status: string;
          payment_method: string | null;
          transaction_id: string | null;
          razorpay_order_id: string | null;
          razorpay_payment_id: string | null;
          payout_status: string;
          payout_transaction_id: string | null;
          created_at: string;
        };
        Insert: Omit<Database['public']['Tables']['payments']['Row'], 'id' | 'created_at'>;
        Update: Partial<Database['public']['Tables']['payments']['Insert']>;
      };
      kyc_requests: {
        Row: {
          id: string;
          user_id: string;
          document_type: string;
          document_number: string;
          document_front_image: string;
          document_back_image: string | null;
          selfie_image: string;
          status: string;
          rejection_reason: string | null;
          reviewed_by: string | null;
          submitted_at: string;
          reviewed_at: string | null;
        };
        Insert: Omit<Database['public']['Tables']['kyc_requests']['Row'], 'id' | 'submitted_at'>;
        Update: Partial<Database['public']['Tables']['kyc_requests']['Insert']>;
      };
      chat_conversations: {
        Row: {
          id: string;
          shipment_id: string;
          participants: string[];
          is_active: boolean;
          unread_count: Record<string, number>;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database['public']['Tables']['chat_conversations']['Row'], 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Database['public']['Tables']['chat_conversations']['Insert']>;
      };
      chat_messages: {
        Row: {
          id: string;
          conversation_id: string;
          sender_id: string;
          content: string;
          message_type: string;
          read: boolean;
          timestamp: string;
        };
        Insert: Omit<Database['public']['Tables']['chat_messages']['Row'], 'id' | 'timestamp'>;
        Update: Partial<Database['public']['Tables']['chat_messages']['Insert']>;
      };
      notifications: {
        Row: {
          id: string;
          user_id: string;
          title: string;
          message: string;
          type: string;
          data: Record<string, unknown> | null;
          read: boolean;
          created_at: string;
        };
        Insert: Omit<Database['public']['Tables']['notifications']['Row'], 'id' | 'created_at'>;
        Update: Partial<Database['public']['Tables']['notifications']['Insert']>;
      };
      escalated_tickets: {
        Row: {
          id: string;
          ticket_number: string;
          shipment_id: string | null;
          user_id: string;
          category: string;
          priority: string;
          subject: string;
          description: string;
          status: string;
          assigned_to: string | null;
          resolution: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database['public']['Tables']['escalated_tickets']['Row'], 'id' | 'ticket_number' | 'created_at' | 'updated_at'>;
        Update: Partial<Database['public']['Tables']['escalated_tickets']['Insert']>;
      };
    };
  };
};
