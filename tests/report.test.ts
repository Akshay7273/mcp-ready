import { describe, expect, it } from "vitest"
import { buildJsonReport, renderMarkdown, shouldFail } from "../src/report.js"
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

  it("escapes untrusted values in Markdown tables", () => {
    const markdown = renderMarkdown(
      [{ ...finding, file: "odd|name`file.ts", message: "value | next\nline" }],
      "target`name",
    )
    expect(markdown).toContain("target&#96;name")
    expect(markdown).toContain("odd&#124;name&#96;file.ts")
    expect(markdown).toContain("value &#124; next<br>line")
  })
})
