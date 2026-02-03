import { z } from 'zod';
import { createTRPCRouter, publicProcedure } from '../create-context';
import { db } from '../../db/store';

export const notificationsRouter = createTRPCRouter({
  create: publicProcedure
    .input(z.object({
      userId: z.string(),
      title: z.string(),
      message: z.string(),
      type: z.enum(['quote', 'shipment', 'payment', 'kyc', 'system', 'chat', 'tracking']),
      data: z.record(z.string(), z.any()).optional(),
      actionUrl: z.string().optional(),
    }))
    .mutation(async ({ input }) => {
      const notification = db.createNotification(input);
      return { success: true, notification };
    }),

  getByUserId: publicProcedure
    .input(z.object({ userId: z.string() }))
    .query(async ({ input }) => {
      return db.getNotificationsByUserId(input.userId);
    }),

  markAsRead: publicProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ input }) => {
      const notification = db.markNotificationAsRead(input.id);
      if (!notification) {
        return { success: false, error: 'Notification not found' };
      }
      return { success: true, notification };
    }),

  markAllAsRead: publicProcedure
    .input(z.object({ userId: z.string() }))
    .mutation(async ({ input }) => {
      const notifications = db.getNotificationsByUserId(input.userId);
      notifications.forEach(n => {
        if (!n.read) {
          db.markNotificationAsRead(n.id);
        }
      });
      return { success: true };
    }),
});
