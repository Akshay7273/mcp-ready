// These application symbols resemble SDK v1 names but this file does not import the MCP SDK.
declare const server: { tool: (...args: unknown[]) => void }
declare const extra: { sessionId: string }
export enum ErrorCode {
  StorageFailure = "storage_failure",
}

server.tool("application-method")
export const session = extra.sessionId
