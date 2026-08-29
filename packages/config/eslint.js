/**
 * Shared ESLint flat config.
 *
 * Architectural boundary (ARCHITECTURE.md §2, AGENTS.md §2):
 *   aviation        -> nothing in this repo, no react, no next, no I/O
 *   aviation-data   -> aviation only
 *   db              -> neither ui nor web (and not aviation in Phase 1)
 *   ui              -> aviation, aviation-data; not db or web
 *   web             -> all of the above
 *   config          -> nothing in this repo (tooling only)
 *
 * eslint-plugin-boundaries enforces workspace edges. no-restricted-imports is
 * the belt for npm packages (react, next, node:fs) that the plugin would only
 * see with checkAllOrigins + a resolver. Both must stay.
 */
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import js from "@eslint/js";
import prettier from "eslint-config-prettier";
import boundaries from "eslint-plugin-boundaries";
import reactHooks from "eslint-plugin-react-hooks";
import { defineConfig, globalIgnores } from "eslint/config";
import globals from "globals";
import tseslint from "typescript-eslint";

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), "../..");

const workspaceElements = [
  { type: "aviation", pattern: "packages/aviation" },
  { type: "aviation-data", pattern: "packages/aviation-data" },
  { type: "db", pattern: "packages/db" },
  { type: "ui", pattern: "packages/ui" },
  { type: "config", pattern: "packages/config" },
  { type: "web", pattern: "apps/web" },
];

export default defineConfig(
  globalIgnores([
    "**/node_modules/**",
    "**/.next/**",
    "**/dist/**",
    "**/.turbo/**",
    "**/coverage/**",
    "pnpm-lock.yaml",
    "**/public/sw.js",
    "**/public/sw.js.map",
    "**/public/swe-worker-*.js",
  ]),
  js.configs.recommended,
  ...tseslint.configs.recommended,
  prettier,
  {
    languageOptions: {
      globals: { ...globals.node },
    },
  },
  {
    files: ["**/*.{ts,tsx}"],
    languageOptions: {
      parser: tseslint.parser,
      parserOptions: {
        tsconfigRootDir: repoRoot,
      },
    },
  },
  {
    files: ["**/*.{tsx,jsx}"],
    plugins: {
      "react-hooks": reactHooks,
    },
    rules: {
      ...reactHooks.configs.recommended.rules,
    },
  },
  {
    plugins: { boundaries },
    settings: {
      "boundaries/root-path": repoRoot,
      "boundaries/elements": workspaceElements,
    },
    rules: {
      "boundaries/dependencies": [
        "error",
        {
          default: "disallow",
          // Last matching policy wins. Allow listed edges; everything else stays closed.
          policies: [
            {
              from: { element: { type: "aviation-data" } },
              allow: { to: { element: { type: "aviation" } } },
            },
            {
              from: { element: { type: "ui" } },
              allow: { to: { element: { type: ["aviation", "aviation-data"] } } },
            },
            {
              from: { element: { type: "web" } },
              allow: {
                to: {
                  element: { type: ["aviation", "aviation-data", "db", "ui", "config"] },
                },
              },
            },
          ],
        },
      ],
    },
  },
  {
    files: ["packages/aviation/src/**/*.{ts,tsx,js,mjs}"],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          paths: [
            {
              name: "react",
              message:
                "packages/aviation is the pure calculation core. No React. See ARCHITECTURE.md §2.",
            },
            {
              name: "react-dom",
              message:
                "packages/aviation is the pure calculation core. No React. See ARCHITECTURE.md §2.",
            },
            {
              name: "next",
              message:
                "packages/aviation is the pure calculation core. No Next.js. See ARCHITECTURE.md §2.",
            },
          ],
          patterns: [
            {
              group: [
                "next/*",
                "react/*",
                "react-dom/*",
                "@flyte/ui",
                "@flyte/db",
                "@flyte/aviation-data",
                "@flyte/config",
              ],
              message:
                "packages/aviation depends on nothing in this repository and no UI framework.",
            },
            {
              group: [
                "node:fs",
                "node:fs/*",
                "node:http",
                "node:https",
                "node:net",
                "node:child_process",
                "node:dns",
                "node:tls",
                "node:dgram",
                "fs",
                "http",
                "https",
              ],
              message: "packages/aviation must not do I/O. Put adapters in packages/aviation-data.",
            },
          ],
        },
      ],
    },
  },
);
