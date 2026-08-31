type LogContext = Record<string, unknown>;

function formatMessage(scope: string, message: string, context?: LogContext): string {
  const ts = new Date().toISOString();
  const ctxStr = context ? ` ${JSON.stringify(context)}` : "";
  return `[${ts}] [${scope}] ${message}${ctxStr}`;
}

export function logError(scope: string, err: unknown, context?: LogContext): void {
  const message = err instanceof Error ? err.message : String(err);
  const stack = err instanceof Error ? err.stack : undefined;
  const prefix = formatMessage(scope, message, context);
  console.error(prefix);
  if (stack) {
    console.error(stack);
  }
}

export function logWarn(scope: string, message: string, context?: LogContext): void {
  console.warn(formatMessage(scope, message, context));
}

export function logInfo(scope: string, message: string, context?: LogContext): void {
  if (process.env.NODE_ENV === "test") return;
  console.log(formatMessage(scope, message, context));
}

export function logDebug(scope: string, message: string, context?: LogContext): void {
  if (process.env.NODE_ENV !== "development") return;
  console.debug(formatMessage(scope, message, context));
}
