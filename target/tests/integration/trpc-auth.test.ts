import { describe, it, expect } from "vitest";
import {
  createRouter,
  createCallerFactory,
  protectedProcedure,
} from "@/server/trpc/router";
import type { Context } from "@/server/trpc/context";

const testRouter = createRouter({
  secret: protectedProcedure.query(() => ({ data: "sensitive" })),
});

const createCaller = createCallerFactory(testRouter);

describe("tRPC protectedProcedure", () => {
  it("rejects unauthenticated request", async () => {
    const caller = createCaller({
      db: {} as unknown as Context["db"],
      session: null,
      workspaceId: null,
      userRole: null,
      headers: new Headers(),
    });

    await expect(caller.secret()).rejects.toThrowError(
      expect.objectContaining({
        code: "UNAUTHORIZED",
      }),
    );
  });

  it("allows authenticated request", async () => {
    const caller = createCaller({
      db: {} as unknown as Context["db"],
      session: {
        user: {
          id: "user-1",
          email: "test@example.com",
          workspaceId: "ws-1",
          role: "member",
        },
        expires: new Date(Date.now() + 86400000).toISOString(),
      },
      workspaceId: "ws-1",
      userRole: "member",
      headers: new Headers(),
    });

    const result = await caller.secret();
    expect(result).toEqual({ data: "sensitive" });
  });
});
