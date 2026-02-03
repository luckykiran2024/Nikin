import { createTRPCRouter } from "./create-context";
import { exampleRouter } from "./routes/example";
import { usersRouter } from "./routes/users";
import { shipmentsRouter } from "./routes/shipments";
import { quotesRouter } from "./routes/quotes";
import { travelRoutesRouter } from "./routes/travelRoutes";
import { paymentsRouter } from "./routes/payments";
import { kycRouter } from "./routes/kyc";
import { chatRouter } from "./routes/chat";
import { notificationsRouter } from "./routes/notifications";
import { ticketsRouter } from "./routes/tickets";
import { adminRouter } from "./routes/admin";

export const appRouter = createTRPCRouter({
  example: exampleRouter,
  users: usersRouter,
  shipments: shipmentsRouter,
  quotes: quotesRouter,
  travelRoutes: travelRoutesRouter,
  payments: paymentsRouter,
  kyc: kycRouter,
  chat: chatRouter,
  notifications: notificationsRouter,
  tickets: ticketsRouter,
  admin: adminRouter,
});

export type AppRouter = typeof appRouter;
