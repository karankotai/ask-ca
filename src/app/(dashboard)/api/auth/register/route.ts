import { NextRequest, NextResponse } from "next/server";
import { hash } from "bcryptjs";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { logError, logWarn } from "@/lib/logging";
import { getSessionSafe } from "@/lib/auth";
import { env } from "@/lib/env";

const BCRYPT_ROUNDS = 10;

const schema = z.object({
  name: z.string().min(2).max(80).trim().optional().or(z.literal("")),
  email: z.string().email().trim().toLowerCase(),
  password: z.string().min(8).max(128),
  confirmPassword: z.string().min(8).max(128),
  role: z.enum(["user", "admin"]).optional(),
});

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  try {
    let payload: unknown;
    try {
      payload = await req.json();
    } catch {
      return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
    }

    const parsed = schema.safeParse(payload);
    if (!parsed.success) {
      const first = parsed.error.issues[0];
      return NextResponse.json(
        { error: first ? `${first.path.join(".")}: ${first.message}` : "Invalid body." },
        { status: 400 },
      );
    }

    const { name, email, password, confirmPassword } = parsed.data;
    if (password !== confirmPassword) {
      return NextResponse.json(
        { error: "Passwords do not match." },
        { status: 400 },
      );
    }

    const totalUsers = await prisma.user.count();

    if (totalUsers === 0) {
      let envAdminMatched = false;
      const adminEmail = env.ADMIN_EMAIL.toLowerCase().trim();
      if (adminEmail && adminEmail === email && env.ADMIN_PASSWORD_HASH) {
        try {
          const { compare } = require("bcryptjs") as typeof import("bcryptjs");
          envAdminMatched = Boolean(await compare(password, env.ADMIN_PASSWORD_HASH));
        } catch {
          envAdminMatched = false;
        }
      }

      const role: "admin" = "admin";
      const passwordHash = await hash(password, BCRYPT_ROUNDS);

      try {
        const user = await prisma.user.create({
          data: {
            email,
            name: name || null,
            passwordHash,
            role,
          },
          select: { id: true, email: true, name: true, role: true, createdAt: true },
        });

        return NextResponse.json({
          ok: true,
          user,
          bootstrap: true,
          role,
        });
      } catch (e: unknown) {
        const msg = e instanceof Error ? e.message : String(e);
        if (msg.includes("Unique constraint") || msg.includes("duplicate")) {
          return NextResponse.json(
            { error: "An account with that email already exists." },
            { status: 409 },
          );
        }
        logError("auth.register.bootstrap", e);
        return NextResponse.json({ error: "Could not create account." }, { status: 500 });
      }
    }

    const session = await getSessionSafe();
    if (!session?.user) {
      return NextResponse.json(
        { error: "Sign in as an admin to register a new user." },
        { status: 401 },
      );
    }

    if (session.user.role !== "admin") {
      return NextResponse.json(
        { error: "Only admins can register new users." },
        { status: 403 },
      );
    }

    const requestedRole: "admin" | "user" =
      parsed.data.role === "admin" && session.user.role === "admin" ? "admin" : "user";

    const existing = await prisma.user.findUnique({ where: { email }, select: { id: true } });
    if (existing) {
      return NextResponse.json(
        { error: "An account with that email already exists." },
        { status: 409 },
      );
    }

    const passwordHash = await hash(password, BCRYPT_ROUNDS);

    const user = await prisma.user.create({
      data: {
        email,
        name: name || null,
        passwordHash,
        role: requestedRole,
      },
      select: { id: true, email: true, name: true, role: true, createdAt: true },
    });

    return NextResponse.json({
      ok: true,
      user,
      createdBy: session.user.email,
    });
  } catch (e) {
    logError("auth.register.uncaught", e);
    return NextResponse.json({ error: "Unexpected server error." }, { status: 500 });
  }
}
