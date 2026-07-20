#!/usr/bin/env node
import { writeFile } from "node:fs/promises"
import pc from "picocolors"
import { buildScanContext } from "./detect.js"
import { hasBreaking, printReport, renderMarkdown } from "./report.js"
import { rules } from "./rules/index.js"
import type { Finding } from "./types.js"

const VERSION = "0.1.0"

function printHelp(): void {
  console.log(`
mcp-ready — is your MCP server ready for the 2026-07-28 spec?

Usage:
  mcp-ready [path] [options]

Arguments:
  path            Directory to scan (default: current directory)

Options:
  --md            Also write a markdown report (mcp-ready-report.md)
  -h, --help      Show this help
  -v, --version   Show version

Exit codes:
  0  no breaking findings
  1  at least one breaking finding (CI-friendly)
`)
}

async function main(): Promise<void> {
  const args = process.argv.slice(2)
  if (args.includes("--help") || args.includes("-h")) {
    printHelp()
    return
  }
  if (args.includes("--version") || args.includes("-v")) {
    console.log(VERSION)
    return
  }

  const target = args.find((a) => !a.startsWith("-")) ?? "."
  const writeMd = args.includes("--md")

  console.log(pc.bold(`\n\u2708  mcp-ready v${VERSION}`))
  console.log(pc.dim(`Scanning "${target}" against the MCP 2026-07-28 revision...\n`))

  const ctx = await buildScanContext(target)

  if (ctx.sdks.length === 0) {
    console.log(pc.yellow("No MCP SDK dependency found — running generic protocol checks anyway."))
  } else {
    console.log(pc.green(`Found ${ctx.sdks.length} MCP SDK reference(s):`))
    for (const sdk of ctx.sdks) {
      console.log(
        `  ${pc.cyan(sdk.language.padEnd(10))} ${sdk.packageName} ${pc.dim(
          sdk.versionRange ?? "(no version)",
        )}  ${pc.dim("\u2190 " + sdk.manifestPath)}`,
      )
    }
  }

  const findings: Finding[] = []
  for (const rule of rules) {
    findings.push(...(await rule.check(ctx)))
  }

  printReport(findings)
  console.log(pc.dim(`Scanned ${ctx.files.length} files with ${rules.length} rules.\n`))

  if (writeMd) {
    await writeFile("mcp-ready-report.md", renderMarkdown(findings, target), "utf8")
    console.log(pc.dim("Markdown report written to mcp-ready-report.md\n"))
  }

  if (hasBreaking(findings)) process.exitCode = 1
}

main().catch((err) => {
  console.error(pc.red(`mcp-ready failed: ${err instanceof Error ? err.message : String(err)}`))
  process.exit(1)
})