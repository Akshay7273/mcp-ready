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

## 2026-07-31 cross-language baseline

Scanner commit [`856075c`](https://github.com/Akshay7273/mcp-ready/commit/856075c84) was built
locally and run against three independently maintained MCP servers. Repositories were shallow-
cloned at the commits below. No dependencies were installed and no target code, build, test, or
package script was executed.

| Language | Repository | Target commit | SDK references | Breaking | Deprecated | Info |
| --- | --- | --- | ---: | ---: | ---: | ---: |
| Python | [sooperset/mcp-atlassian](https://github.com/sooperset/mcp-atlassian) | [`31c1d77`](https://github.com/sooperset/mcp-atlassian/commit/31c1d77244d0ec8b0d4ac308d8340179bf5d999f) | 1 | 2 | 2 | 1 |
| Go | [github/github-mcp-server](https://github.com/github/github-mcp-server) | [`ca8ab52`](https://github.com/github/github-mcp-server/commit/ca8ab52dcc45b86fae190398178fd22edb7b1362) | 1 | 4 | 0 | 1 |
| C# | [Azure/azure-mcp](https://github.com/Azure/azure-mcp) | [`54f04ab`](https://github.com/Azure/azure-mcp/commit/54f04ab1ade20b4adc4955cffea0833788307596) | 1 | 0 | 0 | 0 |

Counts are source occurrences after the fixes described below, not confirmed repository defects.

### Manual classification

- mcp-atlassian's two session findings are authored middleware that reads and logs the legacy
  session header. Its two Dynamic Client Registration findings are inside its MCP OAuth proxy.
  The JSON Schema result is an informational migration opportunity.
- GitHub MCP Server exposes the session and Last-Event-ID headers in CORS middleware and sends the
  initialized notification in its authored `mcpcurl` client. These are concrete compatibility
  surfaces. Its JSON Schema result is informational.
- Azure MCP produced no migration patterns. The scan now detects its centrally managed
  `ModelContextProtocol` version; zero findings means only that the current rule pack found no
  textual migration surface, not that full protocol compatibility was proven.

### Scanner improvements caused by the baseline

The first pass reported 126 Python occurrences, six Go occurrences, and failed to recognize the C#
SDK. Manual review found three scanner problems:

1. External `fastmcp.FastMCP` symbols were treated as the official Python v1 class whenever the
   same repository also depended on `mcp`. The rule now requires the official
   `mcp.server.fastmcp` import origin and emits one migration finding per affected file.
2. Legacy tokens in comment-only lines were reported as live code. Comment-only lines are now
   skipped, while intentional `@mcp-codemod-error` comment markers remain detectable.
3. C# detection required an inline `Version` in each project file. It now recognizes central
   `Directory.Packages.props` declarations, including attribute-order variations.

Regression fixtures cover all three cases. After the changes, the Python baseline dropped from
126 to five occurrences and the Go baseline from six to five; Azure MCP gained an SDK reference
without manufacturing findings.
