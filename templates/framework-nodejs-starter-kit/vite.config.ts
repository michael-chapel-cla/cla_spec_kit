import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    globals: true, // Enables global test functions like `describe`, `it`, `expect` without imports
    environment: "node", // Sets test environment to Node.js (use 'happy-dom' for browser-like tests)
    watch: false,
    reporters: [
      "default", // Default reporter for displaying test results in the terminal
      ["junit", { outputFile: "/tmp/unit.xml" }], // Generates a JUnit XML report in `/tmp/unit.xml`
    ],
    coverage: {
      provider: "v8", // Uses V8 engine for code coverage (better ESM support)
      // reportsDirectory: 'coverage',
      reporter: [
        "text", // Displays coverage summary directly in the terminal
        ["cobertura", { file: "unit.coverage.xml", directory: "/tmp" }], // Generates Cobertura XML report for SonarQube, Jenkins, etc.
      ],
      reportsDirectory: "/tmp",
      clean: false,
      all: true, // Include all files even if not tested
    },
  },
});