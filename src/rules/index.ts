import type { Finding, Rule } from "../types.js"
import { searchSourceFiles } from "./util.js"

const DOCS = {
  releasePost: "https://blog.modelcontextprotocol.io/posts/2026-07-28-release-candidate/",
  sdkBetas: "https://blog.modelcontextprotocol.io/posts/sdk-betas-2026-07-28/",
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
  check(ctx) {
    return ctx.sdks
      .filter((s) => s.packageName === "@modelcontextprotocol/sdk")
      .map(
        (s): Finding => ({
          ruleId: "ts-monolith-sdk",
          severity: "breaking",
          message: `Monolithic @modelcontextprotocol/sdk (${s.versionRange ?? "unversioned"}) detected. v2 splits it into @modelcontextprotocol/server and @modelcontextprotocol/client (ESM-only, Node 20+).`,
          file: s.manifestPath,
          fixHint: "npx @modelcontextprotocol/codemod@beta v1-to-v2 .",
          docsUrl: DOCS.tsMigration,
        }),
      )
  },
}

const errorCode32002: Rule = {
  id: "error-code-32002",
  severity: "breaking",
  description: "Resource-not-found error code changed from -32002 to -32602",
  async check(ctx) {
    const matches = await searchSourceFiles(ctx, /-32002\b/)
    return matches.map(
      (m): Finding => ({
        ruleId: "error-code-32002",
        severity: "breaking",
        message:
          "Literal -32002 error code found. The 2026-07-28 revision uses standard JSON-RPC -32602 (Invalid Params) for missing resources.",
        file: m.file,
        line: m.line,
        fixHint: "Match on -32602, or on both codes during the transition.",
        docsUrl: DOCS.releasePost,
      }),
    )
  },
}

const sessionAssumptions: Rule = {
  id: "session-assumptions",
  severity: "breaking",
  description: "Session headers are removed by the stateless core rework",
  async check(ctx) {
    const matches = await searchSourceFiles(ctx, /mcp-session-id/i)
    return matches.map(
      (m): Finding => ({
        ruleId: "session-assumptions",
        severity: "breaking",
        message:
          "Mcp-Session-Id header usage found. The 2026-07-28 stateless core removes protocol-level sessions.",
        file: m.file,
        line: m.line,
        fixHint: "Move session state into your application layer or server configuration.",
        docsUrl: DOCS.releasePost,
      }),
    )
  },
}

const pySdkV1: Rule = {
  id: "py-sdk-v1",
  severity: "breaking",
  description: "FastMCP is renamed to MCPServer in mcp v2",
  async check(ctx) {
    const matches = await searchSourceFiles(ctx, /\bFastMCP\b/, (f) => f.endsWith(".py"))
    return matches.map(
      (m): Finding => ({
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
  async check(ctx) {
    const matches = await searchSourceFiles(
      ctx,
      /roots\/list|\.listRoots\s*\(|list_roots\s*\(|RootsCapability/,
    )
    return matches.map(
      (m): Finding => ({
        ruleId: "deprecated-roots",
        severity: "deprecated",
        message:
          "Roots usage detected — deprecated in the 2026-07-28 revision. Replace with tool parameters, resource URIs, or server configuration.",
        file: m.file,
        line: m.line,
        docsUrl: DOCS.releasePost,
      }),
    )
  },
}

const deprecatedSampling: Rule = {
  id: "deprecated-sampling",
  severity: "deprecated",
  description: "Sampling is deprecated in the 2026-07-28 revision",
  async check(ctx) {
    const matches = await searchSourceFiles(
      ctx,
      /sampling\/createMessage|\.createMessage\s*\(|create_message\s*\(|SamplingCapability/,
    )
    return matches.map(
      (m): Finding => ({
        ruleId: "deprecated-sampling",
        severity: "deprecated",
        message:
          "Sampling usage detected — deprecated in the 2026-07-28 revision under the feature lifecycle policy.",
        file: m.file,
        line: m.line,
        docsUrl: DOCS.releasePost,
      }),
    )
  },
}

const deprecatedLogging: Rule = {
  id: "deprecated-logging",
  severity: "deprecated",
  description: "MCP logging capability is deprecated in the 2026-07-28 revision",
  async check(ctx) {
    const matches = await searchSourceFiles(
      ctx,
      /logging\/setLevel|sendLoggingMessage|LoggingMessageNotification/,
    )
    return matches.map(
      (m): Finding => ({
        ruleId: "deprecated-logging",
        severity: "deprecated",
        message:
          "MCP logging capability usage detected — deprecated. Use stderr for stdio transports, or OpenTelemetry for structured observability.",
        file: m.file,
        line: m.line,
        docsUrl: DOCS.releasePost,
      }),
    )
  },
}

const pyUnboundedDep: Rule = {
  id: "py-unbounded-dep",
  severity: "deprecated",
  description: "Python mcp dependency without an upper version bound",
  check(ctx) {
    return ctx.sdks
      .filter(
        (s) => s.language === "python" && (!s.versionRange || !s.versionRange.includes("<")),
      )
      .map(
        (s): Finding => ({
          ruleId: "py-unbounded-dep",
          severity: "deprecated",
          message: `Python dependency on "mcp" has no upper version bound (${s.versionRange ?? "no constraint"}). Pin it so the v2 stable release does not surprise your users.`,
          file: s.manifestPath,
          fixHint: "Change the requirement to: mcp>=1.27,<2",
          docsUrl: DOCS.sdkBetas,
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
        docsUrl: DOCS.releasePost,
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
]
