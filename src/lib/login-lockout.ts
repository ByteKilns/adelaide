export const MAX_FAILED_ATTEMPTS = 5;
export const LOCKOUT_DURATION_MS = 15 * 60 * 1000;

export type LoginAttemptState = {
  failedLoginAttempts: number;
  lockedUntil: Date | null;
};

export function isLockedOut(state: Pick<LoginAttemptState, "lockedUntil">, now: Date): boolean {
  return state.lockedUntil !== null && state.lockedUntil.getTime() > now.getTime();
}

export function recordFailedAttempt(state: Pick<LoginAttemptState, "failedLoginAttempts">, now: Date): LoginAttemptState {
  const failedLoginAttempts = state.failedLoginAttempts + 1;
  const lockedUntil = failedLoginAttempts >= MAX_FAILED_ATTEMPTS ? new Date(now.getTime() + LOCKOUT_DURATION_MS) : null;
  return { failedLoginAttempts, lockedUntil };
}

export function resetAttempts(): LoginAttemptState {
  return { failedLoginAttempts: 0, lockedUntil: null };
}
