#!/usr/bin/env node
import pc from "picocolors"
import { buildScanContext } from "./detect.js"

const VERSION = "0.1.0"

function printHelp(): void {
  console.log(`
mcp-ready — preflight checks for MCP servers

Usage:
  mcp-ready [path] [options]

Arguments:
  path            Directory to scan (default: current directory)

Options:
  -h, --help      Show this help
  -v, --version   Show version
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

  console.log(pc.bold(`\n\u2708  mcp-ready v${VERSION}`))
  console.log(pc.dim(`Scanning "${target}" for MCP SDK usage...\n`))

  const ctx = await buildScanContext(target)

  if (ctx.sdks.length === 0) {
    console.log(pc.yellow("No MCP SDK dependency found in this directory."))
    console.log(pc.dim("Looked for: TypeScript, Python, Go, and C# MCP SDKs.\n"))
    return
  }

  console.log(pc.green(`Found ${ctx.sdks.length} MCP SDK reference(s):\n`))
  for (const sdk of ctx.sdks) {
    console.log(
      `  ${pc.cyan(sdk.language.padEnd(10))} ${sdk.packageName} ${pc.dim(
        sdk.versionRange ?? "(no version)",
      )}  ${pc.dim("\u2190 " + sdk.manifestPath)}`,
    )
  }
  console.log(
    pc.dim(`\nScanned ${ctx.files.length} files. Rule checks arrive in the next build package.\n`),
  )
}

main().catch((err) => {
  console.error(
    pc.red(`mcp-ready failed: ${err instanceof Error ? err.message : String(err)}`),
  )
  process.exit(1)
})