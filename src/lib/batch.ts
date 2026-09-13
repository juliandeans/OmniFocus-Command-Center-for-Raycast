/**
 * Batch-creation guardrails shared by "Add Multiple Tasks" and the initial
 * tasks of "Create Project".
 *
 * - Up to BATCH_SOFT_LIMIT tasks are created without extra confirmation.
 * - Above BATCH_SOFT_LIMIT a confirmation dialog is required before writing.
 * - Above BATCH_HARD_LIMIT creation is rejected outright — no OmniFocus write
 *   may happen (enforced in the UI and again inside the mutation layer).
 */
export const BATCH_SOFT_LIMIT = 50;
export const BATCH_HARD_LIMIT = 200;

export type BatchDecision = {
  allowed: boolean;
  requiresConfirmation: boolean;
  /** Present only when the batch is not allowed; safe to show in form errors. */
  reason?: string;
};

export function batchHardLimitMessage(count: number): string {
  return `Cannot create ${count} tasks at once. A single action can create at most ${BATCH_HARD_LIMIT} tasks — split the batch into smaller groups.`;
}

export function batchConfirmationMessage(count: number): string {
  return `This will create ${count} separate tasks in OmniFocus.`;
}

/**
 * Pure decision helper for a batch of `count` tasks.
 */
export function evaluateBatchSize(count: number): BatchDecision {
  if (count > BATCH_HARD_LIMIT) {
    return { allowed: false, requiresConfirmation: false, reason: batchHardLimitMessage(count) };
  }
  if (count > BATCH_SOFT_LIMIT) {
    return { allowed: true, requiresConfirmation: true };
  }
  return { allowed: true, requiresConfirmation: false };
}
