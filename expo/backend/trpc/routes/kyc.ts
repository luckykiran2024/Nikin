import { z } from 'zod';
import { createTRPCRouter, publicProcedure } from '../create-context';
import { database as db } from '../../db';

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
      bankAccountNumber: z.string().optional(),
      bankIfsc: z.string().optional(),
      bankAccountHolder: z.string().optional(),
      bankVerified: z.boolean().optional(),
    }))
    .mutation(async ({ input }) => {
      const existingPending = await Promise.resolve(db.getPendingKYCRequestByUserId(input.userId));
      if (existingPending) {
        return { success: false, error: 'You already have a pending KYC request' };
      }

      const kyc = await Promise.resolve(db.createKYCRequest(input));

      await Promise.resolve(db.updateUser(input.userId, { kycStatus: 'pending' }));

      await Promise.resolve(db.createNotification({
        userId: input.userId,
        title: 'KYC Submitted',
        message: 'Your KYC documents have been submitted for verification. This usually takes 24-48 hours.',
        type: 'kyc',
        data: { kycId: kyc.id },
      }));

      return { success: true, kyc };
    }),

  getById: publicProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ input }) => {
      return (await Promise.resolve(db.getKYCRequestById(input.id))) || null;
    }),

  getByUserId: publicProcedure
    .input(z.object({ userId: z.string() }))
    .query(async ({ input }) => {
      return (await Promise.resolve(db.getKYCRequestByUserId(input.userId))) || null;
    }),

  getPending: publicProcedure
    .query(async () => {
      return await Promise.resolve(db.getPendingKYCRequests());
    }),

  getAll: publicProcedure
    .query(async () => {
      return await Promise.resolve(db.getAllKYCRequests());
    }),

  approve: publicProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ input }) => {
      const kyc = await Promise.resolve(db.getKYCRequestById(input.id));
      if (!kyc) {
        return { success: false, error: 'KYC request not found' };
      }

      const updatedKyc = await Promise.resolve(db.updateKYCRequest(input.id, {
        status: 'approved',
        reviewedAt: new Date().toISOString(),
      }));

      await Promise.resolve(db.updateUser(kyc.userId, {
        kycStatus: 'approved',
        aadhaarVerified: true,
        aadhaarNumber: kyc.aadhaarNumber,
        panVerified: true,
        bankVerified: kyc.bankVerified ?? true,
        bankAccountNumber: kyc.bankAccountNumber,
        bankIfsc: kyc.bankIfsc,
        bankAccountHolder: kyc.bankAccountHolder,
      }));

      await Promise.resolve(db.createNotification({
        userId: kyc.userId,
        title: 'KYC Approved!',
        message: 'Congratulations! Your KYC verification has been approved. You can now use all features.',
        type: 'kyc',
        data: { kycId: kyc.id },
      }));

      return { success: true, kyc: updatedKyc };
    }),

  reject: publicProcedure
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

  cancel: publicProcedure
    .input(z.object({ userId: z.string().optional(), id: z.string().optional() }).refine(v => v.userId || v.id, { message: 'userId or id required' }))
    .mutation(async ({ input }) => {
      try {
        console.log('[kyc.cancel] input:', input);

        let targetUserId: string | undefined = input.userId;
        let foundKycId: string | undefined;

        if (input.id) {
          const kyc = await Promise.resolve(db.getKYCRequestById(input.id));
          if (kyc) {
            targetUserId = kyc.userId;
            foundKycId = kyc.id;
            try {
              const deleted = await Promise.resolve(db.deleteKYCRequest(kyc.id));
              console.log('[kyc.cancel] deleted by id:', deleted, 'id:', kyc.id);
            } catch (delErr: any) {
              console.log('[kyc.cancel] delete by id failed:', delErr?.message || delErr);
            }
          } else {
            console.log('[kyc.cancel] no KYC found for id:', input.id);
          }
        }

        if (targetUserId) {
          try {
            const count = await Promise.resolve(db.deleteKYCRequestsByUserId(targetUserId));
            console.log('[kyc.cancel] deleted all KYC for user:', targetUserId, 'count:', count);
          } catch (delAllErr: any) {
            console.log('[kyc.cancel] deleteKYCRequestsByUserId failed:', delAllErr?.message || delAllErr);
          }

          try {
            await Promise.resolve(db.updateUser(targetUserId, { kycStatus: 'not_submitted' }));
          } catch (updErr: any) {
            console.log('[kyc.cancel] updateUser failed:', updErr?.message || updErr);
          }

          try {
            await Promise.resolve(db.createNotification({
              userId: targetUserId,
              title: 'KYC Request Cancelled',
              message: 'Your pending KYC request has been cancelled. You can resubmit anytime.',
              type: 'kyc',
              data: foundKycId ? { kycId: foundKycId } : {},
            }));
          } catch (notifErr: any) {
            console.log('[kyc.cancel] createNotification failed:', notifErr?.message || notifErr);
          }
        } else {
          console.log('[kyc.cancel] no targetUserId resolved');
        }

        return { success: true };
      } catch (err: any) {
        console.log('[kyc.cancel] unexpected error:', err?.message || err);
        return { success: false, error: err?.message || 'Failed to cancel KYC request' };
      }
    }),
});
