import { TRPCError } from '@trpc/server';
import { z } from 'zod';
import { createTRPCRouter, protectedProcedure, adminProcedure } from '../create-context';
import { db } from '../../db/store';

const role = z.enum(['sender', 'traveler', 'receiver']);
const ownUser = (actorId: string, targetId: string) => {
  if (actorId !== targetId) throw new TRPCError({ code: 'FORBIDDEN' });
};

export const usersRouter = createTRPCRouter({
  register: protectedProcedure
    .input(z.object({
      name: z.string().trim().min(1),
      phone: z.string().trim().min(10),
      email: z.string().email(),
      roles: z.array(role).min(1),
      activeRole: role,
      gender: z.enum(['male', 'female', 'other', 'prefer_not_to_say']).optional(),
    }))
    .mutation(({ input, ctx }) => {
      if (!ctx.user.email || input.email.toLowerCase() !== ctx.user.email.toLowerCase()) {
        throw new TRPCError({ code: 'FORBIDDEN', message: 'Email must match the authenticated account' });
      }
      if (!input.roles.includes(input.activeRole)) {
        throw new TRPCError({ code: 'BAD_REQUEST', message: 'Active role must be assigned' });
      }
      const existing = db.getUserById(ctx.user.id);
      if (existing) return { success: true, user: existing };
      if (db.getUserByPhone(input.phone) || db.getUserByEmail(input.email)) {
        return { success: false, error: 'Phone or email already registered' };
      }
      const user = db.createUser({
        ...input,
        id: ctx.user.id,
        kycStatus: 'not_submitted',
        rating: 5,
        totalDeliveries: 0,
        totalShipments: 0,
        isOnline: true,
        lastSeen: new Date().toISOString(),
        earnings: 0,
      });
      return { success: true, user };
    }),

  login: protectedProcedure
    .input(z.object({ phone: z.string().min(10) }))
    .query(({ input, ctx }) => {
      const user = db.getUserById(ctx.user.id);
      if (!user || user.phone !== input.phone) return { success: false, error: 'User not found' };
      db.updateUser(user.id, { isOnline: true, lastSeen: new Date().toISOString() });
      return { success: true, user };
    }),

  getById: protectedProcedure
    .input(z.object({ id: z.string() }))
    .query(({ input, ctx }) => {
      if (!ctx.user.isAdmin) ownUser(ctx.user.id, input.id);
      return db.getUserById(input.id) || null;
    }),

  getByPhone: protectedProcedure
    .input(z.object({ phone: z.string() }))
    .query(({ input, ctx }) => {
      const user = db.getUserByPhone(input.phone);
      if (user && !ctx.user.isAdmin) ownUser(ctx.user.id, user.id);
      return user || null;
    }),

  update: protectedProcedure
    .input(z.object({
      id: z.string(),
      name: z.string().trim().min(1).optional(),
      avatarUrl: z.string().url().optional(),
      address: z.object({
        street: z.string(), city: z.string(), state: z.string(),
        pincode: z.string(), landmark: z.string().optional(),
      }).optional(),
      vehicleDetails: z.object({
        type: z.enum(['car', 'bike', 'train', 'flight', 'bus']),
        vehicleNumber: z.string().optional(), model: z.string().optional(), color: z.string().optional(),
      }).optional(),
      isOnline: z.boolean().optional(),
    }))
    .mutation(({ input, ctx }) => {
      ownUser(ctx.user.id, input.id);
      const { id, ...updates } = input;
      const user = db.updateUser(id, updates);
      if (!user) return { success: false, error: 'User not found' };
      return { success: true, user };
    }),

  getAll: adminProcedure.query(() => db.getAllUsers()),

  becomeTraveler: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(({ input, ctx }) => {
      ownUser(ctx.user.id, input.id);
      const user = db.getUserById(input.id);
      if (!user) return { success: false as const, error: 'User not found' };
      if (user.kycStatus !== 'approved') {
        return { success: false as const, error: 'KYC approval required to become a traveler' };
      }
      const roles = Array.from(new Set([...(user.roles || []), 'traveler' as const]));
      const updated = db.updateUser(input.id, { roles, activeRole: 'traveler' });
      return { success: true as const, user: updated };
    }),

  getRiskFlags: protectedProcedure
    .input(z.object({ userId: z.string() }))
    .query(({ input, ctx }) => {
      if (!ctx.user.isAdmin) ownUser(ctx.user.id, input.userId);
      return db.computeRiskFlags(input.userId);
    }),

  switchRole: protectedProcedure
    .input(z.object({ id: z.string(), role }))
    .mutation(({ input, ctx }) => {
      ownUser(ctx.user.id, input.id);
      const user = db.getUserById(input.id);
      if (!user) return { success: false, error: 'User not found' };
      if (!user.roles.includes(input.role)) {
        return { success: false, error: 'User does not have this role' };
      }
      const updated = db.updateUser(input.id, { activeRole: input.role });
      return { success: true, user: updated };
    }),
});
