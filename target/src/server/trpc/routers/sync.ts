import { z } from "zod";
import { eq, and } from "drizzle-orm";
import { protectedProcedure, createRouter } from "../init";
import { oauthConnections } from "@/server/db/schema/oauth-connections";

const providerSchema = z.enum([
  "gmail",
  "outlook",
  "google_calendar",
  "outlook_calendar",
]);

/**
 * OAuth scopes per provider, used when constructing authorization URLs.
 */
const PROVIDER_SCOPES: Record<z.infer<typeof providerSchema>, string[]> = {
  gmail: [
    "https://www.googleapis.com/auth/gmail.readonly",
    "https://www.googleapis.com/auth/gmail.send",
    "https://www.googleapis.com/auth/gmail.modify",
  ],
  outlook: [
    "https://graph.microsoft.com/Mail.ReadWrite",
    "https://graph.microsoft.com/Mail.Send",
    "offline_access",
  ],
  google_calendar: [
    "https://www.googleapis.com/auth/calendar.readonly",
    "https://www.googleapis.com/auth/calendar.events",
  ],
  outlook_calendar: [
    "https://graph.microsoft.com/Calendars.ReadWrite",
    "offline_access",
  ],
};

/**
 * Build the OAuth authorization URL for the given provider.
 */
function buildAuthUrl(
  provider: z.infer<typeof providerSchema>,
  workspaceId: string,
): string {
  const scopes = PROVIDER_SCOPES[provider];
  const state = Buffer.from(
    JSON.stringify({ provider, workspaceId }),
  ).toString("base64url");

  if (provider === "gmail" || provider === "google_calendar") {
    const params = new URLSearchParams({
      client_id: process.env.GOOGLE_CLIENT_ID ?? "",
      redirect_uri: `${process.env.NEXT_PUBLIC_APP_URL}/api/auth/callback/google`,
      response_type: "code",
      scope: scopes.join(" "),
      access_type: "offline",
      prompt: "consent",
      state,
    });
    return `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
  }

  // outlook or outlook_calendar
  const params = new URLSearchParams({
    client_id: process.env.MICROSOFT_CLIENT_ID ?? "",
    redirect_uri: `${process.env.NEXT_PUBLIC_APP_URL}/api/auth/callback/microsoft`,
    response_type: "code",
    scope: scopes.join(" "),
    response_mode: "query",
    state,
  });
  return `https://login.microsoftonline.com/common/oauth2/v2.0/authorize?${params.toString()}`;
}

export const syncRouter = createRouter({
  /**
   * List all OAuth connections for the current workspace.
   */
  getConnections: protectedProcedure.query(async ({ ctx }) => {
    return ctx.db
      .select()
      .from(oauthConnections)
      .where(eq(oauthConnections.workspaceId, ctx.workspaceId));
  }),

  /**
   * Initiate an OAuth flow for a given provider. Returns the authorization URL
   * that the client should redirect the user to.
   */
  initiateOAuth: protectedProcedure
    .input(z.object({ provider: providerSchema }))
    .mutation(({ ctx, input }) => {
      const authUrl = buildAuthUrl(input.provider, ctx.workspaceId);
      return { authUrl };
    }),

  /**
   * Revoke (deactivate) an existing OAuth connection.
   */
  revokeConnection: protectedProcedure
    .input(z.object({ connectionId: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      const [updated] = await ctx.db
        .update(oauthConnections)
        .set({
          isActive: false,
          updatedAt: new Date(),
        })
        .where(
          and(
            eq(oauthConnections.id, input.connectionId),
            eq(oauthConnections.workspaceId, ctx.workspaceId),
          ),
        )
        .returning();

      return { success: !!updated };
    }),
});
