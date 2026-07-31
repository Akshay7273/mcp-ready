#!/usr/bin/env node
import { writeFile } from "node:fs/promises"
import pc from "picocolors"
import { parseCliOptions } from "./cli-options.js"
import { buildScanContext } from "./detect.js"
import { applyPolicy, loadPolicy, writeBaseline } from "./policy.js"
import { printReport, renderJson, renderMarkdown, renderSarif, shouldFail } from "./report.js"
import { rules } from "./rules/index.js"
import { runRules } from "./scan.js"
import { VERSION } from "./version.js"

function printHelp(): void {
  console.log(`
mcp-ready — is your MCP server ready for the 2026-07-28 spec?

Usage:
  mcp-ready [path] [options]

Arguments:
  path            Directory to scan (default: current directory)

Options:
  --format <type> Output format: terminal, markdown, json, or sarif
  --json          Alias for --format json
  --output, -o    Write Markdown, JSON, or SARIF output to a file
  --config        Use a specific .mcp-ready.json configuration
  --write-baseline Write current unsuppressed findings to a baseline file
  --fail-on       Failure threshold: breaking, deprecated, or none
  --md            Also write mcp-ready-report.md (legacy convenience option)
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

  const options = parseCliOptions(args)
  const { target } = options

  if (options.format === "terminal") {
    console.log(pc.bold(`\n\u2708  mcp-ready v${VERSION}`))
    console.log(pc.dim(`Scanning "${target}" against the final MCP 2026-07-28 revision...\n`))
  }

  const ctx = await buildScanContext(target)

  if (options.format === "terminal" && ctx.sdks.length === 0) {
    console.log(pc.yellow("No MCP SDK dependency found — running generic protocol checks anyway."))
  } else if (options.format === "terminal") {
    console.log(pc.green(`Found ${ctx.sdks.length} MCP SDK reference(s):`))
    for (const sdk of ctx.sdks) {
      console.log(
        `  ${pc.cyan(sdk.language.padEnd(10))} ${sdk.packageName} ${pc.dim(
          sdk.versionRange ?? "(no version)",
        )}  ${pc.dim("\u2190 " + sdk.manifestPath)}`,
      )
    }
  }

  const findings = await runRules(ctx, rules)
  const loadedPolicy = await loadPolicy(
    ctx.rootDir,
    options.config,
    new Set(rules.map((rule) => rule.id)),
  )
  const evaluation = applyPolicy(findings, loadedPolicy.config, loadedPolicy.baseline, {
    configPath: loadedPolicy.configPath,
    baselinePath: loadedPolicy.baselinePath,
  })

  if (options.writeBaseline) {
    await writeBaseline(options.writeBaseline, evaluation.baselineCandidates)
  }

  let rendered: string | undefined
  if (options.format === "terminal") {
    printReport(evaluation.findings, evaluation)
    console.log(pc.dim(`Scanned ${ctx.files.length} files with ${rules.length} rules.\n`))
  } else if (options.format === "markdown") {
    rendered = renderMarkdown(evaluation.findings, target, evaluation)
  } else if (options.format === "json") {
    rendered = renderJson(evaluation.findings, target, ctx.sdks, VERSION, evaluation)
  } else {
    rendered = renderSarif(evaluation.findings, rules, VERSION)
  }

  if (rendered && options.output) {
    await writeFile(options.output, rendered, "utf8")
  } else if (rendered) {
    console.log(rendered)
  }

  if (options.legacyMarkdown) {
    await writeFile("mcp-ready-report.md", renderMarkdown(evaluation.findings, target, evaluation), "utf8")
    if (options.format === "terminal") {
      console.log(pc.dim("Markdown report written to mcp-ready-report.md\n"))
    }
  }

  if (shouldFail(evaluation.findings, options.failOn)) process.exitCode = 1
}

main().catch((err) => {
  console.error(pc.red(`mcp-ready failed: ${err instanceof Error ? err.message : String(err)}`))
  process.exit(1)
})
