# ast-outline-mcp

An MCP (Model Context Protocol) server for [ast-outline](https://github.com/ast-outline/ast-outline) — a tree-sitter-based CLI that lets AI coding agents pull exactly what they need from a codebase: structural outlines, module digests, symbol bodies, and AST-aware grep.

## Why

LLM coding agents explore codebases by reading files directly. A 1200-line file costs 1200 lines of context just to answer "what methods are in here?" — `ast-outline` provides the file's shape in 60–100 lines, and this MCP server exposes that functionality to any MCP-compatible client.

## Prerequisites

- Node.js >= 18
- `ast-outline` CLI installed and available on PATH ([installation guide](https://github.com/ast-outline/ast-outline#install))

```bash
uv tool install ast-outline
```

## Installation

```bash
npm install
npm run build
```

## Usage

### Stdio transport (default)

```bash
npm start
```

### HTTP/SSE transport

```bash
npm run start:http
```

### MCP Client Configuration

Add to your MCP client config (e.g., Claude Desktop):

```json
{
  "mcpServers": {
    "ast-outline": {
      "command": "node",
      "args": ["path/to/ast-outline-mcp/dist/index.js"]
    }
  }
}
```

## Tools

### `ast_outline`

Get a structural outline of one or more files or directories. Returns signatures with line ranges (no bodies).

**Parameters:**
- `paths` (string[], required) — File or directory paths to outline
- `json` (boolean) — Return machine-readable JSON output
- `imports` (boolean) — Include import/use/using statements
- `noPrivate` (boolean) — Exclude private members
- `noFields` (boolean) — Exclude fields/properties
- `noDocs` (boolean) — Exclude documentation comments
- `noAttrs` (boolean) — Exclude attributes/decorators

### `ast_digest`

Get a compact one-page module map of a directory. Each file gets a size label and token estimate.

**Parameters:**
- `paths` (string[], required) — Directory paths to digest
- `json` (boolean) — Return machine-readable JSON output

### `ast_show`

Extract the full source body of one or more symbols from a file.

**Parameters:**
- `file` (string, required) — File path to extract symbols from
- `symbols` (string[], required) — Symbol names to extract
- `json` (boolean) — Return machine-readable JSON output
- `signature` (boolean) — Return header/signature only, no body

### `ast_grep`

AST-aware structural search across files. Matches grouped by enclosing class/function.

**Parameters:**
- `pattern` (string, required) — Search pattern (literal or regex, auto-detected)
- `paths` (string[], required) — File or directory paths to search
- `json` (boolean) — Return machine-readable JSON output
- `kind` (enum: def|call|ref|import) — Narrow results by classification kind
- `wordMatch` (boolean) — Match whole words only
- `caseInsensitive` (boolean) — Case-insensitive matching
- `filesOnly` (boolean) — List matching files only
- `count` (boolean) — Show match counts per file
- `maxCount` (number) — Maximum number of matches per file

## Prompts

### `explore_codebase`

A prompt that guides an LLM to efficiently explore a codebase using ast-outline tools.

## Development

```bash
npm install
npm test
npm run build
```

## Supported Languages

ast-outline supports 20+ languages including TypeScript, Python, Go, Rust, C#, Java, Kotlin, Ruby, PHP, and more. See the [full list](https://github.com/ast-outline/ast-outline#supported-languages).

## License

MIT
