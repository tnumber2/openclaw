export function getBrAdContext(): string {
  const now = new Date();
  const launchDate = new Date("2026-03-15T00:00:00-06:00");
  const decisionDate = new Date("2026-03-08T00:00:00-06:00");
  const daysToLaunch = Math.ceil((launchDate.getTime() - now.getTime()) / 86400000);
  const daysToDecision = Math.ceil((decisionDate.getTime() - now.getTime()) / 86400000);

  const launchStatus =
    daysToLaunch <= 0
      ? `DEADLINE PASSED (${Math.abs(daysToLaunch)} days ago)`
      : `${daysToLaunch} days remaining`;
  const decisionStatus =
    daysToDecision <= 0
      ? `DEADLINE PASSED (${Math.abs(daysToDecision)} days ago)`
      : `${daysToDecision} days remaining`;

  return `## BRAd — Bowling Reservation AI
- Launch partner: WOW
- Launch deadline: March 15, 2026 — ${launchStatus}
- Brunswick API decision deadline: March 8, 2026 — ${decisionStatus}
- P0 BLOCKER: Brunswick 365 API access UNCONFIRMED
- Strategic play: acquisition target for Brunswick (1,800–2,800 installed base)
- If API not confirmed by March 8 → escalate immediately or pivot strategy
- Acquisition framing: BRAd as proof-of-concept for Brunswick partnership`.trim();
}
