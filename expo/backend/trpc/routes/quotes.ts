import { z } from 'zod';
import { createTRPCRouter, publicProcedure } from '../create-context';
import { db } from '../../db/store';

export const quotesRouter = createTRPCRouter({
  create: publicProcedure
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
    .mutation(async ({ input }) => {
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

  getById: publicProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ input }) => {
      return db.getQuoteById(input.id) || null;
    }),

  getByShipmentId: publicProcedure
    .input(z.object({ shipmentId: z.string() }))
    .query(async ({ input }) => {
      return db.getQuotesForShipment(input.shipmentId);
    }),

  getByTravelerId: publicProcedure
    .input(z.object({ travelerId: z.string() }))
    .query(async ({ input }) => {
      return db.getQuotesByTravelerId(input.travelerId);
    }),

  getAll: publicProcedure
    .query(async () => {
      return db.getAllQuotes();
    }),

  accept: publicProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ input }) => {
      const quote = db.getQuoteById(input.id);
      if (!quote) {
        return { success: false, error: 'Quote not found' };
      }

      const shipment = db.getShipmentById(quote.shipmentId);
      if (!shipment) {
        return { success: false, error: 'Shipment not found' };
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

      db.updateShipment(quote.shipmentId, {
        status: 'assigned',
        assignedTravelerId: quote.travelerId,
        assignedTravelerName: quote.travelerName,
        acceptedQuoteAmount: quote.amount,
        chatId: conversation.id,
      });

      db.createNotification({
        userId: quote.travelerId,
        title: 'Quote Accepted!',
        message: `Your quote of ₹${quote.amount} for shipment ${shipment.parcelRequestId} has been accepted. Coordinate pickup with the sender. Payment is collected offline on delivery.`,
        type: 'quote',
        data: { shipmentId: quote.shipmentId, quoteId: quote.id },
      });

      return { success: true, quote: db.getQuoteById(input.id), conversationId: conversation.id };
    }),

  reject: publicProcedure
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
