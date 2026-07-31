// Intentionally contains APIs removed or deprecated by MCP 2026-07-28.
export const methods = [
  "notifications/initialized",
  "resources/subscribe",
  "resources/unsubscribe",
  "tasks/result",
  "tasks/list",
  "notifications/elicitation/complete",
]

export const pingRequest = { method: "ping" }
export const replayHeader = "Last-Event-ID"
export const elicitationId = "legacy-correlation-id"
export const samplingOptions = { includeContext: "allServers" }
export const registrationMetadata = { client_registration_endpoint: "/register" }

export class SSEServerTransport {}
