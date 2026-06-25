import { FastMCP } from "fastmcp";

/**
 * Register all prompts with the MCP server
 */
export function registerPrompts(server: FastMCP) {
  server.addPrompt({
    name: "explore_codebase",
    description:
      "A prompt that guides an LLM to efficiently explore a codebase using ast-outline tools",
    arguments: [
      {
        name: "directory",
        description: "Root directory to explore",
        required: true,
      },
    ],
    load: async ({ directory }) => {
      return (
        `Explore the codebase at "${directory}" efficiently using ast-outline tools:\n\n` +
        `1. Start with \`ast_digest\` on the root directory to get a high-level module map\n` +
        `2. Use \`ast_outline\` on interesting files/subdirectories for structural details\n` +
        `3. Use \`ast_grep\` to find specific symbols, patterns, or usages\n` +
        `4. Use \`ast_show\` to read specific symbol bodies when needed\n\n` +
        `This approach uses far fewer tokens than reading entire files.`
      );
    },
  });
}
