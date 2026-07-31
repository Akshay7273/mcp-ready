# mcp-ready ✈️
![CI](https://github.com/Akshay7273/mcp-ready/actions/workflows/ci.yml/badge.svg)

> Is your MCP server ready for the **2026-07-28 spec**? Find breaking changes and deprecated features — before they find you.

🚧 **v0.1 in active development** — support for the final **2026-07-28** specification is being expanded for v0.2.

The Model Context Protocol's 2026-07-28 revision is its largest ever: a stateless core, a new `server/discover` capability-discovery method, deprecated roots/sampling/logging, new SDK major versions, and changed error handling. `mcp-ready` scans your MCP server repo — **TypeScript, Python, Go, or C#** — and tells you exactly what needs attention. In seconds. Zero config.

## Quick start

```
npx @akshay7273/mcp-ready .
```

> Installed globally? The command is just `mcp-ready`.

That's it. Point it at any MCP server repo and read the report.

### CI and machine-readable output

```bash
# JSON to stdout
npx @akshay7273/mcp-ready . --format json

# Write a Markdown report and fail on breaking or deprecated findings
npx @akshay7273/mcp-ready . --format markdown --output mcp-ready.md --fail-on deprecated
```

`--fail-on` accepts `breaking` (default), `deprecated`, or `none`. JSON reports use schema
version `1` and include detected SDKs, summary counts, protocol applicability, confidence, and
all remediation metadata.

## Use in CI (GitHub Action)

```yaml
- uses: Akshay7273/mcp-ready@main
  with:
    path: "."
```

Fails the build when 🔴 breaking findings are detected (exit code 1).

## What it checks

| Check | Severity | Why it matters |
| --- | --- | --- |
| Legacy `initialize`-only handshake assumptions | 🔴 breaking | The new revision introduces `server/discover` and a stateless core |
| Literal `-32002` error-code matching | 🔴 breaking | Resource-not-found is now standard JSON-RPC `-32602` |
| Monolithic `@modelcontextprotocol/sdk` (TypeScript) | 🔴 breaking | v2 splits into `@modelcontextprotocol/server` / `client` / `core` (Node 20+, ESM and CommonJS) |
| Python `mcp` v1 API usage (`FastMCP`) | 🔴 breaking | v2 renames `FastMCP` → `MCPServer` |
| Roots usage | 🟡 deprecated | Replace with tool parameters, resource URIs, or server config |
| Sampling usage | 🟡 deprecated | Deprecated under the new feature lifecycle policy |
| Logging capability usage | 🟡 deprecated | Use stderr (stdio) or OpenTelemetry instead |
| Unbounded `mcp` dependency in Python libraries | 🟡 deprecated | Pin `mcp>=1.27,<2` before v2 stable surprises your users |
| JSON Schema 2020-12 opportunities | 🔵 info | Tool schemas can now use `oneOf`/`anyOf`/`allOf`, `$ref`, conditionals |

## How it works

Pure static analysis: manifest parsing + source pattern matching. Nothing is executed, nothing leaves your machine, no network calls.

See the [rule catalog](docs/rules.md) for stable IDs and confidence levels, and
[architecture](docs/architecture.md) for the scan pipeline and security boundary.

## Fixing what it finds

Every finding links to the relevant migration doc. For TypeScript, the official codemod does the mechanical parts:

```
npx @modelcontextprotocol/codemod@latest v1-to-v2 .
```

See also the official [2026-07-28 changelog](https://modelcontextprotocol.io/specification/2026-07-28/changelog) and migration guides: [Upgrading TypeScript SDK v1 to v2](https://github.com/modelcontextprotocol/typescript-sdk/blob/main/docs/migration/upgrade-to-v2.md) · [Adopting the 2026-07-28 revision](https://github.com/modelcontextprotocol/typescript-sdk/blob/main/docs/migration/support-2026-07-28.md) · [Python migration guide](https://py.sdk.modelcontextprotocol.io/v2/migration/)

`mcp-ready` complements these tools — it tells you *what* needs attention across all four SDK languages; they help you *fix* it.

## Roadmap

- [x] SDK detection (TS / Python / Go / C#)
- [x] Initial rule engine (v0.1)
- [x] Markdown report output (v0.1)
- [ ] Final 2026-07-28 rule pack (v0.2)
- [ ] GitHub Action with PR summary comments (v0.2)
- [x] JSON output for CI pipelines (v0.2)

## Contributing

Issues and PRs welcome — especially real-world repos where the scanner gets it wrong. False-positive reports are gold. See [CONTRIBUTING.md](CONTRIBUTING.md).

## License

[MIT](LICENSE)
