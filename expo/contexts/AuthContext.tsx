import AsyncStorage from '@react-native-async-storage/async-storage';
import createContextHook from '@nkzw/create-context-hook';
import { useCallback, useEffect, useState } from 'react';
import { User, UserRole } from '@/types';
import { trpcClient } from '@/lib/trpc';
import {
  getSupabaseClient, isSupabaseConfigured, signInWithEmail,
  signUpWithEmail, signOut as supabaseSignOut, signInWithGoogle,
} from '@/lib/supabase';

const AUTH_STORAGE_KEY = 'parcel_auth_user';
type MemberRole = Exclude<UserRole, 'admin'>;
const SAFE_ROLES: MemberRole[] = ['sender', 'receiver', 'traveler'];
const isMemberRole = (value: unknown): value is MemberRole => SAFE_ROLES.includes(value as MemberRole);

export const [AuthProvider, useAuth] = createContextHook(() => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedRole, setSelectedRole] = useState<UserRole>('sender');
  const [authError, setAuthError] = useState<string | null>(null);

  const saveUser = useCallback(async (profile: User | null) => {
    setUser(profile);
    setSelectedRole(profile?.activeRole || 'sender');
    if (profile) await AsyncStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(profile));
    else await AsyncStorage.removeItem(AUTH_STORAGE_KEY);
  }, []);

  const fetchProfile = useCallback(async (authUser: { id: string; email?: string; app_metadata?: Record<string, unknown> }) => {
    let profile = await trpcClient.users.getById.query({ id: authUser.id });
    if (!profile) {
      const client = getSupabaseClient();
      const { data } = await client!.auth.getUser();
      const meta = data.user?.user_metadata || {};
      const name = typeof meta.name === 'string' ? meta.name : authUser.email?.split('@')[0] || 'User';
      const phone = typeof meta.phone === 'string' ? meta.phone : '';
      const signupRole = isMemberRole(meta.role) ? meta.role : 'sender';
      if (!phone || !authUser.email) throw new Error('Complete account registration before signing in');
      const result = await trpcClient.users.register.mutate({
        name, phone, email: authUser.email,
        roles: signupRole === 'traveler' ? ['traveler'] : ['sender', 'receiver'],
        activeRole: signupRole,
      });
      if (!result.success || !result.user) throw new Error(result.error || 'Could not create account');
      profile = result.user;
    }
    if (authUser.app_metadata?.role === 'admin') {
      profile = { ...profile, roles: [...new Set([...profile.roles, 'admin' as const])], activeRole: 'admin' };
    }
    await saveUser(profile);
    return profile;
  }, [saveUser]);

  useEffect(() => {
    let active = true;
    const load = async () => {
      try {
        // A cached profile is display data only; a live Supabase session is required.
        await AsyncStorage.multiRemove(['registered_users', 'auth_token']);
        const client = getSupabaseClient();
        if (!client) return;
        const { data: { user: authUser }, error } = await client.auth.getUser();
        if (!error && authUser && active) await fetchProfile(authUser);
      } catch (error) {
        console.warn('[Auth] Could not restore session:', error);
        if (active) await saveUser(null);
      } finally {
        if (active) setIsLoading(false);
      }
    };
    load();
    const subscription = getSupabaseClient()?.auth.onAuthStateChange((event) => {
      if (event === 'SIGNED_OUT') void saveUser(null);
    });
    return () => { active = false; subscription?.data.subscription.unsubscribe(); };
  }, [fetchProfile, saveUser]);

  const login = useCallback(async (emailOrPhone: string, password: string, role?: UserRole) => {
    setAuthError(null);
    try {
      if (!emailOrPhone.includes('@')) throw new Error('Sign in with your email address');
      const { user: authUser, session } = await signInWithEmail(emailOrPhone.trim(), password);
      if (!authUser || !session) throw new Error('Sign in failed');
      const profile = await fetchProfile(authUser);
      if (role && !profile.roles.includes(role)) throw new Error(`This account has no ${role} access`);
      return profile;
    } catch (error: any) {
      setAuthError(error.message);
      throw error;
    }
  }, [fetchProfile]);

  const signup = useCallback(async (name: string, phone: string, email: string, password: string, role: UserRole = 'sender') => {
    setAuthError(null);
    if (!isMemberRole(role)) throw new Error('This role cannot be selected at signup');
    try {
      const { user: authUser, session } = await signUpWithEmail(email, password, { name, phone, role });
      if (!authUser || !session) throw new Error('Confirm your email, then sign in to finish registration');
      return await fetchProfile(authUser);
    } catch (error: any) {
      setAuthError(error.message);
      throw error;
    }
  }, [fetchProfile]);

  const loginWithGoogle = useCallback(async (role?: UserRole) => {
    setAuthError(null);
    try {
      const result = await signInWithGoogle();
      const client = getSupabaseClient();
      const { data: { user: authUser } } = await client!.auth.getUser();
      if (!authUser || !result) throw new Error('Google sign-in failed');
      const profile = await fetchProfile(authUser);
      if (role && !profile.roles.includes(role)) throw new Error(`This account has no ${role} access`);
      return profile;
    } catch (error: any) {
      setAuthError(error.message);
      throw error;
    }
  }, [fetchProfile]);

  const logout = useCallback(async () => {
    await supabaseSignOut();
    await saveUser(null);
  }, [saveUser]);

  const switchRole = useCallback(async (role: UserRole) => {
    if (!user || !user.roles.includes(role)) throw new Error('Role unavailable');
    if (role === 'admin') throw new Error('Admin role cannot be selected here');
    const result = await trpcClient.users.switchRole.mutate({ id: user.id, role });
    if (!result.success || !result.user) throw new Error(result.error || 'Could not switch role');
    await saveUser(result.user);
  }, [user, saveUser]);

  const updateUser = useCallback(async (updates: Partial<User>) => {
    if (!user) throw new Error('Not authenticated');
    const { name, avatarUrl, address, vehicleDetails, isOnline } = updates;
    const result = await trpcClient.users.update.mutate({ id: user.id, name, avatarUrl, address, vehicleDetails, isOnline });
    if (!result.success || !result.user) throw new Error(result.error || 'Could not update profile');
    await saveUser(result.user);
  }, [user, saveUser]);

  const updateKYCStatus = useCallback(async (_status: User['kycStatus']) => {
    if (!user) throw new Error('Not authenticated');
    const profile = await trpcClient.users.getById.query({ id: user.id });
    if (profile) await saveUser(profile);
  }, [user, saveUser]);

  const verifyAadhaar = useCallback(async (_aadhaarNumber: string) => {
    throw new Error('Aadhaar verification is unavailable until a real provider is connected');
  }, []);

  const becomeTraveler = useCallback(async () => {
    if (!user) throw new Error('Not authenticated');
    const result = await trpcClient.users.becomeTraveler.mutate({ id: user.id });
    if (!result.success || !result.user) throw new Error(result.error || 'Could not become a traveler');
    await saveUser(result.user);
    return result.user;
  }, [user, saveUser]);

  const isAdmin = user?.activeRole === 'admin';
  const isTraveler = user?.activeRole === 'traveler';
  const isSender = user?.activeRole === 'sender';
  return {
    user, isLoading, isAuthenticated: Boolean(user), selectedRole, setSelectedRole,
    login, loginWithGoogle, signup, logout, switchRole, becomeTraveler,
    updateKYCStatus, updateUser, verifyAadhaar,
    isAdmin, isTraveler, isSender,
    needsKYC: (isTraveler || isSender) && user?.kycStatus !== 'approved',
    needsAadhaarVerification: isSender && !user?.aadhaarVerified,
    authError, clearAuthError: () => setAuthError(null),
    isSupabaseEnabled: isSupabaseConfigured(),
  };
});
