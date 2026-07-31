# Baselines and suppressions

Policy lets an existing repository adopt `mcp-ready` without hiding future regressions. Put a
`.mcp-ready.json` file at the scan root. Both configuration and baseline formats use schema version
`1`.

```json
{
  "schemaVersion": "1",
  "baseline": "mcp-ready-baseline.json",
  "suppressions": [
    {
      "ruleId": "removed-ping",
      "file": "src/compat.ts",
      "line": 18,
      "reason": "Intentional transport-level compatibility probe"
    }
  ]
}
```

Paths are repository-relative and must remain inside the scan target. A suppression must name a
known rule, one exact file, a non-empty reason, and optionally one exact line. Omitting `line`
suppresses that rule everywhere in the named file; there is no repository-wide wildcard.

## Create or refresh a baseline

```bash
npx @akshay7273/mcp-ready . \
  --write-baseline mcp-ready-baseline.json \
  --fail-on none
```

The generated baseline contains current findings except explicit suppressions. Review it before
committing, then reference it from `.mcp-ready.json`. Entries use readable `ruleId`, `file`, and
optional `line` identities rather than opaque hashes.

## Precedence and reporting

Policy is applied in this order:

1. Explicit suppressions accept matching findings.
2. The checked-in baseline accepts remaining exact matches.
3. Every unmatched finding remains active and participates in `--fail-on`.

Terminal and Markdown reports show policy counts. JSON keeps active findings in `findings`, accepted
findings in `accepted` with their disposition and reason, and unmatched baseline entries in
`staleBaseline`. SARIF contains active findings only, so accepted debt does not create code-scanning
alerts.

A stale entry means the exact finding no longer exists, was moved, or is now suppressed. Stale
entries are visible but do not change the exit status; remove or deliberately refresh them during
review. Invalid configuration, unknown rule IDs, duplicate baseline entries, and paths escaping the
scan root are hard errors.
