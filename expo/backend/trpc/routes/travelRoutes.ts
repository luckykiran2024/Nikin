import { z } from 'zod';
import { createTRPCRouter, protectedProcedure } from '../create-context';
import { db } from '../../db/store';

export const travelRoutesRouter = createTRPCRouter({
  create: protectedProcedure
    .input(z.object({
      travelerId: z.string(),
      travelerName: z.string(),
      fromCity: z.string(),
      toCity: z.string(),
      travelDate: z.string(),
      description: z.string().optional(),
    }))
    .mutation(async ({ input }) => {
      const route = db.createRoute(input);
      return { success: true, route };
    }),

  getById: protectedProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ input }) => {
      return db.getRouteById(input.id) || null;
    }),

  getByTravelerId: protectedProcedure
    .input(z.object({ travelerId: z.string() }))
    .query(async ({ input }) => {
      return db.getRoutesByTravelerId(input.travelerId);
    }),

  getAll: protectedProcedure
    .query(async () => {
      return db.getAllRoutes();
    }),

  delete: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ input }) => {
      const success = db.deleteRoute(input.id);
      return { success };
    }),

  getMatchingShipments: protectedProcedure
    .input(z.object({
      fromCity: z.string(),
      toCity: z.string(),
    }))
    .query(async ({ input }) => {
      return db.getAvailableShipments(input.fromCity, input.toCity);
    }),
});
