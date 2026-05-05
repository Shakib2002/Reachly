/**
 * Structured error logger for API routes.
 * Sanitizes stack traces to prevent leaking internal paths in production.
 */
export function logAPIError(context: string, error: unknown): void {
  const message = error instanceof Error ? error.message : 'Unknown error';
  const isProduction = process.env.NODE_ENV === 'production';

  if (isProduction) {
    // In production, log only the context + sanitized message (no stack trace)
    console.error(JSON.stringify({
      level: 'error',
      context,
      message,
      timestamp: new Date().toISOString(),
    }));
  } else {
    // In dev, log the full error for debugging
    console.error(`[${context}]`, error);
  }
}
