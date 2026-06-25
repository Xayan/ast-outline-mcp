import { FastMCP } from "fastmcp";

/**
 * Register all resources with the MCP server
 */
export function registerResources(server: FastMCP) {
  // No static resources needed - ast-outline is stateless and operates on
  // files provided at call time via the tool parameters.
}
 