// @ts-check

import js from "@eslint/js";
import tseslint from "typescript-eslint";

export default tseslint.config(
  // Global ignores
  {
    ignores: ["dist/", "node_modules/", "*.cjs", "*.mjs", "coverage/"],
  },

  // Base JS/TS recommended rules
  js.configs.recommended,
  ...tseslint.configs.recommended,

  // Project-specific rules
  {
    rules: {
      // Allow console for server-side logging
      "no-console": "off",

      // Require explicit return types on functions/methods
      "@typescript-eslint/explicit-function-return-type": "warn",

      // Warn about unused variables (ignore underscore-prefixed)
      "@typescript-eslint/no-unused-vars": [
        "warn",
        {
          argsIgnorePattern: "^_",
          varsIgnorePattern: "^_",
        },
      ],

      // Prefer const over let when variables aren't reassigned
      "prefer-const": "error",
    },
  },
);
