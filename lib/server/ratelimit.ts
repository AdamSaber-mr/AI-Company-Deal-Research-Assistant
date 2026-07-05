// Eenvoudige in-memory rate-limiter (sliding window). Bewust zonder opslag:
// bij een serverherstart begint de teller opnieuw — prima voor deze demo,
// het doel is onbeperkt wachtwoord-raden en reset-spam afremmen.

const attempts = new Map<string, number[]>();

function prune(key: string, windowMs: number): number[] {
  const cutoff = Date.now() - windowMs;
  const kept = (attempts.get(key) ?? []).filter((t) => t > cutoff);
  if (kept.length) attempts.set(key, kept);
  else attempts.delete(key);
  return kept;
}

/** Seconden tot de blokkade afloopt, of 0 als er nog pogingen over zijn. */
export function lockedSeconds(
  key: string,
  max: number,
  windowMs: number
): number {
  const recent = prune(key, windowMs);
  if (recent.length < max) return 0;
  const oldest = Math.min(...recent);
  return Math.max(1, Math.ceil((oldest + windowMs - Date.now()) / 1000));
}

export function recordAttempt(key: string) {
  const list = attempts.get(key) ?? [];
  list.push(Date.now());
  attempts.set(key, list);
}

export function clearAttempts(key: string) {
  attempts.delete(key);
}
