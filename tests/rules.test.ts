import { describe, expect, it } from "vitest"
import { buildScanContext } from "../src/detect.js"
import { rules } from "../src/rules/index.js"
import { runRules } from "../src/scan.js"
import type { Finding } from "../src/types.js"

async function scan(dir: string): Promise<Finding[]> {
  const ctx = await buildScanContext(dir)
  return runRules(ctx, rules)
}

describe("mcp-ready rules", () => {
  it("flags the demo fixture with 3 breaking, 2 deprecated, 1 info", async () => {
    const findings = await scan("fixtures/ts-violations")
    const count = (sev: string) => findings.filter((f) => f.severity === sev).length
    expect(count("breaking")).toBe(3)
    expect(count("deprecated")).toBe(2)
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

  it("attaches protocol applicability and confidence to every finding", async () => {
    const findings = await scan("fixtures/ts-violations")
    expect(findings.length).toBeGreaterThan(0)
    expect(findings.every((f) => f.protocolEra === "modern")).toBe(true)
    expect(findings.every((f) => ["high", "medium", "low"].includes(f.confidence))).toBe(true)
  })

  it("detects APIs removed or deprecated by the final specification", async () => {
    const findings = await scan("fixtures/final-spec-legacy")
    const ids = new Set(findings.map((finding) => finding.ruleId))

    expect(ids).toEqual(
      new Set([
        "removed-initialized-notification",
        "removed-ping",
        "removed-resource-subscriptions",
        "removed-sse-resumability",
        "legacy-tasks-api",
        "removed-elicitation-complete",
        "deprecated-http-sse",
        "deprecated-include-context",
        "deprecated-dynamic-client-registration",
      ]),
    )
  })

  it("detects stable TypeScript SDK v2 migration hazards", async () => {
    const findings = await scan("fixtures/ts-v2-hazards")
    const ids = new Set(findings.map((finding) => finding.ruleId))

    expect(ids).toEqual(
      new Set([
        "ts-v2-prerelease-sdk",
        "ts-codemod-marker",
        "ts-legacy-registration-api",
        "ts-schema-first-handler",
        "ts-legacy-handler-context",
        "ts-legacy-error-api",
        "ts-internal-sdk-import",
        "ts-zod-v3",
      ]),
    )
  })

  it("does not flag stable TypeScript SDK v2 patterns", async () => {
    const findings = await scan("fixtures/ts-v2-clean")
    expect(findings).toHaveLength(0)
  })

  it("scans mts, cts, and jsx source files", async () => {
    const findings = await scan("fixtures/module-extensions")
    expect(new Set(findings.map((finding) => finding.ruleId))).toEqual(
      new Set([
        "session-assumptions",
        "error-code-32002",
        "removed-initialized-notification",
      ]),
    )
  })
})
