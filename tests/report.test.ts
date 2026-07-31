import { describe, expect, it } from "vitest"
import { buildJsonReport, buildSarifReport, renderMarkdown, shouldFail } from "../src/report.js"
import type { Finding, Rule } from "../src/types.js"

const finding: Finding = {
  ruleId: "example",
  severity: "deprecated",
  message: "Example",
  file: "server.ts",
  protocolEra: "modern",
  confidence: "high",
}

const rule: Rule = {
  id: "example",
  severity: "deprecated",
  description: "Example rule",
  protocolEra: "modern",
  confidence: "high",
  check: () => [],
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

  it("builds deterministic SARIF 2.1.0 rule and result metadata", () => {
    const report = buildSarifReport(
      [
        {
          ...finding,
          file: "src\\server name.ts",
          line: 12,
          fixHint: "Replace the old call.",
          docsUrl: "https://example.test/migration",
        },
      ],
      [rule],
      "0.3.0",
    )

    expect(report.$schema).toBe("https://json.schemastore.org/sarif-2.1.0.json")
    expect(report.version).toBe("2.1.0")
    expect(report.runs[0].tool.driver.rules[0]).toMatchObject({
      id: "example",
      defaultConfiguration: { level: "warning" },
      properties: { protocolEra: "modern", confidence: "high" },
    })
    expect(report.runs[0].results[0]).toMatchObject({
      ruleId: "example",
      ruleIndex: 0,
      level: "warning",
      locations: [
        {
          physicalLocation: {
            artifactLocation: { uri: "src/server%20name.ts", uriBaseId: "%SRCROOT%" },
            region: { startLine: 12 },
          },
        },
      ],
      properties: {
        fixHint: "Replace the old call.",
        docsUrl: "https://example.test/migration",
      },
    })
  })
})
