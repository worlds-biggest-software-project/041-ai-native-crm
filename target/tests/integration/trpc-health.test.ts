import { describe, it, expect } from "vitest";
import { appRouter, createCallerFactory } from "@/server/trpc/router";
import type { Context } from "@/server/trpc/context";

const createCaller = createCallerFactory(appRouter);

// For health check (public), pass minimal context with no session
const caller = createCaller({
  db: {} as unknown as Context["db"],
  session: null,
  workspaceId: null,
  userRole: null,
  headers: new Headers(),
});

describe("tRPC health procedure", () => {
  it("returns status ok without requiring authentication", async () => {
    const result = await caller.health();

    expect(result.status).toBe("ok");
    expect(result.timestamp).toBeInstanceOf(Date);
  });
});
