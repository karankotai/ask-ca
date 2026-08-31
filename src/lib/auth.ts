import NextAuth, { type DefaultSession, type Session } from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { compare } from "bcryptjs";
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { z, type ZodTypeAny } from "zod";

import { env } from "@/lib/env";
import { logError, logWarn } from "@/lib/logging";
import {
  parseBody,
  parseNumericId,
  type ValidationErrorResponse,
} from "./validation";

declare module "next-auth" {
  interface Session {
    user: {
      role: "admin" | "user";
      email: string;
    } & DefaultSession["user"];
  }

  interface User {
    role: "admin" | "user";
  }
}

declare module "@auth/core/jwt" {
  interface JWT {
    role?: "admin" | "user";
  }
}

const ADMIN_EMAIL = env.ADMIN_EMAIL.toLowerCase().trim();

export const { handlers, auth, signIn, signOut } = NextAuth({
  session: { strategy: "jwt" },
  trustHost: true,
  secret: env.NEXTAUTH_SECRET,
  providers: [
    Credentials({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;
        const email = String(credentials.email).toLowerCase().trim();
        const password = String(credentials.password);

        if (email !== ADMIN_EMAIL) {
          logWarn("auth.authorize.fail", `Unknown email: ${email}`);
          return null;
        }

        if (!env.ADMIN_PASSWORD_HASH) {
          logWarn(
            "auth.authorize.fail",
            "ADMIN_PASSWORD_HASH not set — login disabled",
          );
          return null;
        }
        let ok = false;
        try {
          const compareResult = await compare(password, env.ADMIN_PASSWORD_HASH);
          ok = Boolean(compareResult);
        } catch (e) {
          logError("auth.bcrypt.compare", e);
          return null;
        }

        if (!ok) {
          logWarn("auth.authorize.fail", `Wrong password for ${email}`);
          return null;
        }
        return { id: "admin", email: ADMIN_EMAIL, role: "admin" as const };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.role = user.role;
        token.email = user.email;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.email = token.email ?? session.user.email;
        session.user.role = token.role ?? "user";
      }
      return session;
    },
  },
  pages: {
    signIn: "/login",
  },
});

export async function getSessionSafe(): Promise<Session | null> {
  try {
    return await auth();
  } catch (e) {
    logError("auth.getSession", e);
    return null;
  }
}

export type AuthRole = "admin" | "user";

export type AuthContext = {
  session: Session;
  user: {
    email: string;
    role: AuthRole;
  };
};

const ROLE_HIERARCHY: Record<AuthRole, number> = { user: 1, admin: 10 };

export function hasRole(session: Session | null, required: AuthRole): boolean {
  if (!session?.user?.role) return false;
  return ROLE_HIERARCHY[session.user.role] >= ROLE_HIERARCHY[required];
}

export class AuthRequiredError extends Error {
  status = 401;
  constructor() {
    super("Authentication required.");
    this.name = "AuthRequiredError";
  }
}

export class PermissionDeniedError extends Error {
  status = 403;
  constructor() {
    super("Insufficient permissions.");
    this.name = "PermissionDeniedError";
  }
}

export function wrapAuthError(e: unknown): Response {
  if (e instanceof AuthRequiredError) {
    return Response.json({ error: "Authentication required." }, { status: 401 });
  }
  if (e instanceof PermissionDeniedError) {
    return Response.json({ error: "Forbidden." }, { status: 403 });
  }
  logError("auth.unexpected", e);
  return Response.json({ error: "Server error." }, { status: 500 });
}

export async function requireAuth(
  requiredRole: AuthRole = "user",
): Promise<AuthContext> {
  const session = await getSessionSafe();
  if (!session?.user) throw new AuthRequiredError();
  if (!hasRole(session, requiredRole)) throw new PermissionDeniedError();
  return {
    session,
    user: { email: session.user.email, role: session.user.role },
  };
}

export type RouteHandler<T> = (ctx: {
  req: NextRequest;
  params: Record<string, unknown>;
  auth: AuthContext;
  body?: T;
}) => Promise<Response> | Response;

type HandlerOpts = {
  role?: AuthRole;
  bodySchema?: ZodTypeAny;
  productionDisable?: boolean;
};

export async function withAuth<T = unknown>(
  req: NextRequest,
  opts: HandlerOpts,
  handler: RouteHandler<T>,
  paramsPromise?: Promise<Record<string, unknown>>,
): Promise<Response> {
  try {
    if (opts.productionDisable && process.env.NODE_ENV === "production") {
      return NextResponse.json(
        { error: "Not available in production." },
        { status: 404 },
      );
    }

    const authCtx = await requireAuth(opts.role ?? "user");
    const params = paramsPromise ? await paramsPromise : {};

    let body: T | undefined;
    if (opts.bodySchema) {
      const parsed = await parseBody(req, opts.bodySchema);
      if (!parsed.ok) return parsed.error as ValidationErrorResponse;
      body = parsed.data as T;
    }

    return await handler({ req, params, auth: authCtx, body });
  } catch (e) {
    if (e instanceof AuthRequiredError || e instanceof PermissionDeniedError) {
      return wrapAuthError(e);
    }
    logError("route.uncaught", e);
    return NextResponse.json(
      { error: "Internal server error." },
      { status: 500 },
    );
  }
}

export { NextResponse, NextRequest, parseNumericId };
export type { z };
