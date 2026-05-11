import { type FetchCreateContextFnOptions } from "@trpc/server/adapters/fetch";
import { auth } from "@/server/lib/auth";
import { db } from "@/server/db";

export async function createContext(opts: FetchCreateContextFnOptions) {
  const session = await auth();

  return {
    db,
    session,
    workspaceId: session?.user?.workspaceId ?? null,
    userRole: session?.user?.role ?? null,
    headers: opts.req.headers,
  };
}

export type Context = Awaited<ReturnType<typeof createContext>>;
