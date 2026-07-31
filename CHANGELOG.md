# Changelog

All notable changes are documented here. The project follows Semantic Versioning.

## [Unreleased]

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
