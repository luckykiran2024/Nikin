import { createTRPCRouter, adminProcedure } from '../create-context';
import { db } from '../../db/store';

export const adminRouter = createTRPCRouter({
  getStats: adminProcedure
    .query(async () => {
      return db.getAdminStats();
    }),

  getAllUsers: adminProcedure
    .query(async () => {
      return db.getAllUsers();
    }),

  getAllShipments: adminProcedure
    .query(async () => {
      return db.getAllShipments();
    }),

  getAllPayments: adminProcedure
    .query(async () => {
      return db.getAllPayments();
    }),

  getAllKYCRequests: adminProcedure
    .query(async () => {
      return db.getAllKYCRequests();
    }),

  clearAllData: adminProcedure
    .mutation(async () => {
      return { success: false, message: 'Data deletion is disabled until backups and audit controls are in place' };
    }),
});
