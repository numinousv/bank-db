// Next 16 ships native flat-config presets, so no @eslint/eslintrc
// FlatCompat layer is needed (`next lint` was removed in Next 15+).
import nextVitals from "eslint-config-next/core-web-vitals";

const config = [
  // Next.js recommended rules (react, hooks, a11y, import hygiene).
  ...nextVitals,
  {
    // Jest globals are not part of the Next preset, so declare the
    // handful used in __tests__/ + jest setup instead of adding a plugin.
    files: [
      "__tests__/**/*.{js,jsx,ts,tsx}",
      "jest.setup.js",
      "jest.config.js",
    ],
    languageOptions: {
      globals: {
        describe: "readonly",
        test: "readonly",
        it: "readonly",
        expect: "readonly",
        beforeEach: "readonly",
        afterEach: "readonly",
        beforeAll: "readonly",
        afterAll: "readonly",
        jest: "readonly",
      },
    },
  },
  {
    ignores: [".next/", "node_modules/", "out/"],
  },
];

export default config;
