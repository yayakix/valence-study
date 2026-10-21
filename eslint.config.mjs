import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const UI_LAYERS = ["react", "react-dom", "next", "next/*", "zustand", "zustand/*", "@/components/*", "@/hooks/*", "@/app/*"];

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  {
    rules: {
      "import/no-cycle": "error",
    },
  },
  {
    files: ["domain/**/*.ts"],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          patterns: [
            {
              group: [...UI_LAYERS, "@/stores/*", "@/controllers", "@/controllers/*", "@/lib/*", "@/data", "@/data/*"],
              message: "The domain layer must stay framework-independent and receive data as arguments.",
            },
          ],
        },
      ],
    },
  },
  {
    files: ["lib/**/*.ts", "stores/**/*.ts", "controllers/**/*.ts", "data/**/*.ts"],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          patterns: [
            {
              group: ["@/components/*", "@/hooks/*", "@/app/*", "react", "react-dom", "next", "next/*"],
              message: "Only views and hooks may depend on React or UI modules.",
            },
          ],
        },
      ],
    },
  },
  globalIgnores([".next/**", "out/**", "build/**", "next-env.d.ts", "playwright-report/**", "test-results/**"]),
]);

export default eslintConfig;
