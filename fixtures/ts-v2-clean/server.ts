declare const server: {
  registerTool: (...args: unknown[]) => void
}

server.registerTool("modern", { description: "Modern registration" }, async () => ({
  content: [],
}))
