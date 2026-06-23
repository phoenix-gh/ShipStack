import { cp, rm } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const packageRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const repositoryRoot = resolve(packageRoot, "../..");
const source = resolve(repositoryRoot, "templates");
const target = resolve(packageRoot, "templates");

await rm(target, { force: true, recursive: true });
await cp(source, target, {
  recursive: true,
  filter: (path) =>
    !path.includes("node_modules") && !path.includes(".wrangler"),
});
