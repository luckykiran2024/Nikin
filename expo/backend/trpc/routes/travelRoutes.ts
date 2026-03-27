import { z } from 'zod';
import { createTRPCRouter, publicProcedure } from '../create-context';
import { db } from '../../db/store';

export const travelRoutesRouter = createTRPCRouter({
  create: publicProcedure
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

  getById: publicProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ input }) => {
      return db.getRouteById(input.id) || null;
    }),

  getByTravelerId: publicProcedure
    .input(z.object({ travelerId: z.string() }))
    .query(async ({ input }) => {
      return db.getRoutesByTravelerId(input.travelerId);
    }),

  getAll: publicProcedure
    .query(async () => {
      return db.getAllRoutes();
    }),

  delete: publicProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ input }) => {
      const success = db.deleteRoute(input.id);
      return { success };
    }),

  getMatchingShipments: publicProcedure
    .input(z.object({
      fromCity: z.string(),
      toCity: z.string(),
    }))
    .query(async ({ input }) => {
      return db.getAvailableShipments(input.fromCity, input.toCity);
    }),
});
