// ESLint configuration for Playwright + Cucumber BDD project
// Enforces 2-space indentation and recommended best practices

export default [
  {
    files: ["**/*.js"],
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: "module",
    },
    rules: {
      indent: ["error", 2],
      "no-tabs": "error",
      "eol-last": ["error", "always"],
      "no-trailing-spaces": "error",
      "semi": ["error", "always"],
      "quotes": ["error", "double"],
      "comma-dangle": ["error", "always-multiline"],
    },
  },
];
