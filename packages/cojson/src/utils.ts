export function parseError(e: unknown): {
  message: string | null;
  stack: string | null;
} {
  return {
    message: e instanceof Error ? e.message : null,
    stack: e instanceof Error ? (e.stack ?? null) : null,
  };
}
