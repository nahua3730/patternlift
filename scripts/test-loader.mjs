// Minimal resolver hook so `node --test` can run this project's .ts files
// directly without pulling in jest/vitest/tsx: it only teaches Node's ESM
// loader what webpack/tsconfig already knows - that "@/x" means "<repo
// root>/x". Node's built-in TypeScript support (type-stripping) handles the
// rest.
import { register } from "node:module";
import { pathToFileURL } from "node:url";

register("./test-loader-hooks.mjs", pathToFileURL(`${process.cwd()}/scripts/`));
