import NextAuth from "next-auth";
import Google from "next-auth/providers/google";
import MicrosoftEntraID from "next-auth/providers/microsoft-entra-id";
import { DrizzleAdapter } from "@auth/drizzle-adapter";
import { db } from "@/server/db";
import { eq, and } from "drizzle-orm";
import { users } from "@/server/db/schema/users";

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: DrizzleAdapter(db),
  session: { strategy: "jwt" },
  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      authorization: {
        params: {
          scope:
            "openid email profile https://www.googleapis.com/auth/gmail.readonly https://www.googleapis.com/auth/calendar.readonly",
          access_type: "offline",
          prompt: "consent",
        },
      },
    }),
    MicrosoftEntraID({
      clientId: process.env.MICROSOFT_ENTRA_ID_CLIENT_ID!,
      clientSecret: process.env.MICROSOFT_ENTRA_ID_CLIENT_SECRET!,
      issuer: `https://login.microsoftonline.com/${process.env.MICROSOFT_ENTRA_ID_TENANT_ID ?? "common"}/v2.0`,
      authorization: {
        params: {
          scope:
            "openid email profile offline_access Mail.Read Calendars.Read",
        },
      },
    }),
  ],
  callbacks: {
    async jwt({ token, account, profile }) {
      if (account && profile?.email) {
        const user = await db
          .select({ workspaceId: users.workspaceId, role: users.role })
          .from(users)
          .where(and(eq(users.email, profile.email), eq(users.isActive, true)))
          .limit(1)
          .then((rows) => rows[0]);

        if (user) {
          token.workspaceId = user.workspaceId;
          token.role = user.role;
        }
      }
      return token;
    },
    async session({ session, token }) {
      if (token.workspaceId) {
        session.user.workspaceId = token.workspaceId as string;
      }
      if (token.role) {
        session.user.role = token.role as string;
      }
      return session;
    },
  },
  pages: {
    signIn: "/login",
  },
});
