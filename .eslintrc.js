module.exports = {
  parser: "@typescript-eslint/parser",
  root: true,
  parserOptions: {
    ecmaVersion: "es2022",
    sourceType: "module",
    project: "./tsconfig.json",
    tsconfigRootDir: __dirname,
  },
  plugins: ["@typescript-eslint"],
  extends: [
    "eslint:recommended",
    "plugin:prettier/recommended",
    "plugin:@typescript-eslint/recommended",
    "plugin:@typescript-eslint/recommended-requiring-type-checking",
  ],
  env: {
    node: true,
  },
  rules: {
    complexity: ["error", { max: 8 }],
    "@typescript-eslint/no-explicit-any": ["error"],
    "@typescript-eslint/no-unused-vars": ["error"],
  },
};
