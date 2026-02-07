import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { Platform } from 'react-native';

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
