import { trpcServer } from "@hono/trpc-server";
import { Hono } from "hono";
import { cors } from "hono/cors";

import { appRouter } from "./trpc/app-router";
import { createContext } from "./trpc/create-context";
import { webhookRouter } from "./razorpayWebhook";

const app = new Hono();

app.use("*", cors());

// Business routers still use process-local Maps. Refuse production traffic until
// they are migrated to durable storage with per-user authorization and RLS.
app.use("*", async (c, next) => {
  if (c.req.path !== '/' && (process.env.NODE_ENV === 'production' || process.env.NIKIN_ENABLE_IN_MEMORY_API !== 'true')) {
    return c.json({ error: "Service unavailable until persistent storage is configured" }, 503);
  }
  await next();
});

app.route("/webhooks", webhookRouter);

app.use(
  "/trpc/*",
  trpcServer({
    endpoint: "/api/trpc",
    router: appRouter,
    createContext,
  }),
);

app.get("/", (c) => {
  return c.json({ status: "ok", message: "API is running" });
});

export default app;
