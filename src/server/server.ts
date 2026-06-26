import { FastMCP } from "fastmcp";
import { registerPrompts } from "../core/prompts.js";
import { registerResources } from "../core/resources.js";
import { registerTools } from "../core/tools.js";

// Create and start the MCP server
async function startServer(): Promise<FastMCP> {
  try {
    const server = new FastMCP({
      name: "ast-outline-mcp",
      version: "1.0.0",
    });

    // Register all resources, tools, and prompts
    registerResources(server);
    registerTools(server);
    registerPrompts(server);

    console.info("ast-outline MCP server initialized");
    return server;
  } catch (error) {
    console.error("Failed to initialize server:", error);
    process.exit(1);
  }
}

export default startServer;
