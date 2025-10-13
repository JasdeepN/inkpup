// Migrated ESLint config for v9+
// @ts-check
import { FlatCompat } from "@eslint/eslintrc";
import path from "node:path";

const compat = new FlatCompat({
  baseDirectory: path.resolve(),
});

export default [
  ...compat.extends("next/core-web-vitals"),
  {
    ignores: [".next/*", "node_modules/*"],
  },
];
