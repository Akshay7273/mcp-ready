import pc from "picocolors"
import type { Finding, Severity } from "./types.js"

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
      const loc = f.line ? `${f.file}:${f.line}` : f.file
      console.log(`  ${pc.bold(f.ruleId)}  ${pc.dim(loc)}`)
      console.log(`      ${f.message}`)
      if (f.fixHint) console.log(pc.dim(`      ↪ fix: ${f.fixHint}`))
      if (f.docsUrl) console.log(pc.dim(`      ↪ docs: ${f.docsUrl}`))
    }
  }
  const counts = ORDER.map((sev) => `${(groups.get(sev) ?? []).length} ${sev}`).join(", ")
  console.log(pc.bold(`\nSummary: ${counts}\n`))
}

export function renderMarkdown(findings: Finding[], target: string): string {
  const lines: string[] = [
    "# mcp-ready report",
    "",
    `Scanned: \`${target}\` · ${new Date().toISOString()}`,
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
    lines.push("| Rule | Location | Problem |", "| --- | --- | --- |")
    for (const f of list) {
      const loc = f.line ? `${f.file}:${f.line}` : f.file
      lines.push(`| \`${f.ruleId}\` | \`${loc}\` | ${f.message} |`)
    }
    lines.push("")
  }
  return lines.join("\n")
}

export function hasBreaking(findings: Finding[]): boolean {
  return findings.some((f) => f.severity === "breaking")
}
