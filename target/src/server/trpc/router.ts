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
import { syncRouter } from "./routers/sync";
import { activitiesRouter } from "./routers/activities";
import { searchRouter } from "./routers/search";
import { aiRouter } from "./routers/ai";
import { scoringRouter } from "./routers/scoring";
import { webhooksRouter } from "./routers/webhooks";
import { workflowsRouter } from "./routers/workflows";
import { enrichmentRouter } from "./routers/enrichment";
import { customFieldsRouter } from "./routers/custom-fields";
import { customObjectsRouter } from "./routers/custom-objects";
import { reportsRouter } from "./routers/reports";
import { exportRouter } from "./routers/export";

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
  sync: syncRouter,
  activities: activitiesRouter,
  search: searchRouter,
  ai: aiRouter,
  scoring: scoringRouter,
  webhooks: webhooksRouter,
  workflows: workflowsRouter,
  enrichment: enrichmentRouter,
  customFields: customFieldsRouter,
  customObjects: customObjectsRouter,
  reports: reportsRouter,
  export: exportRouter,
});

export type AppRouter = typeof appRouter;
