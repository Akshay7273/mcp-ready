import type { FindingDraft, Rule, Severity } from "../types.js"
import { searchSourceFiles } from "./util.js"

const CHANGELOG = "https://modelcontextprotocol.io/specification/2026-07-28/changelog"

type SourceRuleOptions = {
  id: string
  severity: Severity
  description: string
  pattern: RegExp
  message: string
  fixHint: string
  confidence?: Rule["confidence"]
}

function sourceRule(options: SourceRuleOptions): Rule {
  return {
    id: options.id,
    severity: options.severity,
    description: options.description,
    protocolEra: "modern",
    confidence: options.confidence ?? "high",
    async check(ctx) {
      const matches = await searchSourceFiles(ctx, options.pattern)
      return matches.map(
        (match): FindingDraft => ({
          ruleId: options.id,
          severity: options.severity,
          message: options.message,
          file: match.file,
          line: match.line,
          fixHint: options.fixHint,
          docsUrl: CHANGELOG,
        }),
      )
    },
  }
}

const removedInitialized = sourceRule({
  id: "removed-initialized-notification",
  severity: "breaking",
  description: "The initialized notification is absent from the stateless protocol era",
  pattern: /notifications\/initialized|InitializedNotificationSchema/,
  message:
    "Legacy notifications/initialized usage found. The 2026-07-28 protocol removes the initialize/initialized handshake.",
  fixHint: "Use server/discover and per-request protocol metadata for the modern protocol era.",
})

const removedPing = sourceRule({
  id: "removed-ping",
  severity: "breaking",
  description: "The ping method is removed in the 2026-07-28 protocol era",
  pattern: /PingRequestSchema|(?:method\s*[:=]|setRequestHandler\s*\()\s*["']ping["']/,
  message: "Legacy ping method usage found. ping is removed in the 2026-07-28 protocol era.",
  fixHint: "Use transport-level health checks instead of the MCP ping method.",
  confidence: "medium",
})

const removedResourceSubscriptions = sourceRule({
  id: "removed-resource-subscriptions",
  severity: "breaking",
  description: "Resource subscribe and unsubscribe methods are replaced by subscriptions/listen",
  pattern:
    /resources\/(?:subscribe|unsubscribe)|(?:Subscribe|Unsubscribe)RequestSchema|\.subscribeResource\s*\(/,
  message:
    "Legacy resource subscription API found. resources/subscribe and resources/unsubscribe are removed in 2026-07-28.",
  fixHint: "Move opted-in change notifications to subscriptions/listen.",
})

const removedSseResumability = sourceRule({
  id: "removed-sse-resumability",
  severity: "breaking",
  description: "SSE event replay and Last-Event-ID are removed",
  pattern: /Last-Event-ID|lastEventId|last_event_id/,
  message:
    "SSE resumability usage found. Last-Event-ID and message redelivery are removed in 2026-07-28.",
  fixHint: "Retry the request with a new request ID when its response stream breaks.",
})

const legacyTasks = sourceRule({
  id: "legacy-tasks-api",
  severity: "breaking",
  description: "The experimental core Tasks API moved to an extension and changed shape",
  pattern: /tasks\/(?:result|list)|(?:GetTaskResult|ListTasksRequest)Schema/,
  message:
    "Legacy core Tasks API found. tasks/result and tasks/list do not exist in the 2026-07-28 Tasks extension.",
  fixHint: "Adopt the io.modelcontextprotocol/tasks extension and poll with tasks/get.",
})

const removedElicitationComplete = sourceRule({
  id: "removed-elicitation-complete",
  severity: "breaking",
  description: "The elicitation completion notification and elicitationId are removed",
  pattern: /notifications\/elicitation\/complete|elicitationId|elicitation_id/,
  message:
    "Legacy elicitation completion correlation found. The completion notification and elicitationId are removed.",
  fixHint: "Use the multi round-trip request pattern and carry correlation data in requestState.",
})

const deprecatedHttpSse = sourceRule({
  id: "deprecated-http-sse",
  severity: "deprecated",
  description: "The legacy HTTP+SSE transport is formally deprecated",
  pattern: /SSEServerTransport|SseServerTransport|sse_server_transport/,
  message: "Legacy HTTP+SSE transport usage found. It is deprecated under the feature lifecycle policy.",
  fixHint: "Migrate the endpoint to Streamable HTTP.",
})

const deprecatedIncludeContext = sourceRule({
  id: "deprecated-include-context",
  severity: "deprecated",
  description: "Legacy includeContext values are formally deprecated",
  pattern: /includeContext\s*[:=]\s*["'](?:thisServer|allServers)["']/,
  message: "Deprecated includeContext value found.",
  fixHint: "Omit includeContext or use none.",
})

const deprecatedDynamicRegistration = sourceRule({
  id: "deprecated-dynamic-client-registration",
  severity: "deprecated",
  description: "OAuth Dynamic Client Registration is deprecated for MCP clients",
  pattern: /registerClient\s*\(|register_client\s*\(|client_registration_endpoint/,
  message: "Dynamic Client Registration usage found. MCP now prefers Client ID Metadata Documents.",
  fixHint: "Adopt Client ID Metadata Documents while retaining DCR only as a compatibility fallback.",
  confidence: "medium",
})

export const finalSpecRules: Rule[] = [
  removedInitialized,
  removedPing,
  removedResourceSubscriptions,
  removedSseResumability,
  legacyTasks,
  removedElicitationComplete,
  deprecatedHttpSse,
  deprecatedIncludeContext,
  deprecatedDynamicRegistration,
]
