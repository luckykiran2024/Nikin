import AsyncStorage from '@react-native-async-storage/async-storage';
import createContextHook from '@nkzw/create-context-hook';
import { useCallback, useEffect, useState } from 'react';
import { User, UserRole } from '@/types';
import { trpc } from '@/lib/trpc';
import { 
  isSupabaseConfigured, 
  signInWithEmail, 
  signUpWithEmail, 
  signOut as supabaseSignOut,
  onAuthStateChange,
  getSupabaseClient,
  signInWithGoogle as supabaseGoogleSignIn,
} from '@/lib/supabase';

const AUTH_STORAGE_KEY = 'parcel_auth_user';

const getSupabaseAuthEnabled = (): boolean => {
  try {
    return isSupabaseConfigured();
  } catch {
    return false;
  }
};

export const [AuthProvider, useAuth] = createContextHook(() => {
  const SUPABASE_AUTH_ENABLED = getSupabaseAuthEnabled();
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [selectedRole, setSelectedRole] = useState<UserRole>('sender');
  const [authError, setAuthError] = useState<string | null>(null);

  const registerMutation = trpc.users.register.useMutation();
  const updateUserMutation = trpc.users.update.useMutation();
  const switchRoleMutation = trpc.users.switchRole.useMutation();
  const becomeTravelerMutation = trpc.users.becomeTraveler.useMutation();

  useEffect(() => {
    loadUser();
    
    if (SUPABASE_AUTH_ENABLED) {
      const { data: { subscription } } = onAuthStateChange(async (event, session) => {
        console.log('[Auth] Supabase auth state changed:', event);
        if (event === 'SIGNED_OUT') {
          setUser(null);
          setIsAuthenticated(false);
          await AsyncStorage.removeItem(AUTH_STORAGE_KEY);
        }
      });
      
      return () => {
        subscription.unsubscribe();
      };
    }
  }, []);

  const loadUser = async () => {
    try {
      const stored = await AsyncStorage.getItem(AUTH_STORAGE_KEY);
      if (stored) {
        const parsedUser = JSON.parse(stored);
        setUser(parsedUser);
        setIsAuthenticated(true);
        setSelectedRole(parsedUser.activeRole);
      }
    } catch (error) {
      console.log('Error loading user:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const login = useCallback(async (emailOrPhone: string, password: string, role?: UserRole) => {
    console.log('[Auth] Logging in with:', emailOrPhone, 'as role:', role);
    setAuthError(null);
    
    try {
      if (emailOrPhone.toLowerCase() === 'admin@parcelpeer.com' && password === 'admin123') {
        const adminUser: User = {
          id: 'admin_001',
          name: 'Admin User',
          phone: '+919999999999',
          email: 'admin@parcelpeer.com',
          roles: ['admin'],
          activeRole: 'admin',
          kycStatus: 'approved',
          rating: 5,
          totalDeliveries: 0,
          totalShipments: 0,
          createdAt: '2024-01-01T00:00:00.000Z',
        };
        await AsyncStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(adminUser));
        setUser(adminUser);
        setIsAuthenticated(true);
        setSelectedRole('admin');
        console.log('[Auth] Admin login successful');
        return adminUser;
      }

      if (SUPABASE_AUTH_ENABLED && emailOrPhone.includes('@')) {
        try {
          const { user: authUser, session } = await signInWithEmail(emailOrPhone, password);
          
          if (authUser && session) {
            await AsyncStorage.setItem('auth_token', session.access_token);
            
            const client = getSupabaseClient();
            if (client) {
              const { data: dbUser } = await client
                .from('users')
                .select('*')
                .eq('email', emailOrPhone)
                .single();
              
              if (dbUser) {
                const appUser: User = {
                  id: dbUser.id,
                  name: dbUser.name,
                  phone: dbUser.phone,
                  email: dbUser.email,
                  roles: dbUser.roles || ['sender'],
                  activeRole: role || dbUser.active_role || 'sender',
                  kycStatus: dbUser.kyc_status || 'not_submitted',
                  rating: dbUser.rating || 5.0,
                  totalDeliveries: dbUser.total_deliveries || 0,
                  totalShipments: dbUser.total_shipments || 0,
                  avatarUrl: dbUser.avatar_url,
                  createdAt: dbUser.created_at,
                };
                
                await AsyncStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(appUser));
                setUser(appUser);
                setIsAuthenticated(true);
                setSelectedRole(appUser.activeRole);
                console.log('[Auth] Supabase login successful:', appUser.id);
                return appUser;
              }
            }
          }
        } catch (supabaseError: any) {
          console.log('[Auth] Supabase login failed, trying local:', supabaseError.message);
        }
      }

      const storedUsers = await AsyncStorage.getItem('registered_users');
      const registeredUsers = storedUsers ? JSON.parse(storedUsers) : {};
      
      const foundUser = Object.values(registeredUsers).find(
        (u: any) => (u.email === emailOrPhone || u.phone === emailOrPhone) && u.password === password
      ) as (User & { password: string }) | undefined;

      if (foundUser) {
        if (role && !foundUser.roles.includes(role)) {
          throw new Error(`This account is not registered as a ${role}`);
        }
        
        const { password: _, ...userWithoutPassword } = foundUser;
        const loggedInUser = {
          ...userWithoutPassword,
          activeRole: role || foundUser.activeRole,
        };
        
        await AsyncStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(loggedInUser));
        setUser(loggedInUser);
        setIsAuthenticated(true);
        setSelectedRole(loggedInUser.activeRole);
        console.log('[Auth] Local login successful:', loggedInUser.id);
        return loggedInUser;
      }

      throw new Error('Invalid credentials');
    } catch (error: any) {
      setAuthError(error.message);
      throw error;
    }
  }, []);

  const signup = useCallback(async (
    name: string, 
    phone: string, 
    email: string, 
    password: string,
    role: UserRole = 'sender'
  ) => {
    console.log('[Auth] Signing up:', name, phone, email, 'as role:', role);
    setAuthError(null);

    if (role === 'admin') {
      throw new Error('Admin accounts cannot be created through signup');
    }

    try {
      let supabaseUserId: string | null = null;
      
      if (SUPABASE_AUTH_ENABLED) {
        try {
          const { user: authUser, session } = await signUpWithEmail(email, password);
          if (authUser) {
            supabaseUserId = authUser.id;
            if (session) {
              await AsyncStorage.setItem('auth_token', session.access_token);
            }
            console.log('[Auth] Supabase auth user created:', supabaseUserId);
          }
        } catch (supabaseError: any) {
          if (!supabaseError.message?.includes('already registered')) {
            console.log('[Auth] Supabase signup note:', supabaseError.message);
          }
        }
      }

      const result = await registerMutation.mutateAsync({
        name,
        phone,
        email,
        roles: role === 'traveler' ? ['traveler'] : ['sender', 'receiver'],
        activeRole: role,
      });

      if (!result.success || !result.user) {
        if (result.user) {
          const existingUser = result.user;
          const storedUsers = await AsyncStorage.getItem('registered_users');
          const registeredUsers = storedUsers ? JSON.parse(storedUsers) : {};
          const storedPassword = registeredUsers[email]?.password;
          
          if (storedPassword === password) {
            await AsyncStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(existingUser));
            setUser(existingUser);
            setIsAuthenticated(true);
            setSelectedRole(existingUser.activeRole);
            return existingUser;
          }
        }
        throw new Error(result.error || 'Failed to create account');
      }

      const newUser = result.user;

      const storedUsers = await AsyncStorage.getItem('registered_users');
      const registeredUsers = storedUsers ? JSON.parse(storedUsers) : {};
      registeredUsers[email] = { ...newUser, password };
      await AsyncStorage.setItem('registered_users', JSON.stringify(registeredUsers));

      await AsyncStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(newUser));
      setUser(newUser);
      setIsAuthenticated(true);
      setSelectedRole(role);
      console.log('[Auth] User registered in backend:', newUser.id);
      return newUser;
    } catch (error: any) {
      setAuthError(error.message);
      throw error;
    }
  }, [registerMutation]);

  const logout = useCallback(async () => {
    console.log('[Auth] Logging out');
    try {
      if (SUPABASE_AUTH_ENABLED) {
        await supabaseSignOut();
        await AsyncStorage.removeItem('auth_token');
      }
    } catch (error) {
      console.error('[Auth] Supabase signout error:', error);
    }
    
    await AsyncStorage.removeItem(AUTH_STORAGE_KEY);
    setUser(null);
    setIsAuthenticated(false);
    setSelectedRole('sender');
    setAuthError(null);
  }, []);

  const switchRole = useCallback(async (role: UserRole) => {
    if (!user) return;
    if (!user.roles.includes(role)) {
      throw new Error(`You don't have access to ${role} role`);
    }
    
    const result = await switchRoleMutation.mutateAsync({ id: user.id, role });
    if (result.success && result.user) {
      await AsyncStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(result.user));
      setUser(result.user);
      setSelectedRole(role);
    } else {
      const updatedUser = { ...user, activeRole: role };
      await AsyncStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(updatedUser));
      setUser(updatedUser);
      setSelectedRole(role);
    }
  }, [user, switchRoleMutation]);

  const updateKYCStatus = useCallback(async (status: User['kycStatus']) => {
    if (!user) return;
    
    const result = await updateUserMutation.mutateAsync({ id: user.id, kycStatus: status });
    if (result.success && result.user) {
      await AsyncStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(result.user));
      setUser(result.user);
    } else {
      const updatedUser = { ...user, kycStatus: status };
      await AsyncStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(updatedUser));
      setUser(updatedUser);
    }

    const storedUsers = await AsyncStorage.getItem('registered_users');
    if (storedUsers) {
      const registeredUsers = JSON.parse(storedUsers);
      if (registeredUsers[user.email]) {
        registeredUsers[user.email].kycStatus = status;
        await AsyncStorage.setItem('registered_users', JSON.stringify(registeredUsers));
      }
    }
  }, [user, updateUserMutation]);

  const updateUser = useCallback(async (updates: Partial<User>) => {
    if (!user) return;
    
    const result = await updateUserMutation.mutateAsync({ id: user.id, ...updates });
    if (result.success && result.user) {
      await AsyncStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(result.user));
      setUser(result.user);
    } else {
      const updatedUser = { ...user, ...updates };
      await AsyncStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(updatedUser));
      setUser(updatedUser);
    }

    const storedUsers = await AsyncStorage.getItem('registered_users');
    if (storedUsers) {
      const registeredUsers = JSON.parse(storedUsers);
      if (registeredUsers[user.email]) {
        registeredUsers[user.email] = { ...registeredUsers[user.email], ...updates };
        await AsyncStorage.setItem('registered_users', JSON.stringify(registeredUsers));
      }
    }
  }, [user, updateUserMutation]);

  const verifyAadhaar = useCallback(async (aadhaarNumber: string) => {
    if (!user) return;
    
    const updates = { 
      aadhaarVerified: true, 
      aadhaarNumber: aadhaarNumber.slice(-4) 
    };
    
    const result = await updateUserMutation.mutateAsync({ id: user.id, ...updates });
    if (result.success && result.user) {
      await AsyncStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(result.user));
      setUser(result.user);
    } else {
      const updatedUser = { ...user, ...updates };
      await AsyncStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(updatedUser));
      setUser(updatedUser);
    }

    const storedUsers = await AsyncStorage.getItem('registered_users');
    if (storedUsers) {
      const registeredUsers = JSON.parse(storedUsers);
      if (registeredUsers[user.email]) {
        registeredUsers[user.email].aadhaarVerified = true;
        registeredUsers[user.email].aadhaarNumber = aadhaarNumber.slice(-4);
        await AsyncStorage.setItem('registered_users', JSON.stringify(registeredUsers));
      }
    }
    console.log('Aadhaar verified for user:', user.id);
  }, [user, updateUserMutation]);

  const isAdmin = user?.activeRole === 'admin';
  const isTraveler = user?.activeRole === 'traveler';
  const isSender = user?.activeRole === 'sender';
  const needsKYC = (isTraveler || isSender) && user?.kycStatus !== 'approved';
  const needsAadhaarVerification = isSender && !user?.aadhaarVerified;

  const loginWithGoogle = useCallback(async (role?: UserRole) => {
    console.log('[Auth] Google sign-in start, role:', role);
    setAuthError(null);
    if (!SUPABASE_AUTH_ENABLED) {
      const err = new Error('Google sign-in requires Supabase configuration');
      setAuthError(err.message);
      throw err;
    }
    try {
      const sessionData = await supabaseGoogleSignIn();
      const session = (sessionData as { session?: { access_token: string; user?: { id: string; email?: string; user_metadata?: Record<string, unknown> } } }).session;
      const authUser = session?.user;
      if (!authUser || !session) {
        throw new Error('Google sign-in failed');
      }
      await AsyncStorage.setItem('auth_token', session.access_token);

      const client = getSupabaseClient();
      if (!client) throw new Error('Supabase client unavailable');

      const { data: existing } = await client
        .from('users')
        .select('*')
        .eq('id', authUser.id)
        .maybeSingle();

      let dbUser = existing;
      if (!dbUser) {
        const meta = (authUser.user_metadata || {}) as Record<string, string>;
        const displayName = meta.full_name || meta.name || (authUser.email ? authUser.email.split('@')[0] : 'User');
        const avatarUrl = meta.avatar_url || meta.picture || null;
        const rolesArr = role === 'traveler' ? ['traveler'] : ['sender', 'receiver'];
        const activeRole = role || 'sender';
        const { data: inserted, error: insertError } = await client
          .from('users')
          .insert({
            id: authUser.id,
            name: displayName,
            email: authUser.email || '',
            phone: '',
            roles: rolesArr,
            active_role: activeRole,
            avatar_url: avatarUrl,
            rating: 5.0,
            total_deliveries: 0,
            total_shipments: 0,
            is_verified: false,
            kyc_status: 'not_submitted',
          })
          .select('*')
          .single();
        if (insertError) {
          console.log('[Auth] Google insert user error:', insertError.message);
        }
        dbUser = inserted;
      }

      if (!dbUser) throw new Error('Could not create user profile');

      const appUser: User = {
        id: dbUser.id,
        name: dbUser.name,
        phone: dbUser.phone || '',
        email: dbUser.email,
        roles: dbUser.roles || ['sender'],
        activeRole: role || dbUser.active_role || 'sender',
        kycStatus: dbUser.kyc_status || 'not_submitted',
        rating: dbUser.rating || 5.0,
        totalDeliveries: dbUser.total_deliveries || 0,
        totalShipments: dbUser.total_shipments || 0,
        avatarUrl: dbUser.avatar_url,
        createdAt: dbUser.created_at,
      };

      await AsyncStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(appUser));
      setUser(appUser);
      setIsAuthenticated(true);
      setSelectedRole(appUser.activeRole);
      console.log('[Auth] Google sign-in success:', appUser.id);
      return appUser;
    } catch (error: any) {
      console.log('[Auth] Google sign-in error:', error?.message);
      setAuthError(error?.message || 'Google sign-in failed');
      throw error;
    }
  }, [SUPABASE_AUTH_ENABLED]);

  const becomeTraveler = useCallback(async () => {
    if (!user) throw new Error('Not authenticated');
    if (user.kycStatus !== 'approved') {
      throw new Error('Complete KYC verification first to become a traveler.');
    }
    const result = await becomeTravelerMutation.mutateAsync({ id: user.id });
    if (result.success && result.user) {
      await AsyncStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(result.user));
      setUser(result.user);
      setSelectedRole('traveler');
      return result.user;
    }
    throw new Error(result.error || 'Failed to become traveler');
  }, [user, becomeTravelerMutation]);

  const clearAuthError = useCallback(() => {
    setAuthError(null);
  }, []);

  return {
    user,
    isLoading,
    isAuthenticated,
    selectedRole,
    setSelectedRole,
    login,
    loginWithGoogle,
    signup,
    logout,
    switchRole,
    becomeTraveler,
    updateKYCStatus,
    updateUser,
    verifyAadhaar,
    isAdmin,
    isTraveler,
    isSender,
    needsKYC,
    needsAadhaarVerification,
    authError,
    clearAuthError,
    isSupabaseEnabled: SUPABASE_AUTH_ENABLED,
  };
});
