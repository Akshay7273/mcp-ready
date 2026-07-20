# Contributing to mcp-ready

Thanks for helping MCP servers get ready for the 2026-07-28 spec! 🛩️

## Dev setup

- Node 20+
- `npm install`
- `npm run dev -- fixtures/ts-violations` — demo scan (intentionally exits 1)
- `npm run build`

## Adding a detection rule

1. Open `src/rules/index.ts`
2. Copy an existing rule object and give it a unique `id`, a `severity`
   (`breaking` | `deprecated` | `info`), and a line-match pattern via
   `searchSourceFiles`
3. Add your rule to the exported `rules` array at the bottom
4. Add (or extend) a fixture under `fixtures/` that triggers your rule
5. Run `npm run dev -- fixtures/<your-fixture>` and paste the output in your PR

## Reporting false positives

These are the most valuable issues right now. Please include:

- the rule id
- the matched line (file + line number + text)
- why the match is wrong

## PR guidelines

- Keep PRs small and focused — one rule or one fix per PR
- No new runtime dependencies without opening an issue first
- Be kind. Everyone shipping MCP servers is on the same deadline. 😅
