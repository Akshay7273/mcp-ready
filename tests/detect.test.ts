import { describe, expect, it } from "vitest"
import { buildScanContext } from "../src/detect.js"

describe("SDK detection", () => {
  it("detects the TS SDK in package.json", async () => {
    const ctx = await buildScanContext("fixtures/ts-old-sdk")
    expect(ctx.sdks).toHaveLength(1)
    expect(ctx.sdks[0].packageName).toBe("@modelcontextprotocol/sdk")
    expect(ctx.sdks[0].language).toBe("typescript")
  })

  it("detects the Python SDK in requirements.txt", async () => {
    const ctx = await buildScanContext("fixtures/py-old-sdk")
    expect(ctx.sdks.some((s) => s.language === "python")).toBe(true)
  })

  it("returns no SDKs for an empty directory", async () => {
    const ctx = await buildScanContext("fixtures/ts-testfiles")
    expect(ctx.sdks).toHaveLength(0)
  })

  it("rejects missing targets and regular files", async () => {
    await expect(buildScanContext("fixtures/does-not-exist")).rejects.toThrow(
      "Scan target does not exist",
    )
    await expect(buildScanContext("package.json")).rejects.toThrow(
      "Scan target is not a directory",
    )
  })

  it("refuses cached reads outside the scan root", async () => {
    const ctx = await buildScanContext("fixtures/ts-old-sdk")
    await expect(ctx.read("../ts-violations/server.ts")).rejects.toThrow(
      "Refusing to read outside scan target",
    )
  })
})
