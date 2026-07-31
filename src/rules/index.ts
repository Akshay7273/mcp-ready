import type { FindingDraft, Rule } from "../types.js"
import { finalSpecRules } from "./final-spec.js"
import { typescriptV2Rules } from "./typescript-v2.js"
import { searchSourceFiles } from "./util.js"

const DOCS = {
  changelog: "https://modelcontextprotocol.io/specification/2026-07-28/changelog",
  tsMigration:
    "https://github.com/modelcontextprotocol/typescript-sdk/blob/main/docs/migration/upgrade-to-v2.md",
  pyMigration: "https://py.sdk.modelcontextprotocol.io/v2/migration/",
}

// ---------------------------------------------------------------------------
// Breaking rules
// ---------------------------------------------------------------------------

const tsMonolithSdk: Rule = {
  id: "ts-monolith-sdk",
  severity: "breaking",
  description: "Monolithic @modelcontextprotocol/sdk is replaced by split packages in v2",
  protocolEra: "modern",
  confidence: "high",
  check(ctx) {
    return ctx.sdks
      .filter((s) => s.packageName === "@modelcontextprotocol/sdk")
      .map(
        (s): FindingDraft => ({
          ruleId: "ts-monolith-sdk",
          severity: "breaking",
          message: `Monolithic @modelcontextprotocol/sdk (${s.versionRange ?? "unversioned"}) detected. v2 splits it into @modelcontextprotocol/server, @modelcontextprotocol/client, and @modelcontextprotocol/core (Node 20+, ESM and CommonJS).`,
          file: s.manifestPath,
          fixHint: "npx @modelcontextprotocol/codemod@latest v1-to-v2 .",
          docsUrl: DOCS.tsMigration,
        }),
      )
  },
}

const errorCode32002: Rule = {
  id: "error-code-32002",
  severity: "breaking",
  description: "Resource-not-found error code changed from -32002 to -32602",
  protocolEra: "modern",
  confidence: "high",
  async check(ctx) {
    const matches = await searchSourceFiles(ctx, /-32002\b/)
    return matches.map(
      (m): FindingDraft => ({
        ruleId: "error-code-32002",
        severity: "breaking",
        message:
          "Literal -32002 error code found. The 2026-07-28 revision uses standard JSON-RPC -32602 (Invalid Params) for missing resources.",
        file: m.file,
        line: m.line,
        fixHint: "Match on -32602, or on both codes during the transition.",
        docsUrl: DOCS.changelog,
      }),
    )
  },
}

const sessionAssumptions: Rule = {
  id: "session-assumptions",
  severity: "breaking",
  description: "Session headers are removed by the stateless core rework",
  protocolEra: "modern",
  confidence: "high",
  async check(ctx) {
    const matches = await searchSourceFiles(ctx, /mcp-session-id/i)
    return matches.map(
      (m): FindingDraft => ({
        ruleId: "session-assumptions",
        severity: "breaking",
        message:
          "Mcp-Session-Id header usage found. The 2026-07-28 stateless core removes protocol-level sessions.",
        file: m.file,
        line: m.line,
        fixHint: "Move session state into your application layer or server configuration.",
        docsUrl: DOCS.changelog,
      }),
    )
  },
}

const pySdkV1: Rule = {
  id: "py-sdk-v1",
  severity: "breaking",
  description: "FastMCP is renamed to MCPServer in mcp v2",
  protocolEra: "modern",
  confidence: "high",
  async check(ctx) {
    if (!ctx.sdks.some((sdk) => sdk.language === "python")) return []
    const matches = await searchSourceFiles(
      ctx,
      /\bFastMCP\b/,
      (file) => file.endsWith(".py"),
      (content) =>
        /from\s+mcp\.server\.fastmcp(?:\.\w+)?\s+import\s+(?:\([^)]{0,500}\)|[^\n]*)\bFastMCP\b/.test(
          content,
        ),
    )
    const firstMatchByFile = [...new Map(matches.map((match) => [match.file, match])).values()]
    return firstMatchByFile.map(
      (m): FindingDraft => ({
        ruleId: "py-sdk-v1",
        severity: "breaking",
        message:
          "FastMCP usage found. In mcp v2 the class is renamed to MCPServer (the decorator API carries over).",
        file: m.file,
        line: m.line,
        fixHint: "Rename FastMCP to MCPServer when upgrading to mcp v2.",
        docsUrl: DOCS.pyMigration,
      }),
    )
  },
}

// ---------------------------------------------------------------------------
// Deprecated rules
// ---------------------------------------------------------------------------

const deprecatedRoots: Rule = {
  id: "deprecated-roots",
  severity: "deprecated",
  description: "Roots are deprecated in the 2026-07-28 revision",
  protocolEra: "modern",
  confidence: "high",
  async check(ctx) {
    const matches = await searchSourceFiles(
      ctx,
      /roots\/list|\.listRoots\s*\(|list_roots\s*\(|RootsCapability/,
    )
    return matches.map(
      (m): FindingDraft => ({
        ruleId: "deprecated-roots",
        severity: "deprecated",
        message:
          "Roots usage detected — deprecated in the 2026-07-28 revision. Replace with tool parameters, resource URIs, or server configuration.",
        file: m.file,
        line: m.line,
        docsUrl: DOCS.changelog,
      }),
    )
  },
}

const deprecatedSampling: Rule = {
  id: "deprecated-sampling",
  severity: "deprecated",
  description: "Sampling is deprecated in the 2026-07-28 revision",
  protocolEra: "modern",
  confidence: "high",
  async check(ctx) {
    const matches = await searchSourceFiles(
      ctx,
      /sampling\/createMessage|\.createMessage\s*\(|create_message\s*\(|SamplingCapability/,
    )
    return matches.map(
      (m): FindingDraft => ({
        ruleId: "deprecated-sampling",
        severity: "deprecated",
        message:
          "Sampling usage detected — deprecated in the 2026-07-28 revision under the feature lifecycle policy.",
        file: m.file,
        line: m.line,
        docsUrl: DOCS.changelog,
      }),
    )
  },
}

const deprecatedLogging: Rule = {
  id: "deprecated-logging",
  severity: "deprecated",
  description: "MCP logging capability is deprecated in the 2026-07-28 revision",
  protocolEra: "modern",
  confidence: "high",
  async check(ctx) {
    const matches = await searchSourceFiles(
      ctx,
      /sendLoggingMessage|LoggingMessageNotification/,
    )
    return matches.map(
      (m): FindingDraft => ({
        ruleId: "deprecated-logging",
        severity: "deprecated",
        message:
          "MCP logging capability usage detected — deprecated. Use stderr for stdio transports, or OpenTelemetry for structured observability.",
        file: m.file,
        line: m.line,
        docsUrl: DOCS.changelog,
      }),
    )
  },
}

const pyUnboundedDep: Rule = {
  id: "py-unbounded-dep",
  severity: "deprecated",
  description: "Python mcp dependency without an upper version bound",
  protocolEra: "modern",
  confidence: "medium",
  check(ctx) {
    return ctx.sdks
      .filter(
        (s) =>
          s.language === "python" &&
          (!s.versionRange ||
            (!/<\s*2(?:\.0+)?\b/.test(s.versionRange) &&
              !/==\s*1(?:\.\d+)+(?:\.\*)?\s*$/.test(s.versionRange) &&
              !/(?:>=|>|~=)\s*2(?:\.|\b)/.test(s.versionRange))),
      )
      .map(
        (s): FindingDraft => ({
          ruleId: "py-unbounded-dep",
          severity: "deprecated",
          message: `Python dependency on "mcp" can resolve across the v2 major boundary (${s.versionRange ?? "no constraint"}). Stable v2 contains breaking API changes.`,
          file: s.manifestPath,
          fixHint: "Pin the legacy line with mcp>=1.29,<2, or migrate explicitly to mcp>=2,<3.",
          docsUrl: DOCS.pyMigration,
        }),
      )
  },
}

// ---------------------------------------------------------------------------
// Info rules
// ---------------------------------------------------------------------------

const schema202012: Rule = {
  id: "schema-2020-12",
  severity: "info",
  description: "Tool schemas may use full JSON Schema 2020-12 in the new revision",
  protocolEra: "modern",
  confidence: "low",
  async check(ctx) {
    const matches = await searchSourceFiles(ctx, /inputSchema|input_schema/)
    if (matches.length === 0) return []
    const m = matches[0]
    return [
      {
        ruleId: "schema-2020-12",
        severity: "info",
        message:
          "Tool schemas can use full JSON Schema 2020-12 in the new revision: composition (oneOf/anyOf/allOf), conditionals, and $ref/$defs are now allowed in inputSchema; structuredContent may be any JSON value.",
        file: m.file,
        line: m.line,
        docsUrl: DOCS.changelog,
      },
    ]
  },
}

export const rules: Rule[] = [
  tsMonolithSdk,
  errorCode32002,
  sessionAssumptions,
  pySdkV1,
  deprecatedRoots,
  deprecatedSampling,
  deprecatedLogging,
  pyUnboundedDep,
  schema202012,
  ...finalSpecRules,
  ...typescriptV2Rules,
]
