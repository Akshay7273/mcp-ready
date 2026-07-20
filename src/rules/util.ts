import type { ScanContext } from "../types.js"

export type FileMatch = { file: string; line: number; text: string }

const SOURCE_EXTS = [".ts", ".tsx", ".js", ".mjs", ".cjs", ".py", ".go", ".cs"]

// Test files intentionally assert legacy behavior (mocks, old error codes,
// session headers). Scanning them produces false positives, so they are skipped.
const TEST_FILE_RE =
  /\.test\.[a-z]+$|\.spec\.[a-z]+$|_test\.[a-z]+$|(^|\/)(test|tests|__tests__|testdata|__mocks__|mocks)\//

export function isSourceFile(file: string): boolean {
  return SOURCE_EXTS.some((ext) => file.endsWith(ext))
}

export function isTestFile(file: string): boolean {
  return TEST_FILE_RE.test(file.replace(/\\/g, "/"))
}

/**
 * Scan source files line by line and return every line matching the pattern.
 * Test files are always skipped. Pass a non-global RegExp.
 */
export async function searchSourceFiles(
  ctx: ScanContext,
  pattern: RegExp,
  fileFilter: (file: string) => boolean = isSourceFile,
): Promise<FileMatch[]> {
  const matches: FileMatch[] = []
  for (const file of ctx.files) {
    if (isTestFile(file) || !fileFilter(file)) continue
    const text = await ctx.read(file)
    const lines = text.split("\n")
    for (let i = 0; i < lines.length; i++) {
      if (pattern.test(lines[i])) {
        matches.push({ file, line: i + 1, text: lines[i].trim().slice(0, 160) })
      }
    }
  }
  return matches
}
