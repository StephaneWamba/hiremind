"use client"

import { useMemo } from "react"
import CodeMirror from "@uiw/react-codemirror"
import { javascript } from "@codemirror/lang-javascript"
import { python } from "@codemirror/lang-python"
import { java } from "@codemirror/lang-java"
import { go } from "@codemirror/lang-go"
import { rust } from "@codemirror/lang-rust"
import { cpp } from "@codemirror/lang-cpp"
import { EditorView } from "@codemirror/view"

interface CodeEditorProps {
  value: string
  onChange: (value: string) => void
  language?: string
  readOnly?: boolean
}

const languageMap = {
  javascript: javascript,
  js: javascript,
  python: python,
  python3: python,
  java: java,
  go: go,
  rust: rust,
  cpp: cpp,
  c: cpp,
  typescript: javascript,
  ts: javascript,
  csharp: javascript, // Fallback to JS highlighting for C#
  ruby: javascript, // Fallback for Ruby
  php: javascript, // Fallback for PHP
}

export function CodeEditor({
  value,
  onChange,
  language = "javascript",
  readOnly = false,
}: CodeEditorProps) {
  const langKey = (language.toLowerCase() as keyof typeof languageMap) || "javascript"
  const langExtension = languageMap[langKey] ? [languageMap[langKey]()] : [javascript()]

  // Theme configuration matching the dark interview room
  const editorTheme = useMemo(() => {
    return EditorView.theme({
      ".cm-content": {
        color: "var(--iv-text)",
        backgroundColor: "var(--iv-bg)",
        fontFamily: '"Fira Code", "Courier New", monospace',
        fontSize: "14px",
      },
      ".cm-gutters": {
        backgroundColor: "rgba(0,0,0,0.2)",
        borderRightColor: "var(--iv-border)",
        color: "var(--iv-text-muted)",
      },
      ".cm-activeLineGutter": {
        backgroundColor: "rgba(224,123,57,0.08)",
      },
      ".cm-cursor": {
        borderLeftColor: "var(--iv-accent)",
      },
      ".cm-selectionBackground": {
        backgroundColor: "rgba(224,123,57,0.2)",
      },
      ".cm-matchingBracket": {
        backgroundColor: "rgba(224,123,57,0.2)",
        outline: "1px solid rgba(224,123,57,0.4)",
      },
    })
  }, [])

  return (
    <div className="relative w-full h-full flex flex-col" style={{ backgroundColor: "var(--iv-bg)" }}>
      {/* Language indicator */}
      <div
        className="px-4 py-2 border-b text-xs font-mono"
        style={{
          borderColor: "var(--iv-border)",
          color: "var(--iv-text-muted)",
        }}
      >
        {language}
      </div>

      {/* CodeMirror Editor */}
      <div className="flex-1 overflow-hidden">
        <CodeMirror
          value={value}
          onChange={onChange}
          extensions={langExtension}
          theme={editorTheme}
          readOnly={readOnly}
          basicSetup={{
            lineNumbers: true,
            foldGutter: true,
            dropCursor: true,
            allowMultipleSelections: true,
            indentOnInput: true,
            bracketMatching: true,
            closeBrackets: !readOnly,
            autocompletion: !readOnly,
            rectangularSelection: true,
            highlightSelectionMatches: true,
            searchKeymap: true,
          }}
          height="100%"
          className="h-full"
          style={{
            fontSize: "14px",
          }}
        />
      </div>
    </div>
  )
}
