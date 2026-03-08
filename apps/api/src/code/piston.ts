const PISTON_API_URL = "https://emkc.org/api/v2"

export interface ExecutionResult {
  stdout: string
  stderr: string
  exitCode: number
}

export async function executeCode(
  code: string,
  language: string,
  version?: string
): Promise<ExecutionResult> {
  try {
    // Language runtimes supported by Piston
    const runtimeMap: Record<string, string> = {
      python: "python",
      python3: "python",
      js: "javascript",
      javascript: "javascript",
      ts: "typescript",
      typescript: "typescript",
      java: "java",
      go: "go",
      rust: "rust",
      cpp: "cpp",
      c: "c",
      csharp: "csharp",
      ruby: "ruby",
      php: "php",
    }

    const runtime = runtimeMap[language.toLowerCase()] || language.toLowerCase()

    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 10000) // 10 second timeout

    const response = await fetch(`${PISTON_API_URL}/execute`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        language: runtime,
        version: version || "*",
        files: [
          {
            name: `solution.${getFileExtension(language)}`,
            content: code,
          },
        ],
      }),
      signal: controller.signal,
    })

    clearTimeout(timeoutId)

    if (!response.ok) {
      throw new Error(`Piston API error: ${response.statusText}`)
    }

    const result = (await response.json()) as any

    return {
      stdout: result.run?.stdout || "",
      stderr: result.run?.stderr || "",
      exitCode: result.run?.code || 0,
    }
  } catch (err) {
    console.error("Code execution error:", err)
    return {
      stdout: "",
      stderr: String(err),
      exitCode: 1,
    }
  }
}

function getFileExtension(language: string): string {
  const extMap: Record<string, string> = {
    python: "py",
    python3: "py",
    js: "js",
    javascript: "js",
    ts: "ts",
    typescript: "ts",
    java: "java",
    go: "go",
    rust: "rs",
    cpp: "cpp",
    c: "c",
    csharp: "cs",
    ruby: "rb",
    php: "php",
  }
  return extMap[language.toLowerCase()] || language
}
