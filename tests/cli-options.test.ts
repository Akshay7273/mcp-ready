import { describe, expect, it } from "vitest"
import { parseCliOptions } from "../src/cli-options.js"

describe("CLI options", () => {
  it("uses CI-safe defaults", () => {
    expect(parseCliOptions([])).toEqual({
      target: ".",
      format: "terminal",
      output: undefined,
      config: undefined,
      writeBaseline: undefined,
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

  it("accepts SARIF output", () => {
    expect(parseCliOptions(["repo", "--format", "sarif", "-o", "results.sarif"])).toMatchObject({
      target: "repo",
      format: "sarif",
      output: "results.sarif",
    })
  })

  it("parses policy controls", () => {
    expect(
      parseCliOptions(["repo", "--config", "repo/policy.json", "--write-baseline", "known.json"]),
    ).toMatchObject({
      config: "repo/policy.json",
      writeBaseline: "known.json",
    })
  })

  it("rejects unknown options and terminal file output", () => {
    expect(() => parseCliOptions(["--wat"])).toThrow("Unknown option")
    expect(() => parseCliOptions(["--output", "report.txt"])).toThrow(
      "--output requires",
    )
  })
})
