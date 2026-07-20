import fg from "fast-glob"
import { readFile } from "node:fs/promises"
import path from "node:path"
import type { ScanContext, SdkInfo } from "./types.js"

const IGNORE = [
  "**/node_modules/**",
  "**/dist/**",
  "**/build/**",
  "**/.git/**",
  "**/.venv/**",
  "**/venv/**",
  "**/__pycache__/**",
  "**/bin/**",
  "**/obj/**",
]

const FILE_PATTERNS = [
  "**/*.{ts,tsx,js,mjs,cjs,py,go,cs}",
  "**/package.json",
  "**/pyproject.toml",
  "**/requirements*.txt",
  "**/go.mod",
  "**/*.csproj",
]

const TS_SDK_PACKAGES = [
  "@modelcontextprotocol/sdk", // v1 monolith
  "@modelcontextprotocol/server", // v2 split package
  "@modelcontextprotocol/client", // v2 split package
]

// Matches "mcp" as a Python dependency (not "mcp-something"), with optional
// extras like mcp[cli] and an optional version constraint.
const PY_MCP_RE =
  /(?:^|["'\s])mcp(?![\w.-])(?:\[[^\]]*\])?\s*((?:==|>=|<=|~=|!=|>|<)\s*[^"',;\s]+(?:\s*,\s*(?:==|>=|<=|~=|!=|>|<)\s*[^"',;\s]+)*)?/

const GO_SDK_RE = /github\.com\/modelcontextprotocol\/go-sdk(?:\/v\d+)?\s+(v[\w.+-]+)/

const CSPROJ_RE = /<PackageReference\s+Include="(ModelContextProtocol[^"]*)"\s+Version="([^"]+)"/g

export async function buildScanContext(rootDir: string): Promise<ScanContext> {
  const files = await fg(FILE_PATTERNS, { cwd: rootDir, ignore: IGNORE, dot: false })
  files.sort()

  const cache = new Map<string, string>()
  const read = async (relPath: string): Promise<string> => {
    const hit = cache.get(relPath)
    if (hit !== undefined) return hit
    const content = await readFile(path.join(rootDir, relPath), "utf8")
    cache.set(relPath, content)
    return content
  }

  const sdks = await detectSdks(files, read)
  return { rootDir, files, read, sdks }
}

export async function detectSdks(
  files: string[],
  read: (relPath: string) => Promise<string>,
): Promise<SdkInfo[]> {
  const sdks: SdkInfo[] = []

  for (const file of files) {
    const base = path.basename(file)

    if (base === "package.json") {
      try {
        const pkg = JSON.parse(await read(file)) as Record<
          string,
          Record<string, string> | undefined
        >
        const deps = {
          ...pkg.dependencies,
          ...pkg.devDependencies,
          ...pkg.peerDependencies,
        }
        for (const name of TS_SDK_PACKAGES) {
          const range = deps[name]
          if (range) {
            sdks.push({
              language: "typescript",
              packageName: name,
              versionRange: range,
              manifestPath: file,
            })
          }
        }
      } catch {
        // Unparseable package.json — skip silently for now.
      }
    } else if (base === "pyproject.toml" || /^requirements[\w.-]*\.txt$/.test(base)) {
      const text = await read(file)
      for (const line of text.split("\n")) {
        const m = PY_MCP_RE.exec(line)
        if (m) {
          sdks.push({
            language: "python",
            packageName: "mcp",
            versionRange: m[1]?.trim() ?? null,
            manifestPath: file,
          })
          break // one hit per manifest is enough
        }
      }
    } else if (base === "go.mod") {
      const m = GO_SDK_RE.exec(await read(file))
      if (m) {
        sdks.push({
          language: "go",
          packageName: "github.com/modelcontextprotocol/go-sdk",
          versionRange: m[1],
          manifestPath: file,
        })
      }
    } else if (base.endsWith(".csproj")) {
      const text = await read(file)
      for (const m of text.matchAll(CSPROJ_RE)) {
        sdks.push({
          language: "csharp",
          packageName: m[1],
          versionRange: m[2],
          manifestPath: file,
        })
      }
    }
  }

  return sdks
}