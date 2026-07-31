import type { Finding, Rule, ScanContext } from "./types.js"

/** Run rules and attach the applicability metadata declared by each rule. */
export async function runRules(ctx: ScanContext, rules: Rule[]): Promise<Finding[]> {
  const findings: Finding[] = []

  for (const rule of rules) {
    const drafts = await rule.check(ctx)
    for (const draft of drafts) {
      findings.push({
        ...draft,
        protocolEra: rule.protocolEra,
        confidence: rule.confidence,
      })
    }
  }

  return findings
}
