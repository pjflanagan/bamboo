import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";
import prettier from "eslint-config-prettier/flat";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Turn off rules that conflict with Prettier formatting.
  prettier,
  // Layer boundaries. Dependencies point one way:
  //   app -> components -> hooks/providers -> lib -> design-system
  // The design system is a standalone UI library; it knows nothing of the app.
  {
    files: ["design-system/**"],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          patterns: [
            {
              group: ["@/app/*", "@/components/*", "@/hooks/*", "@/providers/*", "@/lib/*"],
              message: "design-system must not depend on app code.",
            },
            {
              group: ["@/hooks", "@/providers"],
              message: "design-system must not depend on app code.",
            },
          ],
        },
      ],
    },
  },
  {
    files: ["lib/**"],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          patterns: [
            {
              group: ["@/app/*", "@/components/*", "@/hooks/*", "@/providers/*"],
              message: "lib is framework-free logic; it must not depend on React app layers.",
            },
            {
              group: ["@/hooks", "@/providers"],
              message: "lib must not depend on React app layers.",
            },
          ],
        },
      ],
    },
  },
  {
    files: ["components/**", "hooks/**", "providers/**"],
    rules: {
      "no-restricted-imports": [
        "error",
        { patterns: [{ group: ["@/app/*"], message: "Shared code must not import from routes." }] },
      ],
    },
  },
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    // Not part of the app:
    "legacy/**",
    "data/**",
    "scripts/**",
    "print/**",
    "extension/**",
  ]),
]);

export default eslintConfig;
