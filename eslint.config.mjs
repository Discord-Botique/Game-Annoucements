import globals from "globals";
import pluginJs from "@eslint/js";
import tseslint from "typescript-eslint";
import eslintPluginPrettierRecommended from "eslint-plugin-prettier/recommended";

/** @type {import('eslint').Linter.Config[]} */
export default [
  { files: ["**/*.{json,ts}"] },
  {
    ignores: [
      "tsconfig.json",
      "package.json",
      "**/*.js",
      ".vscode/**",
      "supabase/db.types.ts",
      "supabase/functions/import_map.json",
    ],
  },
  { languageOptions: { globals: globals.node } },
  pluginJs.configs.recommended,
  ...tseslint.configs.recommended,
  eslintPluginPrettierRecommended,
  {
    rules: {
      complexity: ["error", { max: 10 }],
      "@typescript-eslint/no-explicit-any": ["error"],
      "@typescript-eslint/no-unused-vars": ["error"],
    },
  },
];
