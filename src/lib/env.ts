import { z } from "zod";

const EnvSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),

  DATABASE_URL: z
    .string()
    .url("DATABASE_URL must be a valid PostgreSQL URL")
    .optional()
    .or(z.literal("")),

  RAG_URL: z.string().url("RAG_URL must be a valid URL").optional().or(z.literal("")),

  ANTHROPIC_API_KEY: z.string().optional().or(z.literal("")),

  NEXTAUTH_URL: z
    .string()
    .url("NEXTAUTH_URL must be set to the app's canonical origin URL")
    .optional()
    .or(z.literal("")),

  NEXTAUTH_SECRET: z.string().min(16).optional().or(z.literal("")),

  ADMIN_EMAIL: z.string().email().default("admin@regmitra.local"),
  ADMIN_PASSWORD_HASH: z.string().optional().or(z.literal("")),

  NEXT_PUBLIC_APP_URL: z
    .string()
    .url("NEXT_PUBLIC_APP_URL must be the app's public URL")
    .optional()
    .or(z.literal("")),

  NEXT_PUBLIC_FIRM_NAME: z.string().min(1).default("Karan Kotai & Associates"),
  NEXT_PUBLIC_WORKSPACE_LABEL: z.string().min(1).default("Demo workspace"),

  HTTP_USER_AGENT: z.string().max(500).optional(),
});

type Env = z.infer<typeof EnvSchema>;

let cached: Env | null = null;

function parseEnv(): Env {
  const raw = {
    NODE_ENV: process.env.NODE_ENV,
    DATABASE_URL: process.env.DATABASE_URL,
    RAG_URL: process.env.RAG_URL,
    ANTHROPIC_API_KEY: process.env.ANTHROPIC_API_KEY,
    NEXTAUTH_URL: process.env.NEXTAUTH_URL,
    NEXTAUTH_SECRET: process.env.NEXTAUTH_SECRET,
    ADMIN_EMAIL: process.env.ADMIN_EMAIL,
    ADMIN_PASSWORD_HASH: process.env.ADMIN_PASSWORD_HASH,
    NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
    NEXT_PUBLIC_FIRM_NAME: process.env.NEXT_PUBLIC_FIRM_NAME,
    NEXT_PUBLIC_WORKSPACE_LABEL: process.env.NEXT_PUBLIC_WORKSPACE_LABEL,
    HTTP_USER_AGENT: process.env.HTTP_USER_AGENT,
  };

  const result = EnvSchema.safeParse(raw);
  if (!result.success) {
    const details = result.error.issues
      .map((i) => `  • ${i.path.join(".")}: ${i.message}`)
      .join("\n");
    // eslint-disable-next-line no-console
    console.warn(
      `[env] Boot warnings (may be expected during build). Missing:\n${details}`,
    );
  }
  return result.success ? result.data : (EnvSchema.parse({}) as Env);
}

export const env: Env =
  cached ??
  (() => {
    cached = parseEnv();
    return cached;
  })();

export function isProduction() {
  return env.NODE_ENV === "production";
}

export function isDevelopment() {
  return env.NODE_ENV === "development";
}

export function isTest() {
  return env.NODE_ENV === "test";
}

const RequiredRuntimeSchema = z.object({
  DATABASE_URL: z.string().url(),
  RAG_URL: z.string().url(),
  NEXTAUTH_SECRET: z.string().min(16),
  ADMIN_PASSWORD_HASH: z.string().min(1),
  NEXT_PUBLIC_APP_URL: z.string().url(),
});

let runtimeCheckedOk = false;

export function assertRuntimeEnv(): string[] {
  if (runtimeCheckedOk) return [];
  const res = RequiredRuntimeSchema.safeParse({
    DATABASE_URL: process.env.DATABASE_URL,
    RAG_URL: process.env.RAG_URL,
    NEXTAUTH_SECRET: process.env.NEXTAUTH_SECRET,
    ADMIN_PASSWORD_HASH: process.env.ADMIN_PASSWORD_HASH,
    NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
  });
  if (res.success) {
    runtimeCheckedOk = true;
    return [];
  }
  return res.error.issues.map((i) => `${i.path.join(".")}: ${i.message}`);
}
