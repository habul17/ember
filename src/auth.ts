import NextAuth, { type NextAuthConfig } from "next-auth";
import { PrismaAdapter } from "@auth/prisma-adapter";
import Google from "next-auth/providers/google";
import GitHub from "next-auth/providers/github";
import Credentials from "next-auth/providers/credentials";

import { prisma } from "@/lib/prisma";

const DEV_LOGIN_ENABLED =
  process.env.DEV_LOGIN === "true" && process.env.NODE_ENV !== "production";

const providers: NextAuthConfig["providers"] = [];

if (process.env.AUTH_GOOGLE_ID && process.env.AUTH_GOOGLE_SECRET) {
  providers.push(
    Google({
      clientId: process.env.AUTH_GOOGLE_ID,
      clientSecret: process.env.AUTH_GOOGLE_SECRET,
      allowDangerousEmailAccountLinking: true,
    }),
  );
}

if (process.env.AUTH_GITHUB_ID && process.env.AUTH_GITHUB_SECRET) {
  providers.push(
    GitHub({
      clientId: process.env.AUTH_GITHUB_ID,
      clientSecret: process.env.AUTH_GITHUB_SECRET,
      allowDangerousEmailAccountLinking: true,
    }),
  );
}

// A local-only account so the app is usable before the OAuth apps exist.
// Guarded by both an env flag and NODE_ENV, and never registered in production.
if (DEV_LOGIN_ENABLED) {
  providers.push(
    Credentials({
      id: "dev",
      name: "Local development",
      credentials: {},
      async authorize() {
        const email = "dev@localhost";
        const user =
          (await prisma.user.findUnique({ where: { email } })) ??
          (await prisma.user.create({ data: { email, name: "Local dev" } }));
        return { id: user.id, name: user.name, email: user.email };
      },
    }),
  );
}

export const availableProviders = {
  google: providers.some((p) => "id" in p && p.id === "google"),
  github: providers.some((p) => "id" in p && p.id === "github"),
  dev: DEV_LOGIN_ENABLED,
};

export const { handlers, signIn, signOut, auth } = NextAuth({
  adapter: PrismaAdapter(prisma),
  providers,
  // JWT sessions rather than database sessions: the dev credentials provider
  // cannot issue a database session, and JWT keeps both paths on one code path.
  session: { strategy: "jwt" },
  pages: { signIn: "/signin" },
  callbacks: {
    jwt({ token, user }) {
      if (user?.id) token.sub = user.id;
      return token;
    },
    session({ session, token }) {
      if (token.sub) session.user.id = token.sub;
      return session;
    },
  },
});
