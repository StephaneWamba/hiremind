/**
 * Browser-based code execution via iframe sandbox
 * Supports: JavaScript (natively), other languages return error message
 */

interface ExecutionResult {
  stdout: string
  stderr: string
  exitCode: number
}

export async function executeCodeInBrowser(
  code: string,
  language: string
): Promise<ExecutionResult> {
  // Only JavaScript execution supported in browser
  if (!["javascript", "js"].includes(language.toLowerCase())) {
    return {
      stdout: "",
      stderr: `Browser execution not available for ${language}. Use "Run Code" button to execute on server.`,
      exitCode: 1,
    }
  }

  return new Promise((resolve) => {
    const iframe = document.createElement("iframe")
    iframe.style.display = "none"
    iframe.sandbox.add("allow-scripts")

    let timeout: NodeJS.Timeout | null = null
    let resolved = false

    // Cleanup function
    const cleanup = () => {
      if (timeout) clearTimeout(timeout)
      iframe.remove()
    }

    // Listen for results from iframe
    const handleMessage = (event: MessageEvent) => {
      if (event.source === iframe.contentWindow && !resolved) {
        resolved = true
        cleanup()
        window.removeEventListener("message", handleMessage)
        resolve(event.data as ExecutionResult)
      }
    }

    window.addEventListener("message", handleMessage)

    // 5 second timeout for code execution
    timeout = setTimeout(() => {
      if (!resolved) {
        resolved = true
        cleanup()
        window.removeEventListener("message", handleMessage)
        resolve({
          stdout: "",
          stderr: "Code execution timeout (5s)",
          exitCode: 1,
        })
      }
    }, 5000)

    // Wrap user code to capture console output
    const wrappedCode = `
      (async () => {
        const logs = [];
        const errors = [];
        let exitCode = 0;

        const originalLog = console.log;
        const originalError = console.error;

        console.log = (...args) => {
          logs.push(args.map(arg => typeof arg === 'string' ? arg : JSON.stringify(arg)).join(' '));
          originalLog(...args);
        };

        console.error = (...args) => {
          errors.push(args.map(arg => typeof arg === 'string' ? arg : JSON.stringify(arg)).join(' '));
          originalError(...args);
        };

        try {
          ${code}
        } catch (err) {
          errors.push(err instanceof Error ? err.message : String(err));
          exitCode = 1;
        }

        window.parent.postMessage({
          stdout: logs.join('\\n'),
          stderr: errors.join('\\n'),
          exitCode: exitCode
        }, '*');
      })();
    `

    // Create the iframe document with the code
    iframe.onload = () => {
      iframe.contentWindow?.document.open()
      iframe.contentWindow?.document.write(`
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="UTF-8">
          </head>
          <body>
            <script>${wrappedCode}</script>
          </body>
        </html>
      `)
      iframe.contentWindow?.document.close()
    }

    document.body.appendChild(iframe)
    iframe.src = "about:blank"
  })
}
