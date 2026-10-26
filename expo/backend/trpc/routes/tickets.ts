import { z } from 'zod';
import { createTRPCRouter, protectedProcedure } from '../create-context';
import { db } from '../../db/store';

export const ticketsRouter = createTRPCRouter({
  create: protectedProcedure
    .input(z.object({
      userId: z.string(),
      userName: z.string(),
      userRole: z.enum(['sender', 'traveler', 'receiver', 'admin']),
      category: z.string(),
      subcategory: z.string().optional(),
      description: z.string(),
      priority: z.enum(['low', 'medium', 'high', 'urgent']).default('medium'),
    }))
    .mutation(async ({ input }) => {
      const ticket = db.createTicket({
        ...input,
        status: 'open',
      });

      db.createNotification({
        userId: input.userId,
        title: 'Support Ticket Created',
        message: `Your support ticket #${ticket.ticketNumber} has been created. Our team will respond shortly.`,
        type: 'system',
        data: { ticketId: ticket.id },
      });

      return { success: true, ticket };
    }),

  getById: protectedProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ input }) => {
      return db.getTicketById(input.id) || null;
    }),

  getAll: protectedProcedure
    .query(async () => {
      return db.getAllTickets();
    }),

  getOpen: protectedProcedure
    .query(async () => {
      return db.getOpenTickets();
    }),

  update: protectedProcedure
    .input(z.object({
      id: z.string(),
      status: z.enum(['open', 'in_progress', 'resolved', 'closed']).optional(),
      priority: z.enum(['low', 'medium', 'high', 'urgent']).optional(),
      assignedAdminId: z.string().optional(),
      resolution: z.string().optional(),
    }))
    .mutation(async ({ input }) => {
      const { id, ...updates } = input;
      
      if (updates.status === 'resolved') {
        (updates as any).resolvedAt = new Date().toISOString();
      }

      const ticket = db.updateTicket(id, updates);
      if (!ticket) {
        return { success: false, error: 'Ticket not found' };
      }

      if (updates.status === 'resolved') {
        db.createNotification({
          userId: ticket.userId,
          title: 'Ticket Resolved',
          message: `Your support ticket #${ticket.ticketNumber} has been resolved.`,
          type: 'system',
          data: { ticketId: ticket.id },
        });
      }

      return { success: true, ticket };
    }),
});
