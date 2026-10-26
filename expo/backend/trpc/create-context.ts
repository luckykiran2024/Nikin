import { initTRPC, TRPCError } from '@trpc/server';
import { FetchCreateContextFnOptions } from '@trpc/server/adapters/fetch';
import { createClient } from '@supabase/supabase-js';
import superjson from 'superjson';

export const createContext = async (opts: FetchCreateContextFnOptions) => {
  const token = opts.req.headers.get('authorization')?.match(/^Bearer (\S+)$/i)?.[1];
  const url = process.env.EXPO_PUBLIC_SUPABASE_URL;
  const key = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;
  let user: { id: string; email?: string; isAdmin: boolean } | null = null;

  if (token && url && key) {
    const auth = createClient(url, key, { auth: { persistSession: false } });
    const { data, error } = await auth.auth.getUser(token);
    if (!error && data.user) {
      user = {
        id: data.user.id,
        email: data.user.email,
        // Only a trusted server can set app_metadata.
        isAdmin: data.user.app_metadata?.role === 'admin',
      };
    }
  }

  return { req: opts.req, user };
};

export type Context = Awaited<ReturnType<typeof createContext>>;

const t = initTRPC.context<Context>().create({ transformer: superjson });

export const createTRPCRouter = t.router;
export const publicProcedure = t.procedure;
export const protectedProcedure = t.procedure.use(({ ctx, next }) => {
  if (!ctx.user) throw new TRPCError({ code: 'UNAUTHORIZED' });
  return next({ ctx: { ...ctx, user: ctx.user } });
});
export const adminProcedure = protectedProcedure.use(({ ctx, next }) => {
  if (!ctx.user.isAdmin) throw new TRPCError({ code: 'FORBIDDEN' });
  return next();
});
