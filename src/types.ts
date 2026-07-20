export type Severity = "breaking" | "deprecated" | "info"

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
}

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
  /** Which languages this rule applies to; omit for all */
  languages?: Language[]
  check: (ctx: ScanContext) => Promise<Finding[]> | Finding[]
}