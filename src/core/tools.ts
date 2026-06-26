import { FastMCP } from "fastmcp";
import { z } from "zod";
import { AstOutlineService } from "./services/ast-outline-service.js";

const service = new AstOutlineService();

/**
 * Register all tools with the MCP server
 */
export function registerTools(server: FastMCP): void {
  // Outline tool - structural outline of files/directories
  server.addTool({
    name: "outline",
    description: "Get a structural outline of a file or directory. " + "Returns signatures with line ranges (no bodies). ",
    parameters: z.object({
      path: z.string().describe("Absolute path"),
      json: z.boolean().optional().describe("Return machine-readable JSON output"),
      imports: z.boolean().optional().describe("Include import/use/using statements"),
      noPrivate: z.boolean().optional().describe("Exclude private members"),
      noFields: z.boolean().optional().describe("Exclude fields/properties"),
      noDocs: z.boolean().optional().describe("Exclude documentation comments"),
      noAttrs: z.boolean().optional().describe("Exclude attributes/decorators"),
    }),
    execute: async (params) => {
      const result = await service.outline([params.path], {
        json: params.json,
        imports: params.imports,
        noPrivate: params.noPrivate,
        noFields: params.noFields,
        noDocs: params.noDocs,
        noAttrs: params.noAttrs,
      });
      if (result.exitCode !== 0 && !result.stdout) {
        return `Error (exit ${result.exitCode}): ${result.stderr}`;
      }
      return result.stdout || result.stderr;
    },
  });

  // Digest tool - compact module map
  server.addTool({
    name: "digest",
    description:
      "Get a compact one-page module map of a directory. " +
      "Each file gets a size label and token estimate. " +
      "Type headers carry inheritance and decorators.",
    parameters: z.object({
      path: z.string().describe("Absolute path to directory"),
      json: z.boolean().optional().describe("Return machine-readable JSON output"),
    }),
    execute: async (params) => {
      const result = await service.digest([params.path], {
        json: params.json,
      });
      if (result.exitCode !== 0 && !result.stdout) {
        return `Error (exit ${result.exitCode}): ${result.stderr}`;
      }
      return result.stdout || result.stderr;
    },
  });

  // Show tool - extract symbol bodies
  server.addTool({
    name: "show",
    description:
      "Extract the full source body of one or more symbols from a file. " +
      "Supports suffix matching (e.g., 'Foo.Bar' matches '*.Foo.Bar'). " +
      "Use --signature to get header only.",
    parameters: z.object({
      file: z.string().describe("Absolute path to the file"),
      symbols: z.array(z.string()).describe("Symbol names to extract"),
      json: z.boolean().optional().describe("Return machine-readable JSON output"),
      signature: z.boolean().optional().describe("Return header/signature only, no body"),
    }),
    execute: async (params) => {
      const result = await service.show(params.file, params.symbols, {
        json: params.json,
        signature: params.signature,
      });
      if (result.exitCode !== 0 && !result.stdout) {
        return `Error (exit ${result.exitCode}): ${result.stderr}`;
      }
      return result.stdout || result.stderr;
    },
  });

  // Grep tool - AST-aware structural search
  server.addTool({
    name: "grep",
    description:
      "AST-aware structural search across a file or directory. " +
      "Matches are grouped by enclosing class/function, with kind tags [def]/[import]. " +
      "Comment/string noise is filtered by default. Regex is auto-detected.",
    parameters: z.object({
      pattern: z.string().describe("Search pattern (literal or regex, auto-detected)"),
      path: z.string().describe("Absolute path to search"),
      json: z.boolean().optional().describe("Return machine-readable JSON output"),
      kind: z.enum(["def", "call", "ref", "import"]).optional().describe("Narrow results by classification kind"),
      wordMatch: z.boolean().optional().describe("Match whole words only (-w)"),
      caseInsensitive: z.boolean().optional().describe("Case-insensitive matching (-i)"),
      filesOnly: z.boolean().optional().describe("List matching files only (-l)"),
      count: z.boolean().optional().describe("Show match counts per file (-c)"),
      maxCount: z.number().optional().describe("Maximum number of matches per file (-m)"),
    }),
    execute: async (params) => {
      const result = await service.grep(params.pattern, [params.path], {
        json: params.json,
        kind: params.kind,
        wordMatch: params.wordMatch,
        caseInsensitive: params.caseInsensitive,
        filesOnly: params.filesOnly,
        count: params.count,
        maxCount: params.maxCount,
      });
      if (result.exitCode !== 0 && !result.stdout) {
        return `Error (exit ${result.exitCode}): ${result.stderr}`;
      }
      return result.stdout || result.stderr;
    },
  });
}
