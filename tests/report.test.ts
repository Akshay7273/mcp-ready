import { describe, expect, it } from "vitest"
import { buildJsonReport, shouldFail } from "../src/report.js"
import type { Finding } from "../src/types.js"

const finding: Finding = {
  ruleId: "example",
  severity: "deprecated",
  message: "Example",
  file: "server.ts",
  protocolEra: "modern",
  confidence: "high",
}

describe("machine-readable reports", () => {
  it("builds a versioned JSON report with a summary", () => {
    const report = buildJsonReport([finding], ".", [], "0.2.0")
    expect(report.schemaVersion).toBe("1")
    expect(report.specification).toBe("2026-07-28")
    expect(report.summary).toEqual({ breaking: 0, deprecated: 1, info: 0, total: 1 })
  })

  it("supports configurable failure thresholds", () => {
    expect(shouldFail([finding], "breaking")).toBe(false)
    expect(shouldFail([finding], "deprecated")).toBe(true)
    expect(shouldFail([finding], "none")).toBe(false)
  })
})
