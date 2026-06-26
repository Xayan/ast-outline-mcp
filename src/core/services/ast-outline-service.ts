import { execFile } from "node:child_process";
import { promisify } from "node:util";

const execFileAsync = promisify(execFile);

export interface AstOutlineOptions {
  /** Path to the ast-outline binary. Defaults to "ast-outline" (found on PATH). */
  binaryPath?: string;
  /** Maximum execution time in milliseconds. Defaults to 30000. */
  timeout?: number;
}

export interface CommandResult {
  stdout: string;
  stderr: string;
  exitCode: number;
}

/**
 * Service for invoking the ast-outline CLI.
 * All commands are stateless: parse on demand, print, exit.
 */
export class AstOutlineService {
  private readonly binaryPath: string;
  private readonly timeout: number;

  constructor(options: AstOutlineOptions = {}) {
    this.binaryPath = options.binaryPath ?? "ast-outline";
    this.timeout = options.timeout ?? 30000;
  }

  /**
   * Execute an ast-outline command with the given arguments.
   */
  private async exec(args: string[]): Promise<CommandResult> {
    try {
      const { stdout, stderr } = await execFileAsync(this.binaryPath, args, {
        timeout: this.timeout,
        maxBuffer: 10 * 1024 * 1024, // 10MB
      });
      return { stdout, stderr, exitCode: 0 };
    } catch (error: unknown) {
      const execError = error as { stdout?: string; stderr?: string; code?: number | string };
      // ast-outline uses exit code 0 for user-facing failures (by design).
      // Real crashes propagate non-zero.
      if (execError.stdout !== undefined) {
        return {
          stdout: execError.stdout ?? "",
          stderr: execError.stderr ?? "",
          exitCode: typeof execError.code === "number" ? execError.code : 1,
        };
      }
      throw error;
    }
  }

  async help(): Promise<CommandResult> {
    return this.exec(["help"]);
  }

  /**
   * Structural outline of one or more files/directories.
   * Signatures with line ranges, no bodies.
   */
  async outline(
    paths: string[],
    options: {
      json?: boolean;
      imports?: boolean;
      noPrivate?: boolean;
      noFields?: boolean;
      noDocs?: boolean;
      noAttrs?: boolean;
    } = {},
  ): Promise<CommandResult> {
    const args = ["outline", ...paths];
    if (options.json) args.push("--json");
    if (options.imports) args.push("--imports");
    if (options.noPrivate) args.push("--no-private");
    if (options.noFields) args.push("--no-fields");
    if (options.noDocs) args.push("--no-docs");
    if (options.noAttrs) args.push("--no-attrs");
    return this.exec(args);
  }

  /**
   * Compact one-page module map.
   * Each file gets a size label and token estimate.
   */
  async digest(
    paths: string[],
    options: {
      json?: boolean;
    } = {},
  ): Promise<CommandResult> {
    const args = ["digest", ...paths];
    if (options.json) args.push("--json");
    return this.exec(args);
  }

  /**
   * Extract the source body of one or more symbols from a file.
   */
  async show(
    file: string,
    symbols: string[],
    options: {
      json?: boolean;
      signature?: boolean;
    } = {},
  ): Promise<CommandResult> {
    const args = ["show", file, ...symbols];
    if (options.json) args.push("--json");
    if (options.signature) args.push("--signature");
    return this.exec(args);
  }

  /**
   * AST-aware structural search.
   * Matches grouped by enclosing class/function.
   */
  async grep(
    pattern: string,
    paths: string[],
    options: {
      json?: boolean;
      kind?: "def" | "call" | "ref" | "import";
      wordMatch?: boolean;
      caseInsensitive?: boolean;
      filesOnly?: boolean;
      count?: boolean;
      maxCount?: number;
    } = {},
  ): Promise<CommandResult> {
    const args = ["grep", pattern, ...paths];
    if (options.json) args.push("--json");
    if (options.kind) args.push("--kind", options.kind);
    if (options.wordMatch) args.push("-w");
    if (options.caseInsensitive) args.push("-i");
    if (options.filesOnly) args.push("-l");
    if (options.count) args.push("-c");
    if (options.maxCount !== undefined) args.push("-m", String(options.maxCount));
    return this.exec(args);
  }

  /**
   * Check if ast-outline is available on the system.
   */
  async isAvailable(): Promise<boolean> {
    try {
      const result = await this.exec(["--version"]);
      return result.exitCode === 0;
    } catch {
      return false;
    }
  }
}
