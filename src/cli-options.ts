export type OutputFormat = "terminal" | "markdown" | "json" | "sarif"
export type FailOn = "breaking" | "deprecated" | "none"

export type CliOptions = {
  target: string
  format: OutputFormat
  output?: string
  failOn: FailOn
  legacyMarkdown: boolean
}

const FORMATS = new Set<OutputFormat>(["terminal", "markdown", "json", "sarif"])
const FAIL_LEVELS = new Set<FailOn>(["breaking", "deprecated", "none"])

function valueAfter(args: string[], index: number, option: string): string {
  const value = args[index + 1]
  if (!value || value.startsWith("-")) throw new Error(`${option} requires a value`)
  return value
}

export function parseCliOptions(args: string[]): CliOptions {
  let target = "."
  let format: OutputFormat = "terminal"
  let output: string | undefined
  let failOn: FailOn = "breaking"
  let legacyMarkdown = false
  let targetSeen = false

  for (let index = 0; index < args.length; index++) {
    const arg = args[index]
    if (arg === "--json") {
      format = "json"
    } else if (arg === "--md") {
      legacyMarkdown = true
    } else if (arg === "--format") {
      const value = valueAfter(args, index, arg) as OutputFormat
      if (!FORMATS.has(value)) throw new Error(`Unknown format: ${value}`)
      format = value
      index++
    } else if (arg === "--output" || arg === "-o") {
      output = valueAfter(args, index, arg)
      index++
    } else if (arg === "--fail-on") {
      const value = valueAfter(args, index, arg) as FailOn
      if (!FAIL_LEVELS.has(value)) throw new Error(`Unknown failure level: ${value}`)
      failOn = value
      index++
    } else if (arg.startsWith("-")) {
      throw new Error(`Unknown option: ${arg}`)
    } else if (targetSeen) {
      throw new Error(`Unexpected argument: ${arg}`)
    } else {
      target = arg
      targetSeen = true
    }
  }

  if (output && format === "terminal") {
    throw new Error("--output requires --format markdown, json, or sarif")
  }

  return { target, format, output, failOn, legacyMarkdown }
}
