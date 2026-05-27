/**
 * Router tRPC raíz. En la Fase 4 se añadirán los routers de horses, riders,
 * lessons y badges. Por ahora solo un endpoint de salud.
 */
import { initTRPC } from '@trpc/server';
import { z } from 'zod';

const t = initTRPC.create();

export const router = t.router;
export const publicProcedure = t.procedure;

export const appRouter = router({
  health: publicProcedure
    .input(z.object({ ping: z.string().optional() }).optional())
    .query(({ input }) => ({
      ok: true,
      echo: input?.ping ?? null,
      timestamp: new Date().toISOString(),
    })),
});

export type AppRouter = typeof appRouter;
