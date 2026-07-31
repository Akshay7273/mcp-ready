import { describe, expect, it } from "vitest"
import { parseCliOptions } from "../src/cli-options.js"

describe("CLI options", () => {
  it("uses CI-safe defaults", () => {
    expect(parseCliOptions([])).toEqual({
      target: ".",
      format: "terminal",
      output: undefined,
      failOn: "breaking",
      legacyMarkdown: false,
    })
  })

  it("parses machine-readable output controls", () => {
    expect(
      parseCliOptions(["repo", "--format", "json", "--output", "report.json", "--fail-on", "deprecated"]),
    ).toMatchObject({
      target: "repo",
      format: "json",
      output: "report.json",
      failOn: "deprecated",
    })
  })

  it("rejects unknown options and terminal file output", () => {
    expect(() => parseCliOptions(["--wat"])).toThrow("Unknown option")
    expect(() => parseCliOptions(["--output", "report.txt"])).toThrow(
      "--output requires",
    )
  })
})
