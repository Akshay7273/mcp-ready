import { readFile, realpath, writeFile } from "node:fs/promises"
import path from "node:path"
import type { Finding } from "./types.js"

export type BaselineEntry = {
  ruleId: string
  file: string
  line?: number
}

export type BaselineFile = {
  schemaVersion: "1"
  findings: BaselineEntry[]
}

export type Suppression = BaselineEntry & {
  reason: string
}

export type PolicyConfig = {
  schemaVersion: "1"
  baseline?: string
  suppressions: Suppression[]
}

export type AcceptedFinding = Finding & {
  disposition: "baseline" | "suppressed"
  reason?: string
}

export type PolicyEvaluation = {
  findings: Finding[]
  accepted: AcceptedFinding[]
  staleBaseline: BaselineEntry[]
  baselineCandidates: Finding[]
  configPath?: string
  baselinePath?: string
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value)
}

function normalizeFile(file: string): string {
  return file.replace(/\\/g, "/").replace(/^\.\//, "")
}

function parseEntry(value: unknown, label: string): BaselineEntry {
  if (!isRecord(value) || typeof value.ruleId !== "string" || typeof value.file !== "string") {
    throw new Error(`${label} must contain string ruleId and file fields`)
  }
  if (value.line !== undefined && (!Number.isInteger(value.line) || Number(value.line) < 1)) {
    throw new Error(`${label}.line must be a positive integer`)
  }
  return {
    ruleId: value.ruleId,
    file: normalizeFile(value.file),
    ...(value.line === undefined ? {} : { line: Number(value.line) }),
  }
}

function entryKey(entry: BaselineEntry): string {
  return `${entry.ruleId}\u0000${normalizeFile(entry.file)}\u0000${entry.line ?? ""}`
}

function assertWithinRoot(rootDir: string, candidate: string, label: string): string {
  const absolute = path.resolve(candidate)
  const relative = path.relative(rootDir, absolute)
  if (relative.startsWith("..") || path.isAbsolute(relative)) {
    throw new Error(`${label} must stay inside the scan target`)
  }
  return absolute
}

function isMissingFile(error: unknown): boolean {
  return isRecord(error) && error.code === "ENOENT"
}

async function readJson(file: string, label: string): Promise<unknown> {
  try {
    return JSON.parse(await readFile(file, "utf8"))
  } catch (error) {
    if (error instanceof SyntaxError) throw new Error(`${label} is not valid JSON: ${file}`)
    throw error
  }
}

function parseBaseline(value: unknown): BaselineFile {
  if (!isRecord(value) || value.schemaVersion !== "1" || !Array.isArray(value.findings)) {
    throw new Error('Baseline must have schemaVersion "1" and a findings array')
  }
  const findings = value.findings.map((entry, index) =>
    parseEntry(entry, `baseline.findings[${index}]`),
  )
  const keys = findings.map(entryKey)
  if (new Set(keys).size !== keys.length) throw new Error("Baseline contains duplicate entries")
  return { schemaVersion: "1", findings }
}

export async function loadPolicy(
  rootDir: string,
  explicitConfig: string | undefined,
  knownRuleIds: Set<string>,
): Promise<{ config: PolicyConfig; baseline: BaselineFile; configPath?: string; baselinePath?: string }> {
  const defaultPath = path.join(rootDir, ".mcp-ready.json")
  const lexicalConfigPath = assertWithinRoot(
    rootDir,
    explicitConfig ? path.resolve(explicitConfig) : defaultPath,
    "Configuration path",
  )
  const realRoot = await realpath(rootDir)

  let configPath: string
  try {
    configPath = assertWithinRoot(realRoot, await realpath(lexicalConfigPath), "Configuration path")
  } catch (error) {
    if (!explicitConfig && isMissingFile(error)) {
      return {
        config: { schemaVersion: "1", suppressions: [] },
        baseline: { schemaVersion: "1", findings: [] },
      }
    }
    throw error
  }

  const rawConfig = await readJson(configPath, "Configuration")

  if (!isRecord(rawConfig) || rawConfig.schemaVersion !== "1") {
    throw new Error('Configuration must have schemaVersion "1"')
  }
  if (rawConfig.baseline !== undefined && typeof rawConfig.baseline !== "string") {
    throw new Error("Configuration baseline must be a string path")
  }
  if (rawConfig.suppressions !== undefined && !Array.isArray(rawConfig.suppressions)) {
    throw new Error("Configuration suppressions must be an array")
  }

  const suppressions = (rawConfig.suppressions ?? []).map((value, index) => {
    const entry = parseEntry(value, `suppressions[${index}]`)
    if (!isRecord(value) || typeof value.reason !== "string" || value.reason.trim() === "") {
      throw new Error(`suppressions[${index}].reason must be a non-empty string`)
    }
    if (!knownRuleIds.has(entry.ruleId)) {
      throw new Error(`Unknown suppression rule: ${entry.ruleId}`)
    }
    return { ...entry, reason: value.reason }
  })

  const config: PolicyConfig = {
    schemaVersion: "1",
    ...(typeof rawConfig.baseline === "string" ? { baseline: rawConfig.baseline } : {}),
    suppressions,
  }
  if (!config.baseline) {
    return {
      config,
      baseline: { schemaVersion: "1", findings: [] },
      configPath,
    }
  }

  const lexicalBaselinePath = assertWithinRoot(
    rootDir,
    path.resolve(path.dirname(configPath), config.baseline),
    "Baseline path",
  )
  const baselinePath = assertWithinRoot(
    realRoot,
    await realpath(lexicalBaselinePath),
    "Baseline path",
  )
  const baseline = parseBaseline(await readJson(baselinePath, "Baseline"))
  for (const entry of baseline.findings) {
    if (!knownRuleIds.has(entry.ruleId)) throw new Error(`Unknown baseline rule: ${entry.ruleId}`)
  }
  return { config, baseline, configPath, baselinePath }
}

export function applyPolicy(
  findings: Finding[],
  config: PolicyConfig,
  baseline: BaselineFile,
  paths: { configPath?: string; baselinePath?: string } = {},
): PolicyEvaluation {
  const active: Finding[] = []
  const accepted: AcceptedFinding[] = []
  const baselineCandidates: Finding[] = []
  const baselineKeys = new Set(baseline.findings.map(entryKey))
  const usedBaselineKeys = new Set<string>()

  for (const finding of findings) {
    const suppression = config.suppressions.find(
      (entry) =>
        entry.ruleId === finding.ruleId &&
        entry.file === normalizeFile(finding.file) &&
        (entry.line === undefined || entry.line === finding.line),
    )
    if (suppression) {
      accepted.push({ ...finding, disposition: "suppressed", reason: suppression.reason })
      continue
    }

    baselineCandidates.push(finding)
    const key = entryKey(finding)
    if (baselineKeys.has(key)) {
      usedBaselineKeys.add(key)
      accepted.push({ ...finding, disposition: "baseline" })
    } else {
      active.push(finding)
    }
  }

  return {
    findings: active,
    accepted,
    staleBaseline: baseline.findings.filter((entry) => !usedBaselineKeys.has(entryKey(entry))),
    baselineCandidates,
    ...paths,
  }
}

export async function writeBaseline(file: string, findings: Finding[]): Promise<void> {
  const entries = findings
    .map(({ ruleId, file: findingFile, line }) => ({
      ruleId,
      file: normalizeFile(findingFile),
      ...(line === undefined ? {} : { line }),
    }))
  const uniqueEntries = [...new Map(entries.map((entry) => [entryKey(entry), entry])).values()]
    .sort((a, b) =>
      a.file.localeCompare(b.file) || a.ruleId.localeCompare(b.ruleId) || (a.line ?? 0) - (b.line ?? 0),
    )
  const baseline: BaselineFile = { schemaVersion: "1", findings: uniqueEntries }
  await writeFile(file, `${JSON.stringify(baseline, null, 2)}\n`, "utf8")
}
