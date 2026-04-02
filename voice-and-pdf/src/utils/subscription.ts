export const SUBSCRIPTION_MONTHLY_PRICE_YEN = 500;

export function getCreditsForContinuousMonths(continuousMonths: number): number {
  if (continuousMonths >= 3) {
    return 25;
  }

  if (continuousMonths === 2) {
    return 22;
  }

  return 20;
}

export function isProcessedBillingCycle(
  lastAppliedAt: string | null,
  paidAtUnix: number | null,
): boolean {
  if (!lastAppliedAt || !paidAtUnix) {
    return false;
  }

  const lastAppliedUnix = Math.floor(new Date(lastAppliedAt).getTime() / 1000);
  return lastAppliedUnix >= paidAtUnix;
}
