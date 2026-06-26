import { FastMCP } from "fastmcp";
import { registerPrompts } from "../src/core/prompts";

describe("registerPrompts", () => {
  let server: FastMCP;
  let registeredPrompts: Map<string, { arguments: unknown[]; load: (...args: unknown[]) => Promise<string> }>;

  beforeEach(() => {
    registeredPrompts = new Map();
    server = {
      addPrompt: jest.fn((prompt: { name: string; arguments: unknown[]; load: (...args: unknown[]) => Promise<string> }) => {
        registeredPrompts.set(prompt.name, prompt);
      }),
    } as unknown as FastMCP;

    registerPrompts(server);
  });

  it("registers the explore_codebase prompt", () => {
    expect(server.addPrompt).toHaveBeenCalledTimes(1);
    expect(registeredPrompts.has("explore_codebase")).toBe(true);
  });

  it("generates correct prompt text", async () => {
    const prompt = registeredPrompts.get("explore_codebase")!;
    const result = await prompt.load({ directory: "/my/project" });
    expect(result).toContain("/my/project");
    expect(result).toContain("digest");
    expect(result).toContain("outline");
    expect(result).toContain("grep");
    expect(result).toContain("show");
  });
});
