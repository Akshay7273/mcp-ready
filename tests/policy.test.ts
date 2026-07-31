import { mkdtemp, mkdir, readFile, writeFile } from "node:fs/promises"
import { tmpdir } from "node:os"
import path from "node:path"
import { describe, expect, it } from "vitest"
import { applyPolicy, loadPolicy, writeBaseline } from "../src/policy.js"
import type { Finding } from "../src/types.js"

const finding = (ruleId: string, file: string, line?: number): Finding => ({
  ruleId,
  severity: "breaking",
  message: `${ruleId} message`,
  file,
  line,
  protocolEra: "modern",
  confidence: "high",
})

describe("finding policy", () => {
  it("applies explicit suppressions before the baseline and retains new findings", () => {
    const suppressed = finding("removed-ping", "src/server.ts", 4)
    const known = finding("removed-ping", "src/server.ts", 8)
    const regression = finding("removed-ping", "src/server.ts", 12)
    const result = applyPolicy(
      [suppressed, known, regression],
      {
        schemaVersion: "1",
        suppressions: [
          {
            ruleId: "removed-ping",
            file: "src/server.ts",
            line: 4,
            reason: "Transport compatibility probe",
          },
        ],
      },
      {
        schemaVersion: "1",
        findings: [
          { ruleId: "removed-ping", file: "src/server.ts", line: 4 },
          { ruleId: "removed-ping", file: "src/server.ts", line: 8 },
          { ruleId: "removed-ping", file: "src/removed.ts", line: 2 },
        ],
      },
    )

    expect(result.findings).toEqual([regression])
    expect(result.accepted).toEqual([
      expect.objectContaining({ line: 4, disposition: "suppressed" }),
      expect.objectContaining({ line: 8, disposition: "baseline" }),
    ])
    expect(result.staleBaseline).toEqual([
      { ruleId: "removed-ping", file: "src/server.ts", line: 4 },
      { ruleId: "removed-ping", file: "src/removed.ts", line: 2 },
    ])
    expect(result.baselineCandidates).toEqual([known, regression])
  })

  it("loads a target-owned config and baseline", async () => {
    const root = await mkdtemp(path.join(tmpdir(), "mcp-ready-policy-"))
    await mkdir(path.join(root, "config"))
    await writeFile(
      path.join(root, ".mcp-ready.json"),
      JSON.stringify({
        schemaVersion: "1",
        baseline: "config/baseline.json",
        suppressions: [
          { ruleId: "removed-ping", file: "server.ts", reason: "Intentional probe" },
        ],
      }),
    )
    await writeFile(
      path.join(root, "config", "baseline.json"),
      JSON.stringify({
        schemaVersion: "1",
        findings: [{ ruleId: "removed-ping", file: "server.ts", line: 3 }],
      }),
    )

    const loaded = await loadPolicy(root, undefined, new Set(["removed-ping"]))
    expect(loaded.config.suppressions[0].reason).toBe("Intentional probe")
    expect(loaded.baseline.findings[0].line).toBe(3)
  })

  it("rejects baseline paths outside the scan target", async () => {
    const root = await mkdtemp(path.join(tmpdir(), "mcp-ready-policy-"))
    await writeFile(
      path.join(root, ".mcp-ready.json"),
      JSON.stringify({ schemaVersion: "1", baseline: "../outside.json" }),
    )
    await expect(loadPolicy(root, undefined, new Set())).rejects.toThrow(
      "Baseline path must stay inside",
    )
  })

  it("writes sorted, readable baseline entries", async () => {
    const root = await mkdtemp(path.join(tmpdir(), "mcp-ready-policy-"))
    const output = path.join(root, "baseline.json")
    await writeBaseline(output, [
      finding("z-rule", "z.ts", 9),
      finding("b-rule", "a.ts", 2),
      finding("a-rule", "a.ts", 2),
    ])
    const baseline = JSON.parse(await readFile(output, "utf8"))
    expect(baseline.findings).toEqual([
      { ruleId: "a-rule", file: "a.ts", line: 2 },
      { ruleId: "b-rule", file: "a.ts", line: 2 },
      { ruleId: "z-rule", file: "z.ts", line: 9 },
    ])
  })
})
