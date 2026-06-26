import { FastMCP } from "fastmcp";

/**
 * Register all prompts with the MCP server
 */
export function registerPrompts(server: FastMCP): void {
  server.addPrompt({
    name: "explore-codebase",
    description: "A prompt that guides an LLM to efficiently explore a codebase using ast-outline tools",
    arguments: [],
    load: async () => {
      return (
        `Explore the codebase and its state of development token-efficiently, focusing on relevant files and symbols while avoiding bloat.` +
        `Report back with a summary of findings, key files, and any interesting patterns or structures discovered. ` +
        `Suggest next steps for further development or exploration.\n\n` +
        `- Start with \`digest\` on the root directory to get a high-level module map\n` +
        `- Use \`outline\` on interesting files/subdirectories for structural details\n` +
        `- Use \`grep\` to find specific symbols, patterns, or usages\n` +
        `- Use \`show\` to read specific symbol bodies when needed`
      );
    },
  });
}
