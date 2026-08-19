import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";
import perfectionist from "eslint-plugin-perfectionist";
import { defineConfig, globalIgnores } from "eslint/config";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
  ]),
  {
    plugins: { perfectionist },
    rules: {
      // Imports: react -> third-party -> project (@/...), alphabetical
      // within each group, one blank line between groups.
      "perfectionist/sort-imports": [
        "error",
        {
          type: "alphabetical",
          order: "asc",
          newlinesBetween: 1,
          internalPattern: ["^@/.+"],
          groups: [
            "react",
            "builtin",
            "external",
            "internal",
            ["parent", "sibling", "index"],
          ],
          customGroups: [
            { groupName: "react", elementNamePattern: "^(react|react-dom)(/.+)?$" },
          ],
        },
      ],
      // Named specifiers within a single import statement, ascending.
      "perfectionist/sort-named-imports": ["error", { type: "alphabetical", order: "asc" }],
      // Object type / interface properties, ascending.
      "perfectionist/sort-interfaces": ["error", { type: "alphabetical", order: "asc" }],
      "perfectionist/sort-object-types": ["error", { type: "alphabetical", order: "asc" }],
      // JSX props, ascending.
      "perfectionist/sort-jsx-props": ["error", { type: "alphabetical", order: "asc" }],
    },
  },
]);

export default eslintConfig;
