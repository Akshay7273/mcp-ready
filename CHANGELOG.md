# Changelog

All notable changes are documented here. The project follows Semantic Versioning.

## [Unreleased]

### Added

- SARIF 2.1.0 output with deterministic rule metadata and GitHub code-scanning locations.
- GitHub Action job summaries with configurable failure thresholds.
- Checked-in baselines, exact rule/file suppressions, and stale-baseline reporting.
- Cross-language validation against pinned Python, Go, and C# MCP server commits.

### Changed

- Upgraded official GitHub Actions to their Node 24 releases.
- Kept major development-dependency upgrades independently reviewable in Dependabot.
- Scoped Python v1 detection to the official FastMCP import and ignored comment-only migration
  tokens while retaining codemod diagnostics.
- Detected centrally managed C# SDK versions from `Directory.Packages.props`.

## [0.2.0] - 2026-07-31

### Added

- Final MCP `2026-07-28` removal and deprecation rules.
- Stable TypeScript SDK v2 migration rules with positive and negative fixtures.
- Protocol-era and confidence metadata on every finding.
- Versioned JSON reports and explicit Markdown output.
- Configurable `--fail-on` policy for CI consumers.
- Node 20, 22, and 24 verification matrix.
- Security policy, support guidance, issue forms, and contributor templates.
- A reproducible real-world validation log with pinned target commits.

### Changed

- Updated documentation and remediation links from the release candidate to the final specification.
- Updated the TypeScript migration command to the stable codemod release.
- Expanded Markdown reports with applicability and confidence columns.
- Upgraded the test toolchain to patched releases.
- Reduced false positives by scoping ambiguous SDK rules and excluding generated/vendor source.
- Made Python dependency checks aware of the stable v2 boundary and external FastMCP package.

### Security

- Prevent source reads from escaping the requested repository boundary.
- Stop following symbolic links while discovering scan inputs.
- Escape untrusted values in terminal and Markdown reports.

## [0.1.0] - 2026-07-21

### Added

- Initial CLI and SDK detection for TypeScript, Python, Go, and C#.
- Nine migration rules with terminal and Markdown reporting.
- Composite GitHub Action and initial CI workflow.

[Unreleased]: https://github.com/Akshay7273/mcp-ready/compare/v0.2.0...HEAD
[0.2.0]: https://github.com/Akshay7273/mcp-ready/compare/v0.1.0...v0.2.0
[0.1.0]: https://github.com/Akshay7273/mcp-ready/releases/tag/v0.1.0
