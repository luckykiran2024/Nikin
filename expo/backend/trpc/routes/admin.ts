import { createTRPCRouter, publicProcedure } from '../create-context';
import { db } from '../../db/store';

export const adminRouter = createTRPCRouter({
  getStats: publicProcedure
    .query(async () => {
      return db.getAdminStats();
    }),

  getAllUsers: publicProcedure
    .query(async () => {
      return db.getAllUsers();
    }),

  getAllShipments: publicProcedure
    .query(async () => {
      return db.getAllShipments();
    }),

  getAllPayments: publicProcedure
    .query(async () => {
      return db.getAllPayments();
    }),

  getAllKYCRequests: publicProcedure
    .query(async () => {
      return db.getAllKYCRequests();
    }),

  clearAllData: publicProcedure
    .mutation(async () => {
      db.clearAll();
      return { success: true, message: 'All data cleared' };
    }),
});
