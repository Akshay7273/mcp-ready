import { describe, expect, it } from "vitest"
import { buildScanContext } from "../src/detect.js"
import { rules } from "../src/rules/index.js"
import type { Finding } from "../src/types.js"

async function scan(dir: string): Promise<Finding[]> {
  const ctx = await buildScanContext(dir)
  const findings: Finding[] = []
  for (const rule of rules) {
    findings.push(...(await rule.check(ctx)))
  }
  return findings
}

describe("mcp-ready rules", () => {
  it("flags the demo fixture with 3 breaking, 3 deprecated, 1 info", async () => {
    const findings = await scan("fixtures/ts-violations")
    const count = (sev: string) => findings.filter((f) => f.severity === sev).length
    expect(count("breaking")).toBe(3)
    expect(count("deprecated")).toBe(3)
    expect(count("info")).toBe(1)
  })

  it("flags the monolithic TS SDK", async () => {
    const findings = await scan("fixtures/ts-old-sdk")
    expect(findings.map((f) => f.ruleId)).toContain("ts-monolith-sdk")
  })

  it("flags an unbounded python mcp dependency", async () => {
    const findings = await scan("fixtures/py-old-sdk")
    expect(findings.map((f) => f.ruleId)).toContain("py-unbounded-dep")
  })

  it("skips test files entirely", async () => {
    const findings = await scan("fixtures/ts-testfiles")
    expect(findings).toHaveLength(0)
  })
})
