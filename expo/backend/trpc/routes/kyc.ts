import { z } from 'zod';
import { TRPCError } from '@trpc/server';
import type { KYCRequest } from '@/types';
import { createTRPCRouter, protectedProcedure, adminProcedure } from '../create-context';
import { database as db } from '../../db';

export const kycRouter = createTRPCRouter({
  submit: protectedProcedure
    .input(z.object({
      userId: z.string(),
      userName: z.string(),
      userEmail: z.string(),
      userPhone: z.string(),
      userRole: z.enum(['sender', 'traveler', 'receiver', 'admin']),
      avatar: z.string().optional(),
      aadhaarNumber: z.string(),
      panNumber: z.string(),
      passportNumber: z.string().optional(),
      drivingLicenseNumber: z.string().optional(),
      selfieUploaded: z.boolean(),
      bankAccountNumber: z.string().optional(),
      bankIfsc: z.string().optional(),
      bankAccountHolder: z.string().optional(),
      bankVerified: z.boolean().optional(),
    }))
    .mutation(() => {
      return { success: false as boolean, error: 'KYC submissions are unavailable until verified document capture and provider checks are implemented', kyc: null as KYCRequest | null };
    }),

  getById: protectedProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ input, ctx }) => {
      const request = await Promise.resolve(db.getKYCRequestById(input.id));
      if (request && !ctx.user.isAdmin && request.userId !== ctx.user.id) throw new TRPCError({ code: 'FORBIDDEN' });
      return request || null;
    }),

  getByUserId: protectedProcedure
    .input(z.object({ userId: z.string() }))
    .query(async ({ input, ctx }) => {
      if (!ctx.user.isAdmin && input.userId !== ctx.user.id) throw new TRPCError({ code: 'FORBIDDEN' });
      return (await Promise.resolve(db.getKYCRequestByUserId(input.userId))) || null;
    }),

  getPending: adminProcedure
    .query(async () => {
      return await Promise.resolve(db.getPendingKYCRequests());
    }),

  getAll: adminProcedure
    .query(async () => {
      return await Promise.resolve(db.getAllKYCRequests());
    }),

  approve: adminProcedure
    .input(z.object({ id: z.string() }))
    .mutation(() => ({ success: false as const, error: 'KYC approval is unavailable until document and identity checks are verified' })),

  reject: adminProcedure
    .input(z.object({
      id: z.string(),
      reason: z.string().optional(),
    }))
    .mutation(async ({ input }) => {
      const kyc = await Promise.resolve(db.getKYCRequestById(input.id));
      if (!kyc) {
        return { success: false, error: 'KYC request not found' };
      }

      const updatedKyc = await Promise.resolve(db.updateKYCRequest(input.id, {
        status: 'rejected',
        reviewedAt: new Date().toISOString(),
        rejectionReason: input.reason,
      }));

      await Promise.resolve(db.updateUser(kyc.userId, { kycStatus: 'rejected' }));

      await Promise.resolve(db.createNotification({
        userId: kyc.userId,
        title: 'KYC Rejected',
        message: input.reason || 'Your KYC verification was not approved. Please resubmit with correct documents.',
        type: 'kyc',
        data: { kycId: kyc.id },
      }));

      return { success: true, kyc: updatedKyc };
    }),

  cancel: protectedProcedure
    .input(z.object({ userId: z.string().optional(), id: z.string().optional() }).refine(v => v.userId || v.id, { message: 'userId or id required' }))
    .mutation(() => {
      return { success: false as const, error: 'KYC cancellation is unavailable until the workflow is redesigned' };
    }),
});
