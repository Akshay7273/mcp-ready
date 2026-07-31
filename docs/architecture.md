# Architecture

`mcp-ready` is a zero-configuration static migration scanner. Its runtime never installs a
target repository's dependencies, imports its modules, or executes its scripts.

## Scan pipeline

1. `src/cli-options.ts` validates CLI arguments and output policy.
2. `src/detect.ts` resolves the target directory, discovers supported manifests and source
   files, and detects MCP SDK dependencies.
3. Rules under `src/rules/` inspect the cached manifest and source text.
4. `src/scan.ts` attaches each rule's protocol-era and confidence metadata to its findings.
5. `src/policy.ts` classifies exact suppressions, baseline matches, and stale baseline entries.
6. `src/report.ts` renders active and accepted findings as terminal, Markdown, versioned JSON, or
   SARIF 2.1.0.
7. The CLI applies the configured failure threshold to active findings only.

This separation keeps detection independent from presentation and gives CI consumers a stable
place to integrate.

## Security boundary

The scan target is treated as untrusted input.

- The target must exist and must be a directory.
- Symbolic links are not followed during discovery.
- Every cached read is resolved and checked against the target boundary.
- Repository-controlled configuration cannot read a baseline outside the target boundary.
- Source code and package lifecycle scripts are never executed.
- Terminal control characters and Markdown table metacharacters are escaped in human-readable
  reports.
- JSON output relies on the platform serializer and has an explicit schema version.
- SARIF paths are repository-relative URIs; local absolute paths are not exposed.

See `SECURITY.md` for private reporting instructions.

## Detection model

Rules currently use manifest parsing and deliberately narrow source patterns. Each rule declares:

- a stable ID;
- severity (`breaking`, `deprecated`, or `info`);
- applicability (`legacy`, `modern`, or `both` protocol eras);
- confidence (`high`, `medium`, or `low`);
- a remediation hint and authoritative documentation URL.

Confidence describes static-analysis certainty, not the importance of a finding. Medium-confidence
rules generally match an SDK idiom that could also exist in unrelated application code. Low-
confidence findings are migration opportunities rather than demonstrated incompatibilities.

## Supported ecosystems

SDK manifest detection supports:

- TypeScript/JavaScript: `package.json`;
- Python: `pyproject.toml` and `requirements*.txt`;
- Go: `go.mod`;
- C#: `*.csproj`.

Source scanning covers TypeScript, JavaScript, Python, Go, and C#. Tests, generated output,
dependency directories, virtual environments, and build directories are excluded.

## Testing strategy

Every behavior change should be covered at the narrowest useful layer:

- detection tests for manifest and boundary behavior;
- positive fixtures for intended findings;
- negative fixtures for compatible code and false-positive prevention;
- report tests for schema, escaping, and failure policy;
- CLI smoke scans across supported Node versions in CI.

Real-world repository validation complements fixtures and is tracked separately from unit tests.
