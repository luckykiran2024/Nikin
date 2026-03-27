import { z } from 'zod';
import { createTRPCRouter, publicProcedure } from '../create-context';
import { db } from '../../db/store';

export const chatRouter = createTRPCRouter({
  createConversation: publicProcedure
    .input(z.object({
      type: z.enum(['sender_traveler', 'user_admin']),
      participants: z.array(z.string()),
      shipmentId: z.string().optional(),
    }))
    .mutation(async ({ input }) => {
      if (input.shipmentId) {
        const existing = db.getConversationByShipmentId(input.shipmentId);
        if (existing) {
          return { success: true, conversation: existing, isExisting: true };
        }
      }

      const conversation = db.createConversation(input);
      return { success: true, conversation, isExisting: false };
    }),

  getConversation: publicProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ input }) => {
      return db.getConversationById(input.id) || null;
    }),

  getConversationByShipmentId: publicProcedure
    .input(z.object({ shipmentId: z.string() }))
    .query(async ({ input }) => {
      return db.getConversationByShipmentId(input.shipmentId) || null;
    }),

  getAllConversations: publicProcedure
    .query(async () => {
      return db.getAllConversations();
    }),

  sendMessage: publicProcedure
    .input(z.object({
      conversationId: z.string(),
      senderId: z.string(),
      senderName: z.string(),
      senderRole: z.enum(['sender', 'traveler', 'receiver', 'admin']),
      text: z.string(),
      imageUrl: z.string().optional(),
      isSystemMessage: z.boolean().optional(),
    }))
    .mutation(async ({ input }) => {
      const conversation = db.getConversationById(input.conversationId);
      if (!conversation) {
        return { success: false, error: 'Conversation not found' };
      }

      const message = db.createMessage(input);

      conversation.participants.forEach(participantId => {
        if (participantId !== input.senderId) {
          db.createNotification({
            userId: participantId,
            title: 'New Message',
            message: `${input.senderName}: ${input.text.substring(0, 50)}${input.text.length > 50 ? '...' : ''}`,
            type: 'chat',
            data: { conversationId: input.conversationId, messageId: message.id },
          });
        }
      });

      return { success: true, message };
    }),

  getMessages: publicProcedure
    .input(z.object({ conversationId: z.string() }))
    .query(async ({ input }) => {
      return db.getMessagesByConversationId(input.conversationId);
    }),

  markAsRead: publicProcedure
    .input(z.object({
      conversationId: z.string(),
      userId: z.string(),
    }))
    .mutation(async ({ input }) => {
      db.markMessagesAsRead(input.conversationId, input.userId);
      return { success: true };
    }),
});
