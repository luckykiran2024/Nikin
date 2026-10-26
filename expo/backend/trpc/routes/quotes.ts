import { z } from 'zod';
import { createTRPCRouter, protectedProcedure } from '../create-context';
import { db } from '../../db/store';
import { TRUST_LIMITS } from '@/constants/trustLimits';

export const quotesRouter = createTRPCRouter({
  create: protectedProcedure
    .input(z.object({
      shipmentId: z.string(),
      travelerId: z.string(),
      travelerName: z.string(),
      travelerRating: z.number(),
      travelerDeliveries: z.number(),
      amount: z.number(),
      estimatedDelivery: z.string(),
      message: z.string().optional(),
    }))
    .mutation(async ({ input, ctx }) => {
      if (input.travelerId !== ctx.user.id) return { success: false, error: 'Traveler does not match authenticated user' };
      const shipment = db.getShipmentById(input.shipmentId);
      if (!shipment) {
        return { success: false, error: 'Shipment not found' };
      }

      const existingQuotes = db.getQuotesForShipment(input.shipmentId);
      const alreadyQuoted = existingQuotes.some(q => q.travelerId === input.travelerId);
      if (alreadyQuoted) {
        return { success: false, error: 'You have already submitted a quote for this shipment' };
      }

      const quote = db.createQuote(input);

      db.createNotification({
        userId: shipment.senderId,
        title: 'New Quote Received',
        message: `${input.travelerName} has submitted a quote of ₹${input.amount} for your shipment.`,
        type: 'quote',
        data: { shipmentId: input.shipmentId, quoteId: quote.id },
      });

      return { success: true, quote };
    }),

  getById: protectedProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ input }) => {
      return db.getQuoteById(input.id) || null;
    }),

  getByShipmentId: protectedProcedure
    .input(z.object({ shipmentId: z.string() }))
    .query(async ({ input }) => {
      return db.getQuotesForShipment(input.shipmentId);
    }),

  getByTravelerId: protectedProcedure
    .input(z.object({ travelerId: z.string() }))
    .query(async ({ input }) => {
      return db.getQuotesByTravelerId(input.travelerId);
    }),

  getAll: protectedProcedure
    .query(async () => {
      return db.getAllQuotes();
    }),

  accept: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ input, ctx }) => {
      const quote = db.getQuoteById(input.id);
      if (!quote) {
        return { success: false, error: 'Quote not found' };
      }

      const shipment = db.getShipmentById(quote.shipmentId);
      if (!shipment || shipment.senderId !== ctx.user.id) {
        return { success: false, error: 'Shipment not found or access denied' };
      }

      if (shipment.status !== 'created' && shipment.status !== 'quoted') {
        return { success: false, error: 'This shipment already has an accepted quote' };
      }

      db.updateQuote(input.id, { status: 'accepted' });

      const allQuotes = db.getQuotesForShipment(quote.shipmentId);
      allQuotes.forEach(q => {
        if (q.id !== input.id && q.status === 'pending') {
          db.updateQuote(q.id, { status: 'rejected' });
          
          db.createNotification({
            userId: q.travelerId,
            title: 'Quote Not Selected',
            message: `Your quote for shipment ${shipment.parcelRequestId} was not selected.`,
            type: 'quote',
            data: { shipmentId: quote.shipmentId, quoteId: q.id },
          });
        }
      });

      const conversation = db.createConversation({
        type: 'sender_traveler',
        participants: [shipment.senderId, quote.travelerId],
        shipmentId: quote.shipmentId,
      });

      const jobAcceptDeadline = new Date(Date.now() + TRUST_LIMITS.JOB_ACCEPT_WINDOW_MS).toISOString();

      db.updateShipment(quote.shipmentId, {
        status: 'pending_acceptance',
        assignedTravelerId: quote.travelerId,
        assignedTravelerName: quote.travelerName,
        acceptedQuoteAmount: quote.amount,
        chatId: conversation.id,
        jobAcceptDeadline,
      });

      const minutes = Math.round(TRUST_LIMITS.JOB_ACCEPT_WINDOW_MS / 60000);
      db.createNotification({
        userId: quote.travelerId,
        title: 'Quote Accepted \u2014 Action Required',
        message: `Your quote for ${shipment.parcelRequestId} was accepted. Please confirm the job within ${minutes} minutes or it will be reopened.`,
        type: 'quote',
        data: { shipmentId: quote.shipmentId, quoteId: quote.id, jobAcceptDeadline },
      });

      return { success: true, quote: db.getQuoteById(input.id), conversationId: conversation.id, jobAcceptDeadline };
    }),

  getBestMatches: protectedProcedure
    .input(z.object({ shipmentId: z.string(), limit: z.number().default(3) }))
    .query(async ({ input }) => {
      const shipment = db.getShipmentById(input.shipmentId);
      if (!shipment) return [] as { quoteId: string; travelerId: string; travelerName: string; travelerRating: number; amount: number; score: number; reasons: string[] }[];
      const quotes = db.getQuotesForShipment(input.shipmentId).filter(q => q.status === 'pending');
      if (quotes.length === 0) return [];

      const prices = quotes.map(q => q.amount);
      const minPrice = Math.min(...prices);
      const maxPrice = Math.max(...prices);
      const priceSpread = Math.max(1, maxPrice - minPrice);

      const scored = quotes.map(q => {
        const priceFit = 1 - (q.amount - minPrice) / priceSpread;
        const ratingScore = (q.travelerRating || 5) / 5;
        const deliveriesScore = Math.min(1, (q.travelerDeliveries || 0) / 20);
        const routeOverlap = 0.7;
        const score = routeOverlap * 0.4 + ratingScore * 0.3 + priceFit * 0.2 + deliveriesScore * 0.1;

        const reasons: string[] = [];
        if (q.amount === minPrice) reasons.push('Best Price');
        if ((q.travelerRating || 0) >= 4.5) reasons.push('Top Rated');
        if ((q.travelerDeliveries || 0) >= 10) reasons.push('Experienced');

        return {
          quoteId: q.id,
          travelerId: q.travelerId,
          travelerName: q.travelerName,
          travelerRating: q.travelerRating,
          amount: q.amount,
          score: Math.round(score * 100) / 100,
          reasons,
        };
      });

      return scored.sort((a, b) => b.score - a.score).slice(0, input.limit);
    }),

  reject: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ input }) => {
      const quote = db.getQuoteById(input.id);
      if (!quote) {
        return { success: false, error: 'Quote not found' };
      }

      db.updateQuote(input.id, { status: 'rejected' });

      const shipment = db.getShipmentById(quote.shipmentId);
      if (shipment) {
        db.createNotification({
          userId: quote.travelerId,
          title: 'Quote Rejected',
          message: `Your quote for shipment ${shipment.parcelRequestId} has been rejected.`,
          type: 'quote',
          data: { shipmentId: quote.shipmentId, quoteId: quote.id },
        });
      }

      return { success: true, quote: db.getQuoteById(input.id) };
    }),
});
