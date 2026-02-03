import { z } from 'zod';
import { createTRPCRouter, publicProcedure } from '../create-context';
import { db } from '../../db/store';

export const kycRouter = createTRPCRouter({
  submit: publicProcedure
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
    }))
    .mutation(async ({ input }) => {
      const existingPending = db.getPendingKYCRequestByUserId(input.userId);
      if (existingPending) {
        return { success: false, error: 'You already have a pending KYC request' };
      }

      const kyc = db.createKYCRequest(input);

      db.updateUser(input.userId, { kycStatus: 'pending' });

      db.createNotification({
        userId: input.userId,
        title: 'KYC Submitted',
        message: 'Your KYC documents have been submitted for verification. This usually takes 24-48 hours.',
        type: 'kyc',
        data: { kycId: kyc.id },
      });

      return { success: true, kyc };
    }),

  getById: publicProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ input }) => {
      return db.getKYCRequestById(input.id) || null;
    }),

  getByUserId: publicProcedure
    .input(z.object({ userId: z.string() }))
    .query(async ({ input }) => {
      return db.getKYCRequestByUserId(input.userId) || null;
    }),

  getPending: publicProcedure
    .query(async () => {
      return db.getPendingKYCRequests();
    }),

  getAll: publicProcedure
    .query(async () => {
      return db.getAllKYCRequests();
    }),

  approve: publicProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ input }) => {
      const kyc = db.getKYCRequestById(input.id);
      if (!kyc) {
        return { success: false, error: 'KYC request not found' };
      }

      const updatedKyc = db.updateKYCRequest(input.id, {
        status: 'approved',
        reviewedAt: new Date().toISOString(),
      });

      db.updateUser(kyc.userId, {
        kycStatus: 'approved',
        aadhaarVerified: true,
        aadhaarNumber: kyc.aadhaarNumber,
      });

      db.createNotification({
        userId: kyc.userId,
        title: 'KYC Approved!',
        message: 'Congratulations! Your KYC verification has been approved. You can now use all features.',
        type: 'kyc',
        data: { kycId: kyc.id },
      });

      return { success: true, kyc: updatedKyc };
    }),

  reject: publicProcedure
    .input(z.object({
      id: z.string(),
      reason: z.string().optional(),
    }))
    .mutation(async ({ input }) => {
      const kyc = db.getKYCRequestById(input.id);
      if (!kyc) {
        return { success: false, error: 'KYC request not found' };
      }

      const updatedKyc = db.updateKYCRequest(input.id, {
        status: 'rejected',
        reviewedAt: new Date().toISOString(),
        rejectionReason: input.reason,
      });

      db.updateUser(kyc.userId, { kycStatus: 'rejected' });

      db.createNotification({
        userId: kyc.userId,
        title: 'KYC Rejected',
        message: input.reason || 'Your KYC verification was not approved. Please resubmit with correct documents.',
        type: 'kyc',
        data: { kycId: kyc.id },
      });

      return { success: true, kyc: updatedKyc };
    }),

  cancel: publicProcedure
    .input(z.object({ userId: z.string() }))
    .mutation(async ({ input }) => {
      const kyc = db.getPendingKYCRequestByUserId(input.userId);
      if (!kyc) {
        return { success: false, error: 'No pending KYC request found' };
      }

      db.deleteKYCRequest(kyc.id);
      db.updateUser(input.userId, { kycStatus: 'not_submitted' });

      return { success: true };
    }),
});
