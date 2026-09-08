// eslint-config-next 16.3.4 ships its default export as a ready flat
// config array (Linter.Config[]) — no FlatCompat/legacy `extends` shim
// needed anymore. Verified against the package's own dist/index.d.ts
// rather than assumed from older Next.js ESLint docs, which still show
// the FlatCompat pattern (CONVENTIONS.md #8).
import nextConfig from "eslint-config-next";

const eslintConfig = [
  ...nextConfig,
  {
    ignores: [
      "node_modules/**",
      ".next/**",
      "out/**",
      "build/**",
      "next-env.d.ts",
      "src/generated/**",
    ],
  },
];

export default eslintConfig;
