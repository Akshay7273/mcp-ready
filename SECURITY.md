# Security policy

## Supported versions

Security fixes are applied to the latest published release. Until `mcp-ready` reaches 1.0,
users should upgrade to the newest minor version before reporting an issue.

## Reporting a vulnerability

Please do not disclose suspected vulnerabilities in a public issue.

Use GitHub's private vulnerability reporting form:

https://github.com/Akshay7273/mcp-ready/security/advisories/new

Include the affected version, reproduction steps, impact, and any suggested mitigation. You
can expect an acknowledgement within seven days. Confirmed reports will receive a remediation
plan before public disclosure, and reporters will be credited unless they prefer otherwise.

## Scope

Reports are especially useful when they concern:

- repository traversal or reading files outside the requested scan target;
- execution of scanned source code or package lifecycle scripts;
- unsafe handling of untrusted paths in CLI or GitHub Action inputs;
- output injection that could alter CI logs, Markdown, or machine-readable reports;
- dependency vulnerabilities that affect the packaged runtime.

`mcp-ready` performs static analysis and must never execute the repository it scans. A violation
of that boundary is considered a security issue.
