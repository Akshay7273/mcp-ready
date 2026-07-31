# Real-world validation

Fixtures protect known behavior, but migration rules also need validation against repositories
written by other maintainers. This log records reproducible scans and the product changes they
caused.

## 2026-07-31 TypeScript baseline

The v0.2 branch was built locally, then run with JSON output and `--fail-on none`. Target
dependencies were not installed and no target code was executed.

| Repository | Target commit | Breaking occurrences | Deprecated occurrences | Info occurrences |
| --- | --- | ---: | ---: | ---: |
| [ChromeDevTools/chrome-devtools-mcp](https://github.com/ChromeDevTools/chrome-devtools-mcp) | [`5b25370`](https://github.com/ChromeDevTools/chrome-devtools-mcp/commit/5b25370c9cd779032c3c9dc9880eca7031c73005) | 2 | 1 | 1 |
| [czlonkowski/n8n-mcp](https://github.com/czlonkowski/n8n-mcp) | [`78b9cdf`](https://github.com/czlonkowski/n8n-mcp/commit/78b9cdf77ecc303225a002fc5198f84a42862b23) | 18 | 6 | 1 |
| [mksglu/context-mode](https://github.com/mksglu/context-mode) | [`252e74b`](https://github.com/mksglu/context-mode/commit/252e74b7a947b5fbb5624037f8710d3a5319af3c) | 7 | 0 | 1 |

Counts represent matched source occurrences, not unique rules or confirmed defects. Repeated
session-header or handler registrations intentionally retain line-level evidence.

### Findings observed

- All three repositories declared the monolithic TypeScript SDK and exposed concrete v1-to-v2
  migration surfaces.
- Chrome DevTools MCP contained schema-first handler registration and a Roots capability.
- n8n-mcp contained session-header coupling, HTTP+SSE compatibility code, and multiple schema-first
  handlers.
- context-mode contained schema-first handlers and a direct initialized-notification bridge after
  generated bundles were excluded.

### Scanner improvements caused by the baseline

The first pass exposed two classes of noise:

1. generic application symbols such as `ErrorCode` were matched in files unrelated to MCP;
2. committed bundles and third-party source duplicated implementation findings.

The scanner now limits ambiguous TypeScript SDK rules to files importing an MCP package and skips
common bundle, minified, vendor, and third-party paths. Regression fixtures preserve both changes.
After the fix, Chrome DevTools MCP dropped from 26 to 4 occurrences and context-mode dropped from
37 to 8 without suppressing their authored MCP migration surfaces.

## Reproducing a validation scan

Build `mcp-ready`, check out the recorded target commit, then run:

```bash
node dist/cli.js /path/to/repository --format json --fail-on none --output report.json
```

When adding future results, record the target commit, scanner commit, manual review notes, and any
rule or fixture changes prompted by the scan. Do not present an occurrence count as a confirmed
compatibility defect without maintainer review.
