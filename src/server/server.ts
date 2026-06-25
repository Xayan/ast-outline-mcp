import { FastMCP } from "fastmcp";
import { registerResources } from "../core/resources.js";
import { registerTools } from "../core/tools.js";
import { registerPrompts } from "../core/prompts.js";

// Create and start the MCP server
async function startServer() {
  try {
    const server = new FastMCP({
      name: "ast-outline-mcp",
      version: "1.0.0",
    });

    // Register all resources, tools, and prompts
    registerResources(server);
    registerTools(server);
    registerPrompts(server);

    console.error("ast-outline MCP server initialized");
    return server;
  } catch (error) {
    console.error("Failed to initialize server:", error);
    process.exit(1);
  }
}

export default startServer;
 