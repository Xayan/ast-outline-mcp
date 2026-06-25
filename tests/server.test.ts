import startServer from "../src/server/server";

// Mock fastmcp
jest.mock("fastmcp", () => {
  return {
    FastMCP: jest.fn().mockImplementation(() => ({
      addTool: jest.fn(),
      addPrompt: jest.fn(),
      addResourceTemplate: jest.fn(),
      start: jest.fn(),
    })),
  };
});

describe("startServer", () => {
  it("returns a server instance", async () => {
    const server = await startServer();
    expect(server).toBeDefined();
    expect(server.addTool).toBeDefined();
    expect(server.start).toBeDefined();
  });

  it("registers tools, prompts, and resources", async () => {
    const server = await startServer();
    // 4 ast-outline tools
    expect(server.addTool).toHaveBeenCalledTimes(4);
    // 1 prompt
    expect(server.addPrompt).toHaveBeenCalledTimes(1);
  });
});
