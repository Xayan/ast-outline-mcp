import { AstOutlineService } from "../src/core/services/ast-outline-service";
import { execFile } from "node:child_process";

// Mock child_process
jest.mock("node:child_process", () => ({
  execFile: jest.fn(),
}));

jest.mock("node:util", () => ({
  promisify: (fn: (...args: unknown[]) => void) => {
    return (...args: unknown[]) => {
      return new Promise((resolve, reject) => {
        fn(...args, (err: Error | null, result: unknown) => {
          if (err) reject(err);
          else resolve(result);
        });
      });
    };
  },
}));

const mockedExecFile = execFile as unknown as jest.Mock;

describe("AstOutlineService", () => {
  let service: AstOutlineService;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new AstOutlineService();
  });

  function mockSuccess(stdout: string, stderr = "") {
    mockedExecFile.mockImplementation(
      (_cmd: string, _args: string[], _opts: object, cb: (err: Error | null, result: { stdout: string; stderr: string }) => void) => {
        cb(null, { stdout, stderr });
      }
    );
  }

  function mockError(stdout: string, stderr: string, code: number) {
    mockedExecFile.mockImplementation(
      (_cmd: string, _args: string[], _opts: object, cb: (err: Error | null, result?: { stdout: string; stderr: string }) => void) => {
        const error = new Error("Command failed") as Error & {
          stdout: string;
          stderr: string;
          code: number;
        };
        error.stdout = stdout;
        error.stderr = stderr;
        error.code = code;
        cb(error);
      }
    );
  }

  function mockNotFound() {
    mockedExecFile.mockImplementation(
      (_cmd: string, _args: string[], _opts: object, cb: (err: Error | null, result?: { stdout: string; stderr: string }) => void) => {
        const error = new Error("ENOENT") as Error & { code: string };
        error.code = "ENOENT";
        cb(error);
      }
    );
  }

  describe("constructor", () => {
    it("uses default binary path", () => {
      mockSuccess("output");
      service.outline(["test.ts"]);
      expect(mockedExecFile).toHaveBeenCalledWith(
        "ast-outline",
        expect.any(Array),
        expect.any(Object),
        expect.any(Function)
      );
    });

    it("accepts custom binary path", () => {
      mockSuccess("output");
      const customService = new AstOutlineService({
        binaryPath: "/usr/local/bin/ast-outline",
      });
      customService.outline(["test.ts"]);
      expect(mockedExecFile).toHaveBeenCalledWith(
        "/usr/local/bin/ast-outline",
        expect.any(Array),
        expect.any(Object),
        expect.any(Function)
      );
    });

    it("accepts custom timeout", () => {
      mockSuccess("output");
      const customService = new AstOutlineService({ timeout: 5000 });
      customService.outline(["test.ts"]);
      expect(mockedExecFile).toHaveBeenCalledWith(
        "ast-outline",
        expect.any(Array),
        expect.objectContaining({ timeout: 5000 }),
        expect.any(Function)
      );
    });
  });

  describe("outline", () => {
    it("calls with correct base arguments", async () => {
      mockSuccess("class Foo\n  def bar\n");
      const result = await service.outline(["src/main.py"]);
      expect(mockedExecFile).toHaveBeenCalledWith(
        "ast-outline",
        ["outline", "src/main.py"],
        expect.any(Object),
        expect.any(Function)
      );
      expect(result.stdout).toBe("class Foo\n  def bar\n");
      expect(result.exitCode).toBe(0);
    });

    it("passes --json flag", async () => {
      mockSuccess('{"tool":"ast-outline"}');
      await service.outline(["src/"], { json: true });
      expect(mockedExecFile).toHaveBeenCalledWith(
        "ast-outline",
        ["outline", "src/", "--json"],
        expect.any(Object),
        expect.any(Function)
      );
    });

    it("passes --imports flag", async () => {
      mockSuccess("import os");
      await service.outline(["test.py"], { imports: true });
      expect(mockedExecFile).toHaveBeenCalledWith(
        "ast-outline",
        ["outline", "test.py", "--imports"],
        expect.any(Object),
        expect.any(Function)
      );
    });

    it("passes all filter flags", async () => {
      mockSuccess("output");
      await service.outline(["test.py"], {
        noPrivate: true,
        noFields: true,
        noDocs: true,
        noAttrs: true,
      });
      expect(mockedExecFile).toHaveBeenCalledWith(
        "ast-outline",
        ["outline", "test.py", "--no-private", "--no-fields", "--no-docs", "--no-attrs"],
        expect.any(Object),
        expect.any(Function)
      );
    });

    it("handles multiple paths", async () => {
      mockSuccess("output");
      await service.outline(["src/a.ts", "src/b.ts", "lib/"]);
      expect(mockedExecFile).toHaveBeenCalledWith(
        "ast-outline",
        ["outline", "src/a.ts", "src/b.ts", "lib/"],
        expect.any(Object),
        expect.any(Function)
      );
    });
  });

  describe("digest", () => {
    it("calls with correct arguments", async () => {
      mockSuccess("[medium] src/main.py (~200 tokens)");
      const result = await service.digest(["src/"]);
      expect(mockedExecFile).toHaveBeenCalledWith(
        "ast-outline",
        ["digest", "src/"],
        expect.any(Object),
        expect.any(Function)
      );
      expect(result.stdout).toContain("[medium]");
    });

    it("passes --json flag", async () => {
      mockSuccess("{}");
      await service.digest(["src/"], { json: true });
      expect(mockedExecFile).toHaveBeenCalledWith(
        "ast-outline",
        ["digest", "src/", "--json"],
        expect.any(Object),
        expect.any(Function)
      );
    });
  });

  describe("show", () => {
    it("calls with file and single symbol", async () => {
      mockSuccess("def TakeDamage(self, amount):\n  ...");
      const result = await service.show("Player.py", ["TakeDamage"]);
      expect(mockedExecFile).toHaveBeenCalledWith(
        "ast-outline",
        ["show", "Player.py", "TakeDamage"],
        expect.any(Object),
        expect.any(Function)
      );
      expect(result.stdout).toContain("TakeDamage");
    });

    it("calls with multiple symbols", async () => {
      mockSuccess("output");
      await service.show("Player.py", ["TakeDamage", "Heal", "Die"]);
      expect(mockedExecFile).toHaveBeenCalledWith(
        "ast-outline",
        ["show", "Player.py", "TakeDamage", "Heal", "Die"],
        expect.any(Object),
        expect.any(Function)
      );
    });

    it("passes --json flag", async () => {
      mockSuccess("{}");
      await service.show("test.ts", ["foo"], { json: true });
      expect(mockedExecFile).toHaveBeenCalledWith(
        "ast-outline",
        ["show", "test.ts", "foo", "--json"],
        expect.any(Object),
        expect.any(Function)
      );
    });

    it("passes --signature flag", async () => {
      mockSuccess("def foo(x: int) -> str");
      await service.show("test.py", ["foo"], { signature: true });
      expect(mockedExecFile).toHaveBeenCalledWith(
        "ast-outline",
        ["show", "test.py", "foo", "--signature"],
        expect.any(Object),
        expect.any(Function)
      );
    });
  });

  describe("grep", () => {
    it("calls with pattern and paths", async () => {
      mockSuccess("src/main.py:10 [def] TakeDamage");
      const result = await service.grep("TakeDamage", ["src/"]);
      expect(mockedExecFile).toHaveBeenCalledWith(
        "ast-outline",
        ["grep", "TakeDamage", "src/"],
        expect.any(Object),
        expect.any(Function)
      );
      expect(result.stdout).toContain("TakeDamage");
    });

    it("passes --json flag", async () => {
      mockSuccess("{}");
      await service.grep("foo", ["src/"], { json: true });
      expect(mockedExecFile).toHaveBeenCalledWith(
        "ast-outline",
        ["grep", "foo", "src/", "--json"],
        expect.any(Object),
        expect.any(Function)
      );
    });

    it("passes --kind flag", async () => {
      mockSuccess("output");
      await service.grep("foo", ["src/"], { kind: "def" });
      expect(mockedExecFile).toHaveBeenCalledWith(
        "ast-outline",
        ["grep", "foo", "src/", "--kind", "def"],
        expect.any(Object),
        expect.any(Function)
      );
    });

    it("passes -w flag for word match", async () => {
      mockSuccess("output");
      await service.grep("foo", ["src/"], { wordMatch: true });
      expect(mockedExecFile).toHaveBeenCalledWith(
        "ast-outline",
        ["grep", "foo", "src/", "-w"],
        expect.any(Object),
        expect.any(Function)
      );
    });

    it("passes -i flag for case insensitive", async () => {
      mockSuccess("output");
      await service.grep("foo", ["src/"], { caseInsensitive: true });
      expect(mockedExecFile).toHaveBeenCalledWith(
        "ast-outline",
        ["grep", "foo", "src/", "-i"],
        expect.any(Object),
        expect.any(Function)
      );
    });

    it("passes -l flag for files only", async () => {
      mockSuccess("src/main.py");
      await service.grep("foo", ["src/"], { filesOnly: true });
      expect(mockedExecFile).toHaveBeenCalledWith(
        "ast-outline",
        ["grep", "foo", "src/", "-l"],
        expect.any(Object),
        expect.any(Function)
      );
    });

    it("passes -c flag for count", async () => {
      mockSuccess("src/main.py:5");
      await service.grep("foo", ["src/"], { count: true });
      expect(mockedExecFile).toHaveBeenCalledWith(
        "ast-outline",
        ["grep", "foo", "src/", "-c"],
        expect.any(Object),
        expect.any(Function)
      );
    });

    it("passes -m flag for max count", async () => {
      mockSuccess("output");
      await service.grep("foo", ["src/"], { maxCount: 5 });
      expect(mockedExecFile).toHaveBeenCalledWith(
        "ast-outline",
        ["grep", "foo", "src/", "-m", "5"],
        expect.any(Object),
        expect.any(Function)
      );
    });

    it("passes all flags together", async () => {
      mockSuccess("output");
      await service.grep("foo", ["src/", "lib/"], {
        json: true,
        kind: "call",
        wordMatch: true,
        caseInsensitive: true,
        maxCount: 10,
      });
      expect(mockedExecFile).toHaveBeenCalledWith(
        "ast-outline",
        ["grep", "foo", "src/", "lib/", "--json", "--kind", "call", "-w", "-i", "-m", "10"],
        expect.any(Object),
        expect.any(Function)
      );
    });
  });

  describe("isAvailable", () => {
    it("returns true when binary exists", async () => {
      mockSuccess("0.6.0");
      const available = await service.isAvailable();
      expect(available).toBe(true);
      expect(mockedExecFile).toHaveBeenCalledWith(
        "ast-outline",
        ["--version"],
        expect.any(Object),
        expect.any(Function)
      );
    });

    it("returns false when binary not found", async () => {
      mockNotFound();
      const available = await service.isAvailable();
      expect(available).toBe(false);
    });
  });

  describe("error handling", () => {
    it("returns stdout and stderr on non-zero exit", async () => {
      mockError("# note: no matches found", "warning", 0);
      // ast-outline returns exit 0 even on user-facing failures
      const result = await service.outline(["nonexistent.py"]);
      expect(result.stdout).toBe("# note: no matches found");
    });

    it("throws on ENOENT (binary not found)", async () => {
      mockNotFound();
      await expect(service.outline(["test.py"])).rejects.toThrow("ENOENT");
    });
  });
});
