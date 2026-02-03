import AsyncStorage from '@react-native-async-storage/async-storage';
import createContextHook from '@nkzw/create-context-hook';
import { useCallback, useEffect, useState } from 'react';
import { User, UserRole } from '@/types';
import { trpc } from '@/lib/trpc';

const AUTH_STORAGE_KEY = 'parcel_auth_user';

export const [AuthProvider, useAuth] = createContextHook(() => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [selectedRole, setSelectedRole] = useState<UserRole>('sender');

  const registerMutation = trpc.users.register.useMutation();
  const updateUserMutation = trpc.users.update.useMutation();
  const switchRoleMutation = trpc.users.switchRole.useMutation();

  useEffect(() => {
    loadUser();
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
    console.log('Logging in with:', emailOrPhone, 'as role:', role);
    await new Promise(resolve => setTimeout(resolve, 500));

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
      return adminUser;
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
      return loggedInUser;
    }

    throw new Error('Invalid credentials');
  }, []);

  const signup = useCallback(async (
    name: string, 
    phone: string, 
    email: string, 
    password: string,
    role: UserRole = 'sender'
  ) => {
    console.log('Signing up:', name, phone, email, 'as role:', role);

    if (role === 'admin') {
      throw new Error('Admin accounts cannot be created through signup');
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
    console.log('User registered in backend:', newUser.id);
    return newUser;
  }, [registerMutation]);

  const logout = useCallback(async () => {
    await AsyncStorage.removeItem(AUTH_STORAGE_KEY);
    setUser(null);
    setIsAuthenticated(false);
    setSelectedRole('sender');
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
  const needsKYC = isTraveler && user?.kycStatus !== 'approved';
  const needsAadhaarVerification = isSender && !user?.aadhaarVerified;

  return {
    user,
    isLoading,
    isAuthenticated,
    selectedRole,
    setSelectedRole,
    login,
    signup,
    logout,
    switchRole,
    updateKYCStatus,
    updateUser,
    verifyAadhaar,
    isAdmin,
    isTraveler,
    isSender,
    needsKYC,
    needsAadhaarVerification,
  };
});
