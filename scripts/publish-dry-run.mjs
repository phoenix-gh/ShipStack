import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { resolve } from "node:path";
import { spawn } from "node:child_process";

const repositoryRoot = resolve(import.meta.dirname, "..");
const outputDir = await mkdtemp(
  resolve(tmpdir(), "shipstack-publish-dry-run-"),
);
const npmTag = process.env.NPM_TAG ?? "next";
const packages = ["packages/core", "packages/cli", "packages/create-shipstack"];

try {
  for (const packageDir of packages) {
    console.log(`Packing ${packageDir}`);
    const tarball = await pack(packageDir);

    console.log(`Dry-run publishing ${tarball} with tag ${npmTag}`);
    await run("npm", [
      "publish",
      tarball,
      "--dry-run",
      "--access",
      "public",
      "--tag",
      npmTag,
    ]);
  }

  console.log("npm publish dry-run passed.");
} finally {
  await rm(outputDir, {
    force: true,
    recursive: true,
  });
}

async function pack(packagePath) {
  const output = await run("pnpm", ["pack", "--pack-destination", outputDir], {
    cwd: resolve(repositoryRoot, packagePath),
  });
  const match = output.match(/Tarball Details\s*\n(.+\.tgz)/);

  if (!match) {
    throw new Error(`Failed to find tarball path in pack output:\n${output}`);
  }

  return match[1].trim();
}

async function run(command, args, options = {}) {
  return await new Promise((resolvePromise, reject) => {
    const child = spawn(command, args, {
      cwd: options.cwd ?? repositoryRoot,
      env: process.env,
      shell: process.platform === "win32",
      stdio: ["ignore", "pipe", "pipe"],
    });
    let output = "";

    child.stdout.on("data", (chunk) => {
      const text = chunk.toString();
      output += text;
      process.stdout.write(text);
    });
    child.stderr.on("data", (chunk) => {
      const text = chunk.toString();
      output += text;
      process.stderr.write(text);
    });
    child.on("error", reject);
    child.on("close", (code) => {
      if (code === 0) {
        resolvePromise(output);
        return;
      }

      reject(
        new Error(
          `Command failed with exit code ${code}: ${command} ${args.join(" ")}\n${output}`,
        ),
      );
    });
  });
}
