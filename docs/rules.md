# Rule catalog

The rule ID is the stable machine-readable identifier used by terminal, Markdown, and JSON reports.
All current rules evaluate migration to the modern `2026-07-28` protocol era.

## Protocol rules

| Rule ID | Severity | Confidence | Detects |
| --- | --- | --- | --- |
| `error-code-32002` | breaking | high | Literal legacy resource-not-found error code |
| `session-assumptions` | breaking | high | `Mcp-Session-Id` coupling |
| `removed-initialized-notification` | breaking | high | Removed initialized lifecycle notification |
| `removed-ping` | breaking | medium | Removed MCP ping method |
| `removed-resource-subscriptions` | breaking | high | Resource subscribe/unsubscribe APIs replaced by `subscriptions/listen` |
| `removed-sse-resumability` | breaking | high | Removed `Last-Event-ID` replay behavior |
| `legacy-tasks-api` | breaking | high | Experimental core Tasks methods removed or redesigned |
| `removed-elicitation-complete` | breaking | high | Removed elicitation completion notification and correlation field |
| `deprecated-roots` | deprecated | high | Roots feature usage |
| `deprecated-sampling` | deprecated | high | Sampling feature usage |
| `deprecated-logging` | deprecated | high | Logging notification APIs |
| `deprecated-http-sse` | deprecated | high | Legacy HTTP+SSE transport |
| `deprecated-include-context` | deprecated | high | Deprecated Sampling context values |
| `deprecated-dynamic-client-registration` | deprecated | medium | OAuth Dynamic Client Registration usage |
| `schema-2020-12` | info | low | Schema locations that can use full JSON Schema 2020-12 |

## TypeScript SDK rules

| Rule ID | Severity | Confidence | Detects |
| --- | --- | --- | --- |
| `ts-monolith-sdk` | breaking | high | Monolithic SDK v1 dependency |
| `ts-v2-prerelease-sdk` | breaking | high | Alpha, beta, RC, or next split-package dependency |
| `ts-codemod-marker` | breaking | high | Unresolved official codemod diagnostic |
| `ts-legacy-registration-api` | breaking | medium | Removed variadic registration methods |
| `ts-schema-first-handler` | breaking | high | Schema-first low-level handler registration |
| `ts-legacy-handler-context` | breaking | medium | v1 `extra`/`RequestHandlerExtra` APIs |
| `ts-legacy-error-api` | breaking | medium | Renamed or split v1 error APIs |
| `ts-internal-sdk-import` | breaking | high | Imports from unstable SDK internals |
| `ts-zod-v3` | breaking | high | Zod v3 ranges used with split SDK v2 packages |

## Python SDK rules

| Rule ID | Severity | Confidence | Detects |
| --- | --- | --- | --- |
| `py-sdk-v1` | breaking | high | `FastMCP` usage that requires SDK v2 migration |
| `py-unbounded-dep` | deprecated | medium | Python `mcp` dependency that can cross into stable v2 unintentionally |

## Interpreting findings

A breaking finding means the matched construct is incompatible with the modern protocol or stable
SDK migration path. It does not mean a dual-era implementation must delete legacy compatibility;
maintainers can isolate legacy code and use the confidence/applicability metadata when establishing
a baseline.

Deprecated findings remain functional during the specification's lifecycle window but should not
be introduced in new implementations. Info findings do not fail CI by default.
