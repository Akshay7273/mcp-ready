import type { ScanContext } from "../types.js"

export type FileMatch = { file: string; line: number; text: string }

const SOURCE_EXTS = [".ts", ".tsx", ".js", ".mjs", ".cjs", ".py", ".go", ".cs"]

export function isSourceFile(file: string): boolean {
  return SOURCE_EXTS.some((ext) => file.endsWith(ext))
}

/**
 * Scan source files line by line and return every line matching the pattern.
 * Pass a non-global RegExp (a global flag makes .test() stateful).
 */
export async function searchSourceFiles(
  ctx: ScanContext,
  pattern: RegExp,
  fileFilter: (file: string) => boolean = isSourceFile,
): Promise<FileMatch[]> {
  const matches: FileMatch[] = []
  for (const file of ctx.files) {
    if (!fileFilter(file)) continue
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
