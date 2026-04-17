import { z } from 'zod';
import { createTRPCRouter, publicProcedure } from '../create-context';
import { db } from '../../db/store';

export const usersRouter = createTRPCRouter({
  register: publicProcedure
    .input(z.object({
      name: z.string().min(1),
      phone: z.string().min(10),
      email: z.string().email(),
      roles: z.array(z.enum(['sender', 'traveler', 'receiver', 'admin'])),
      activeRole: z.enum(['sender', 'traveler', 'receiver', 'admin']),
      gender: z.enum(['male', 'female', 'other', 'prefer_not_to_say']).optional(),
    }))
    .mutation(async ({ input }) => {
      const existingByPhone = db.getUserByPhone(input.phone);
      if (existingByPhone) {
        return { success: false, error: 'Phone number already registered', user: existingByPhone };
      }

      const existingByEmail = db.getUserByEmail(input.email);
      if (existingByEmail) {
        return { success: false, error: 'Email already registered', user: existingByEmail };
      }

      const user = db.createUser({
        ...input,
        kycStatus: 'not_submitted',
        rating: 5.0,
        totalDeliveries: 0,
        totalShipments: 0,
        isOnline: true,
        lastSeen: new Date().toISOString(),
        earnings: 0,
      });

      return { success: true, user };
    }),

  login: publicProcedure
    .input(z.object({
      phone: z.string().min(10),
    }))
    .query(async ({ input }) => {
      const user = db.getUserByPhone(input.phone);
      if (!user) {
        return { success: false, error: 'User not found' };
      }
      
      db.updateUser(user.id, { isOnline: true, lastSeen: new Date().toISOString() });
      return { success: true, user };
    }),

  getById: publicProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ input }) => {
      const user = db.getUserById(input.id);
      return user || null;
    }),

  getByPhone: publicProcedure
    .input(z.object({ phone: z.string() }))
    .query(async ({ input }) => {
      const user = db.getUserByPhone(input.phone);
      return user || null;
    }),

  update: publicProcedure
    .input(z.object({
      id: z.string(),
      name: z.string().optional(),
      email: z.string().email().optional(),
      activeRole: z.enum(['sender', 'traveler', 'receiver', 'admin']).optional(),
      roles: z.array(z.enum(['sender', 'traveler', 'receiver', 'admin'])).optional(),
      kycStatus: z.enum(['pending', 'approved', 'rejected', 'not_submitted']).optional(),
      avatarUrl: z.string().optional(),
      address: z.object({
        street: z.string(),
        city: z.string(),
        state: z.string(),
        pincode: z.string(),
        landmark: z.string().optional(),
      }).optional(),
      vehicleDetails: z.object({
        type: z.enum(['car', 'bike', 'train', 'flight', 'bus']),
        vehicleNumber: z.string().optional(),
        model: z.string().optional(),
        color: z.string().optional(),
      }).optional(),
      isOnline: z.boolean().optional(),
      earnings: z.number().optional(),
      totalDeliveries: z.number().optional(),
      totalShipments: z.number().optional(),
      rating: z.number().optional(),
    }))
    .mutation(async ({ input }) => {
      const { id, ...updates } = input;
      const user = db.updateUser(id, updates);
      if (!user) {
        return { success: false, error: 'User not found' };
      }
      return { success: true, user };
    }),

  getAll: publicProcedure
    .query(async () => {
      return db.getAllUsers();
    }),

  becomeTraveler: publicProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ input }) => {
      const user = db.getUserById(input.id);
      if (!user) return { success: false as const, error: 'User not found' };
      if (user.kycStatus !== 'approved') {
        return { success: false as const, error: 'KYC approval required to become a traveler' };
      }
      const roles = Array.from(new Set([...(user.roles || []), 'traveler' as const]));
      const updated = db.updateUser(input.id, { roles, activeRole: 'traveler' });
      return { success: true as const, user: updated };
    }),

  getRiskFlags: publicProcedure
    .input(z.object({ userId: z.string() }))
    .query(async ({ input }) => {
      return db.computeRiskFlags(input.userId);
    }),

  switchRole: publicProcedure
    .input(z.object({
      id: z.string(),
      role: z.enum(['sender', 'traveler', 'receiver', 'admin']),
    }))
    .mutation(async ({ input }) => {
      const user = db.getUserById(input.id);
      if (!user) {
        return { success: false, error: 'User not found' };
      }
      
      if (!user.roles.includes(input.role)) {
        return { success: false, error: 'User does not have this role' };
      }

      const updated = db.updateUser(input.id, { activeRole: input.role });
      return { success: true, user: updated };
    }),
});
