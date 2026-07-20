// Demo fixture: intentionally contains patterns mcp-ready should flag.
export const capabilities = { sampling: {}, logging: {} }

export async function handleRequest(req: { method: string }): Promise<unknown> {
  if (req.method === "roots/list") return { roots: [] }
  if (req.method === "sampling/createMessage") return { role: "assistant" }
  if (req.method === "logging/setLevel") return {}
  return null
}

export function isResourceNotFound(code: number): boolean {
  return code === -32002
}

export const SESSION_HEADER = "Mcp-Session-Id"

export const demoTool = {
  name: "demo",
  inputSchema: { type: "object", properties: {} },
}
