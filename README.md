# mcp-preflight ✈️

> Is your MCP server ready for the **2026-07-28 spec**? Find breaking changes and deprecated features — before they find you.

🚧 **v0.1 in active development** — shipping before the spec goes final on **July 28, 2026**.

The Model Context Protocol's 2026-07-28 revision is its largest ever: a stateless core, a new `server/discover` handshake, deprecated roots/sampling/logging, new SDK major versions, and a changed error code. `mcp-preflight` scans your MCP server repo — **TypeScript, Python, Go, or C#** — and tells you exactly what needs attention. In seconds. Zero config.

## Quick start

```
npx mcp-preflight .
```

That's it. Point it at any MCP server repo and read the report.

## What it checks

| Check | Severity | Why it matters |
| --- | --- | --- |
| Legacy `initialize`-only handshake assumptions | 🔴 breaking | The new revision introduces `server/discover` and a stateless core |
| Literal `-32002` error-code matching | 🔴 breaking | Resource-not-found is now standard JSON-RPC `-32602` |
| Monolithic `@modelcontextprotocol/sdk` (TypeScript) | 🔴 breaking | v2 splits into `@modelcontextprotocol/server` / `client` (ESM-only, Node 20+) |
| Python `mcp` v1 API usage (`FastMCP`) | 🔴 breaking | v2 renames `FastMCP` → `MCPServer` |
| Roots usage | 🟡 deprecated | Replace with tool parameters, resource URIs, or server config |
| Sampling usage | 🟡 deprecated | Deprecated under the new feature lifecycle policy |
| Logging capability usage | 🟡 deprecated | Use stderr (stdio) or OpenTelemetry instead |
| Unbounded `mcp` dependency in Python libraries | 🟡 deprecated | Pin `mcp>=1.27,<2` before v2 stable surprises your users |
| JSON Schema 2020-12 opportunities | 🔵 info | Tool schemas can now use `oneOf`/`anyOf`/`allOf`, `$ref`, conditionals |

## How it works

Pure static analysis: manifest parsing + source pattern matching. Nothing is executed, nothing leaves your machine, no network calls.

## Fixing what it finds

Every finding links to the relevant migration doc. For TypeScript, the official codemod does the mechanical parts:

```
npx @modelcontextprotocol/codemod@beta v1-to-v2 .
```

See also the official guides: [Upgrading from v1 to v2](https://github.com/modelcontextprotocol/typescript-sdk/blob/main/docs/migration/upgrade-to-v2.md) · [Adopting the 2026-07-28 revision](https://github.com/modelcontextprotocol/typescript-sdk/blob/main/docs/migration/support-2026-07-28.md) · [Python migration guide](https://py.sdk.modelcontextprotocol.io/v2/migration/)

`mcp-preflight` complements these tools — it tells you *what* needs attention across all four SDK languages; they help you *fix* it.

## Roadmap

- [x] SDK detection (TS / Python / Go / C#)
- [ ] Full rule engine (v0.1)
- [ ] Markdown report output (v0.1)
- [ ] GitHub Action with PR summary comments (v0.2)
- [ ] JSON output for CI pipelines (v0.2)

## Contributing

Issues and PRs welcome — especially real-world repos where the scanner gets it wrong. False-positive reports are gold. See [CONTRIBUTING.md](CONTRIBUTING.md) (coming with v0.1).

## License

[MIT](LICENSE)
