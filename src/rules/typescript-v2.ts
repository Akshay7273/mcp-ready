import path from "node:path"
import type { FindingDraft, Rule } from "../types.js"
import { searchSourceFiles } from "./util.js"

const MIGRATION_GUIDE =
  "https://github.com/modelcontextprotocol/typescript-sdk/blob/main/docs/migration/upgrade-to-v2.md"

const isTypeScriptSource = (file: string): boolean => /\.[cm]?[jt]sx?$/.test(file)
const importsMcpSdk = (content: string): boolean =>
  /(?:from\s*|require\(\s*|import\(\s*)["']@modelcontextprotocol\//.test(content)

function migrationFinding(
  ruleId: string,
  message: string,
  file: string,
  fixHint: string,
  line?: number,
): FindingDraft {
  return {
    ruleId,
    severity: "breaking",
    message,
    file,
    line,
    fixHint,
    docsUrl: MIGRATION_GUIDE,
  }
}

const prereleaseSdk: Rule = {
  id: "ts-v2-prerelease-sdk",
  severity: "breaking",
  description: "TypeScript SDK v2 prerelease ranges should move to the stable package family",
  protocolEra: "modern",
  confidence: "high",
  check(ctx) {
    return ctx.sdks
      .filter(
        (sdk) =>
          sdk.language === "typescript" &&
          sdk.packageName !== "@modelcontextprotocol/sdk" &&
          sdk.versionRange !== null &&
          /(?:alpha|beta|rc|next)/i.test(sdk.versionRange),
      )
      .map((sdk) =>
        migrationFinding(
          "ts-v2-prerelease-sdk",
          `${sdk.packageName} uses prerelease range ${sdk.versionRange}. Stable v2 is now available.`,
          sdk.manifestPath,
          `Upgrade ${sdk.packageName} to a stable 2.x range and review final-wire changes.`,
        ),
      )
  },
}

const codemodMarker: Rule = {
  id: "ts-codemod-marker",
  severity: "breaking",
  description: "Unresolved MCP codemod diagnostics require manual migration",
  protocolEra: "modern",
  confidence: "high",
  async check(ctx) {
    const matches = await searchSourceFiles(
      ctx,
      /@mcp-codemod-error/,
      isTypeScriptSource,
      () => true,
      true,
    )
    return matches.map((match) =>
      migrationFinding(
        "ts-codemod-marker",
        "Unresolved @mcp-codemod-error marker found.",
        match.file,
        "Apply the manual migration described next to the marker, then remove it.",
        match.line,
      ),
    )
  },
}

const variadicRegistration: Rule = {
  id: "ts-legacy-registration-api",
  severity: "breaking",
  description: "The variadic tool, prompt, and resource registration APIs are removed in v2",
  protocolEra: "modern",
  confidence: "medium",
  async check(ctx) {
    const matches = await searchSourceFiles(
      ctx,
      /\b(?:server|mcp)\.(?:tool|prompt|resource)\s*\(/,
      isTypeScriptSource,
      importsMcpSdk,
    )
    return matches.map((match) =>
      migrationFinding(
        "ts-legacy-registration-api",
        "Legacy variadic server registration API found.",
        match.file,
        "Use registerTool, registerPrompt, or registerResource with an explicit config object.",
        match.line,
      ),
    )
  },
}

const schemaFirstHandler: Rule = {
  id: "ts-schema-first-handler",
  severity: "breaking",
  description: "Schema-first setRequestHandler registration is removed in v2",
  protocolEra: "modern",
  confidence: "high",
  async check(ctx) {
    const matches = await searchSourceFiles(
      ctx,
      /setRequestHandler\s*\(\s*[A-Za-z_$][\w$]*Schema\b/,
      isTypeScriptSource,
    )
    return matches.map((match) =>
      migrationFinding(
        "ts-schema-first-handler",
        "Schema-first setRequestHandler call found.",
        match.file,
        "Pass the MCP method string as the first argument in SDK v2.",
        match.line,
      ),
    )
  },
}

const legacyHandlerContext: Rule = {
  id: "ts-legacy-handler-context",
  severity: "breaking",
  description: "The v1 handler extra object moved to structured v2 context",
  protocolEra: "modern",
  confidence: "medium",
  async check(ctx) {
    const matches = await searchSourceFiles(
      ctx,
      /\bextra\.(?:requestInfo|sendNotification|sendRequest|authInfo|signal|sessionId)\b|\bRequestHandlerExtra\b/,
      isTypeScriptSource,
      importsMcpSdk,
    )
    return matches.map((match) =>
      migrationFinding(
        "ts-legacy-handler-context",
        "SDK v1 handler context usage found.",
        match.file,
        "Migrate RequestHandlerExtra/extra properties to ServerContext or ClientContext.",
        match.line,
      ),
    )
  },
}

const legacyErrorApi: Rule = {
  id: "ts-legacy-error-api",
  severity: "breaking",
  description: "SDK v1 error classes and enums were renamed or split in v2",
  protocolEra: "modern",
  confidence: "medium",
  async check(ctx) {
    const matches = await searchSourceFiles(
      ctx,
      /\b(?:McpError|ErrorCode|StreamableHTTPError)\b/,
      isTypeScriptSource,
      importsMcpSdk,
    )
    return matches.map((match) =>
      migrationFinding(
        "ts-legacy-error-api",
        "SDK v1 error API usage found.",
        match.file,
        "Migrate to ProtocolError, ProtocolErrorCode, SdkErrorCode, or SdkHttpError as appropriate.",
        match.line,
      ),
    )
  },
}

const internalImport: Rule = {
  id: "ts-internal-sdk-import",
  severity: "breaking",
  description: "Applications must not import SDK-internal package subpaths",
  protocolEra: "modern",
  confidence: "high",
  async check(ctx) {
    const matches = await searchSourceFiles(
      ctx,
      /from\s*["']@modelcontextprotocol\/(?:core|client|server)\/(?:internal|dist)(?:\/[^"']*)?["']/,
      isTypeScriptSource,
    )
    return matches.map((match) =>
      migrationFinding(
        "ts-internal-sdk-import",
        "Import from an SDK-internal subpath found.",
        match.file,
        "Import only documented public exports from the package root or public subpaths.",
        match.line,
      ),
    )
  },
}

const zodV3: Rule = {
  id: "ts-zod-v3",
  severity: "breaking",
  description: "TypeScript SDK v2 no longer supports Zod v3 for authored schemas",
  protocolEra: "modern",
  confidence: "high",
  async check(ctx) {
    const usesSplitV2Sdk = ctx.sdks.some(
      (sdk) =>
        sdk.language === "typescript" && sdk.packageName !== "@modelcontextprotocol/sdk",
    )
    if (!usesSplitV2Sdk) return []

    const findings: FindingDraft[] = []
    for (const file of ctx.files) {
      if (path.basename(file) !== "package.json") continue
      try {
        const pkg = JSON.parse(await ctx.read(file)) as Record<
          string,
          Record<string, string> | undefined
        >
        const range = {
          ...pkg.dependencies,
          ...pkg.devDependencies,
          ...pkg.peerDependencies,
        }.zod
        if (range && /(?:^|[<>=~^|,\s])v?3(?:\.|\b)/.test(range)) {
          findings.push(
            migrationFinding(
              "ts-zod-v3",
              `Zod v3-compatible range (${range}) found. SDK v2 requires Zod v4 for authored schemas.`,
              file,
              "Upgrade to zod ^4.2.0 or isolate SDK schemas behind a Zod v4 package alias.",
            ),
          )
        }
      } catch {
        // Manifest parse errors are handled by SDK detection; do not duplicate them here.
      }
    }
    return findings
  },
}

export const typescriptV2Rules: Rule[] = [
  prereleaseSdk,
  codemodMarker,
  variadicRegistration,
  schemaFirstHandler,
  legacyHandlerContext,
  legacyErrorApi,
  internalImport,
  zodV3,
]
