import {
  createRouter,
  createCallerFactory,
  publicProcedure,
  protectedProcedure,
  adminProcedure,
} from "./init";
import { contactsRouter } from "./routers/contacts";
import { companiesRouter } from "./routers/companies";
import { pipelinesRouter } from "./routers/pipelines";
import { dealsRouter } from "./routers/deals";
import { settingsRouter } from "./routers/settings";

export {
  createRouter,
  createCallerFactory,
  publicProcedure,
  protectedProcedure,
  adminProcedure,
};

export const appRouter = createRouter({
  health: publicProcedure.query(() => ({
    status: "ok" as const,
    timestamp: new Date(),
  })),
  contacts: contactsRouter,
  companies: companiesRouter,
  pipelines: pipelinesRouter,
  deals: dealsRouter,
  settings: settingsRouter,
});

export type AppRouter = typeof appRouter;
