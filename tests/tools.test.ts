import { FastMCP } from "fastmcp";
import { registerTools } from "../src/core/tools";

// Mock the ast-outline service
jest.mock("../src/core/services/ast-outline-service", () => {
  const mockService = {
    outline: jest.fn(),
    digest: jest.fn(),
    show: jest.fn(),
    grep: jest.fn(),
    isAvailable: jest.fn(),
  };
  return {
    AstOutlineService: jest.fn(() => mockService),
    __mockService: mockService,
  };
});

// Get the mock service instance
const { __mockService: mockService } = jest.requireMock("../src/core/services/ast-outline-service") as { __mockService: Record<string, jest.Mock> };

describe("registerTools", () => {
  let server: FastMCP;
  let registeredTools: Map<string, { parameters: unknown; execute: Function }>;

  beforeEach(() => {
    jest.clearAllMocks();
    registeredTools = new Map();

    // Create a mock server that captures tool registrations
    server = {
      addTool: jest.fn((tool: { name: string; parameters: unknown; execute: Function }) => {
        registeredTools.set(tool.name, tool);
      }),
    } as unknown as FastMCP;

    registerTools(server);
  });

  it("registers all four tools", () => {
    expect(server.addTool).toHaveBeenCalledTimes(5);
    expect(registeredTools.has("outline")).toBe(true);
    expect(registeredTools.has("digest")).toBe(true);
    expect(registeredTools.has("show")).toBe(true);
    expect(registeredTools.has("grep")).toBe(true);
  });

  describe("outline tool", () => {
    it("calls service.outline with correct params (array)", async () => {
      mockService.outline.mockResolvedValue({
        stdout: "class Foo\n  def bar\n",
        stderr: "",
        exitCode: 0,
      });

      const tool = registeredTools.get("outline")!;
      const result = await tool.execute({
        paths: ["src/main.py"],
        json: true,
        imports: true,
        noPrivate: false,
      });

      expect(mockService.outline).toHaveBeenCalledWith(["src/main.py"], {
        json: true,
        imports: true,
        noPrivate: false,
        noFields: undefined,
        noDocs: undefined,
        noAttrs: undefined,
      });
      expect(result).toBe("class Foo\n  def bar\n");
    });

    it("returns error message on non-zero exit with no stdout", async () => {
      mockService.outline.mockResolvedValue({
        stdout: "",
        stderr: "file not found",
        exitCode: 1,
      });

      const tool = registeredTools.get("outline")!;
      const result = await tool.execute({ paths: ["missing.py"] });
      expect(result).toBe("Error (exit 1): file not found");
    });

    it("returns stdout even on non-zero exit if present", async () => {
      mockService.outline.mockResolvedValue({
        stdout: "# note: no supported files found",
        stderr: "",
        exitCode: 0,
      });

      const tool = registeredTools.get("outline")!;
      const result = await tool.execute({ paths: ["empty/"] });
      expect(result).toBe("# note: no supported files found");
    });

    it("accepts paths as a single string", async () => {
      mockService.outline.mockResolvedValue({
        stdout: "class Foo\n  def bar\n",
        stderr: "",
        exitCode: 0,
      });

      const tool = registeredTools.get("outline")!;
      const result = await tool.execute({
        paths: "src/main.py",
        json: true,
      });

      expect(mockService.outline).toHaveBeenCalledWith(["src/main.py"], {
        json: true,
        imports: undefined,
        noPrivate: undefined,
        noFields: undefined,
        noDocs: undefined,
        noAttrs: undefined,
      });
      expect(result).toBe("class Foo\n  def bar\n");
    });
  });

  describe("digest tool", () => {
    it("calls service.digest with correct params (array)", async () => {
      mockService.digest.mockResolvedValue({
        stdout: "[medium] src/main.py (~200 tokens)\n  class App\n",
        stderr: "",
        exitCode: 0,
      });

      const tool = registeredTools.get("digest")!;
      const result = await tool.execute({ paths: ["src/"], json: false });

      expect(mockService.digest).toHaveBeenCalledWith(["src/"], { json: false });
      expect(result).toContain("[medium]");
    });

    it("accepts paths as a single string", async () => {
      mockService.digest.mockResolvedValue({
        stdout: "[medium] src/main.py (~200 tokens)",
        stderr: "",
        exitCode: 0,
      });

      const tool = registeredTools.get("digest")!;
      const result = await tool.execute({ paths: "src/", json: true });

      expect(mockService.digest).toHaveBeenCalledWith(["src/"], { json: true });
      expect(result).toContain("[medium]");
    });
  });

  describe("show tool", () => {
    it("calls service.show with correct params (array)", async () => {
      mockService.show.mockResolvedValue({
        stdout: "def TakeDamage(self, amount):\n    self.hp -= amount\n",
        stderr: "",
        exitCode: 0,
      });

      const tool = registeredTools.get("show")!;
      const result = await tool.execute({
        file: "Player.py",
        symbols: ["TakeDamage"],
        signature: false,
      });

      expect(mockService.show).toHaveBeenCalledWith("Player.py", ["TakeDamage"], {
        json: undefined,
        signature: false,
      });
      expect(result).toContain("TakeDamage");
    });

    it("accepts symbols as a single string", async () => {
      mockService.show.mockResolvedValue({
        stdout: "def TakeDamage(self, amount):\n    self.hp -= amount\n",
        stderr: "",
        exitCode: 0,
      });

      const tool = registeredTools.get("show")!;
      const result = await tool.execute({
        file: "Player.py",
        symbols: "TakeDamage",
      });

      expect(mockService.show).toHaveBeenCalledWith("Player.py", ["TakeDamage"], {
        json: undefined,
        signature: undefined,
      });
      expect(result).toContain("TakeDamage");
    });
  });

  describe("grep tool", () => {
    it("calls service.grep with correct params (array)", async () => {
      mockService.grep.mockResolvedValue({
        stdout: "src/main.py:10 [def] handle_request\n",
        stderr: "",
        exitCode: 0,
      });

      const tool = registeredTools.get("grep")!;
      const result = await tool.execute({
        pattern: "handle_request",
        paths: ["src/"],
        kind: "def",
        wordMatch: true,
      });

      expect(mockService.grep).toHaveBeenCalledWith("handle_request", ["src/"], {
        json: undefined,
        kind: "def",
        wordMatch: true,
        caseInsensitive: undefined,
        filesOnly: undefined,
        count: undefined,
        maxCount: undefined,
      });
      expect(result).toContain("[def]");
    });

    it("accepts paths as a single string", async () => {
      mockService.grep.mockResolvedValue({
        stdout: "src/main.py:10 [def] handle_request\n",
        stderr: "",
        exitCode: 0,
      });

      const tool = registeredTools.get("grep")!;
      const result = await tool.execute({
        pattern: "handle_request",
        paths: "src/",
        kind: "def",
      });

      expect(mockService.grep).toHaveBeenCalledWith("handle_request", ["src/"], {
        json: undefined,
        kind: "def",
        wordMatch: undefined,
        caseInsensitive: undefined,
        filesOnly: undefined,
        count: undefined,
        maxCount: undefined,
      });
      expect(result).toContain("[def]");
    });
  });
});
