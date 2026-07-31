export type Severity = "breaking" | "deprecated" | "info"

export type ProtocolEra = "legacy" | "modern" | "both"

export type Confidence = "high" | "medium" | "low"

export type Language = "typescript" | "javascript" | "python" | "go" | "csharp" | "unknown"

export type SdkInfo = {
  language: Language
  /** e.g. "@modelcontextprotocol/sdk", "mcp", "github.com/modelcontextprotocol/go-sdk" */
  packageName: string
  /** Raw version constraint found in the manifest, e.g. "^1.12.0" */
  versionRange: string | null
  /** Which manifest file this was found in (relative path) */
  manifestPath: string
}

export type Finding = {
  ruleId: string
  severity: Severity
  message: string
  file: string
  line?: number
  fixHint?: string
  docsUrl?: string
  /** Protocol era where the finding matters. Modern means 2026-07-28. */
  protocolEra: ProtocolEra
  /** Static-analysis certainty for this finding. */
  confidence: Confidence
}

export type FindingDraft = Omit<Finding, "protocolEra" | "confidence">

export type ScanContext = {
  rootDir: string
  sdks: SdkInfo[]
  /** All scannable source/manifest files (relative paths) */
  files: string[]
  /** Read a file's content (cached) */
  read: (relPath: string) => Promise<string>
}

export type Rule = {
  id: string
  severity: Severity
  description: string
  protocolEra: ProtocolEra
  confidence: Confidence
  /** Which languages this rule applies to; omit for all */
  languages?: Language[]
  check: (ctx: ScanContext) => Promise<FindingDraft[]> | FindingDraft[]
}
