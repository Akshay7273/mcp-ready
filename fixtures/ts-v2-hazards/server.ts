import { hidden } from "@modelcontextprotocol/core/internal"

declare const server: {
  tool: (...args: unknown[]) => void
  setRequestHandler: (...args: unknown[]) => void
}
declare const CallToolRequestSchema: unknown
declare const extra: { sessionId: string }
declare class McpError extends Error {}

// @mcp-codemod-error manual migration required
server.tool("legacy", {}, async () => ({ content: [] }))
server.setRequestHandler(CallToolRequestSchema, async () => ({ content: [] }))

export const session = extra.sessionId
export const error = new McpError("legacy")
export const internal = hidden
