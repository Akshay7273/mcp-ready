# SARIF and GitHub code scanning

`mcp-ready` can emit SARIF 2.1.0 so migration findings appear as code-scanning annotations.
The report includes stable rule IDs, severity, protocol era, confidence, repository-relative file
locations, remediation hints, and documentation links.

## Generate a report

```bash
npx @akshay7273/mcp-ready . \
  --format sarif \
  --output mcp-ready.sarif \
  --fail-on none
```

`--fail-on none` lets the upload step run even when the report contains breaking findings. The
findings keep their SARIF severity; this option changes only the CLI exit status.

## Upload from GitHub Actions

```yaml
name: MCP migration scan

on:
  pull_request:
  push:
    branches: [main]

permissions:
  contents: read
  security-events: write

jobs:
  mcp-ready:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v7
      - uses: actions/setup-node@v7
        with:
          node-version: 22
      - name: Scan
        run: >-
          npx --yes @akshay7273/mcp-ready@0.3.0 .
          --format sarif
          --output mcp-ready.sarif
          --fail-on none
      - name: Upload SARIF
        uses: github/codeql-action/upload-sarif@v4
        with:
          sarif_file: mcp-ready.sarif
```

Pin the package version in automated workflows so a release cannot change results unexpectedly.
GitHub may restrict SARIF upload availability by repository visibility and plan; consult its code
scanning documentation for the current policy.
