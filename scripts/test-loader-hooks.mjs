import { pathToFileURL } from "node:url";

const projectRoot = pathToFileURL(`${process.cwd()}/`);

export async function resolve(specifier, context, nextResolve) {
  if (specifier.startsWith("@/")) {
    const rewritten = new URL(`${specifier.slice(2)}.ts`, projectRoot).href;
    return nextResolve(rewritten, context);
  }
  return nextResolve(specifier, context);
}
