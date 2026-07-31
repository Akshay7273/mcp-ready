import pc from "picocolors"
import type { FailOn } from "./cli-options.js"
import type { Finding, Rule, SdkInfo, Severity } from "./types.js"

const ORDER: Severity[] = ["breaking", "deprecated", "info"]

const LABEL: Record<Severity, string> = {
  breaking: "🔴 BREAKING",
  deprecated: "🟡 DEPRECATED",
  info: "🔵 INFO",
}

const COLOR: Record<Severity, (s: string) => string> = {
  breaking: pc.red,
  deprecated: pc.yellow,
  info: pc.cyan,
}

const ERA_LABEL = {
  legacy: "legacy (through 2025-11-25)",
  modern: "2026-07-28",
  both: "all protocol eras",
} as const

function terminalText(value: string): string {
  return value.replace(/[\u0000-\u001f\u007f-\u009f]/g, " ")
}

function markdownCell(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/\|/g, "&#124;")
    .replace(/`/g, "&#96;")
    .replace(/[\r\n]+/g, "<br>")
}

export function groupBySeverity(findings: Finding[]): Map<Severity, Finding[]> {
  const groups = new Map<Severity, Finding[]>()
  for (const sev of ORDER) groups.set(sev, [])
  for (const f of findings) groups.get(f.severity)?.push(f)
  return groups
}

export function printReport(findings: Finding[]): void {
  if (findings.length === 0) {
    console.log(
      pc.green("\n✅ No issues found. This repo looks ready for the 2026-07-28 MCP spec.\n"),
    )
    return
  }
  const groups = groupBySeverity(findings)
  for (const sev of ORDER) {
    const list = groups.get(sev) ?? []
    if (list.length === 0) continue
    console.log(COLOR[sev](pc.bold(`\n${LABEL[sev]} (${list.length})`)))
    for (const f of list) {
      const loc = terminalText(f.line ? `${f.file}:${f.line}` : f.file)
      console.log(
        `  ${pc.bold(terminalText(f.ruleId))}  ${pc.dim(loc)}  ${pc.dim(`${ERA_LABEL[f.protocolEra]} · ${f.confidence} confidence`)}`,
      )
      console.log(`      ${terminalText(f.message)}`)
      if (f.fixHint) console.log(pc.dim(`      ↪ fix: ${terminalText(f.fixHint)}`))
      if (f.docsUrl) console.log(pc.dim(`      ↪ docs: ${terminalText(f.docsUrl)}`))
    }
  }
  const counts = ORDER.map((sev) => `${(groups.get(sev) ?? []).length} ${sev}`).join(", ")
  console.log(pc.bold(`\nSummary: ${counts}\n`))
}

export function renderMarkdown(findings: Finding[], target: string): string {
  const lines: string[] = [
    "# mcp-ready report",
    "",
    `Scanned: \`${markdownCell(target)}\` · ${new Date().toISOString()}`,
    "",
  ]
  if (findings.length === 0) {
    lines.push("✅ No issues found. This repo looks ready for the 2026-07-28 MCP spec.")
    return lines.join("\n")
  }
  const groups = groupBySeverity(findings)
  for (const sev of ORDER) {
    const list = groups.get(sev) ?? []
    if (list.length === 0) continue
    lines.push(`## ${LABEL[sev]} (${list.length})`, "")
    lines.push(
      "| Rule | Location | Applies to | Confidence | Problem |",
      "| --- | --- | --- | --- | --- |",
    )
    for (const f of list) {
      const loc = f.line ? `${f.file}:${f.line}` : f.file
      lines.push(
        `| \`${markdownCell(f.ruleId)}\` | \`${markdownCell(loc)}\` | ${ERA_LABEL[f.protocolEra]} | ${f.confidence} | ${markdownCell(f.message)} |`,
      )
    }
    lines.push("")
  }
  return lines.join("\n")
}

export function hasBreaking(findings: Finding[]): boolean {
  return findings.some((f) => f.severity === "breaking")
}

export function shouldFail(findings: Finding[], failOn: FailOn): boolean {
  if (failOn === "none") return false
  if (failOn === "deprecated") {
    return findings.some((finding) =>
      ["breaking", "deprecated"].includes(finding.severity),
    )
  }
  return hasBreaking(findings)
}

export type JsonReport = {
  schemaVersion: "1"
  tool: { name: "mcp-ready"; version: string }
  specification: "2026-07-28"
  target: string
  generatedAt: string
  sdks: SdkInfo[]
  summary: Record<Severity, number> & { total: number }
  findings: Finding[]
}

export function buildJsonReport(
  findings: Finding[],
  target: string,
  sdks: SdkInfo[],
  version: string,
): JsonReport {
  const summary = {
    breaking: findings.filter((finding) => finding.severity === "breaking").length,
    deprecated: findings.filter((finding) => finding.severity === "deprecated").length,
    info: findings.filter((finding) => finding.severity === "info").length,
    total: findings.length,
  }

  return {
    schemaVersion: "1",
    tool: { name: "mcp-ready", version },
    specification: "2026-07-28",
    target,
    generatedAt: new Date().toISOString(),
    sdks,
    summary,
    findings,
  }
}

export function renderJson(
  findings: Finding[],
  target: string,
  sdks: SdkInfo[],
  version: string,
): string {
  return JSON.stringify(buildJsonReport(findings, target, sdks, version), null, 2)
}

type SarifLevel = "error" | "warning" | "note"

const SARIF_LEVEL: Record<Severity, SarifLevel> = {
  breaking: "error",
  deprecated: "warning",
  info: "note",
}

function sarifUri(file: string): string {
  return file
    .replace(/\\/g, "/")
    .split("/")
    .map((segment) => encodeURIComponent(segment))
    .join("/")
}

export type SarifReport = {
  $schema: "https://json.schemastore.org/sarif-2.1.0.json"
  version: "2.1.0"
  runs: Array<{
    tool: {
      driver: {
        name: "mcp-ready"
        version: string
        informationUri: string
        rules: Array<Record<string, unknown>>
      }
    }
    results: Array<Record<string, unknown>>
  }>
}

/** Build deterministic SARIF 2.1.0 for GitHub code scanning and other consumers. */
export function buildSarifReport(
  findings: Finding[],
  availableRules: Rule[],
  version: string,
): SarifReport {
  const ruleIndex = new Map(availableRules.map((rule, index) => [rule.id, index]))
  const descriptors = availableRules.map((rule) => ({
    id: rule.id,
    name: rule.id,
    shortDescription: { text: rule.description },
    defaultConfiguration: { level: SARIF_LEVEL[rule.severity] },
    properties: {
      severity: rule.severity,
      protocolEra: rule.protocolEra,
      confidence: rule.confidence,
      tags: ["mcp", "migration", rule.severity],
    },
  }))

  const results = findings.map((finding) => {
    const properties: Record<string, string> = {
      severity: finding.severity,
      protocolEra: finding.protocolEra,
      confidence: finding.confidence,
    }
    if (finding.fixHint) properties.fixHint = finding.fixHint
    if (finding.docsUrl) properties.docsUrl = finding.docsUrl

    return {
      ruleId: finding.ruleId,
      ruleIndex: ruleIndex.get(finding.ruleId),
      level: SARIF_LEVEL[finding.severity],
      message: { text: finding.message },
      locations: [
        {
          physicalLocation: {
            artifactLocation: {
              uri: sarifUri(finding.file),
              uriBaseId: "%SRCROOT%",
            },
            ...(finding.line ? { region: { startLine: finding.line } } : {}),
          },
        },
      ],
      properties,
    }
  })

  return {
    $schema: "https://json.schemastore.org/sarif-2.1.0.json",
    version: "2.1.0",
    runs: [
      {
        tool: {
          driver: {
            name: "mcp-ready",
            version,
            informationUri: "https://github.com/Akshay7273/mcp-ready",
            rules: descriptors,
          },
        },
        results,
      },
    ],
  }
}

export function renderSarif(
  findings: Finding[],
  availableRules: Rule[],
  version: string,
): string {
  return JSON.stringify(buildSarifReport(findings, availableRules, version), null, 2)
}
