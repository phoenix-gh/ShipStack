import assert from "node:assert/strict";
import test from "node:test";

import {
  buildDistTagCommands,
  packageNames,
  parseDistTagArgs,
} from "./npm-dist-tags.mjs";

test("buildDistTagCommands creates one npm dist-tag command per package", () => {
  const commands = buildDistTagCommands({
    version: "0.1.0-alpha.1",
    tag: "latest",
  });

  assert.deepEqual(commands, [
    {
      command: "npm",
      args: ["dist-tag", "add", "@shipstack-dev/core@0.1.0-alpha.1", "latest"],
    },
    {
      command: "npm",
      args: ["dist-tag", "add", "@shipstack-dev/cli@0.1.0-alpha.1", "latest"],
    },
    {
      command: "npm",
      args: ["dist-tag", "add", "create-shipstack-app@0.1.0-alpha.1", "latest"],
    },
  ]);
});

test("packageNames lists all publishable ShipStack packages", () => {
  assert.deepEqual(packageNames, [
    "@shipstack-dev/core",
    "@shipstack-dev/cli",
    "create-shipstack-app",
  ]);
});

test("parseDistTagArgs supports version, tag, and dry-run options", () => {
  assert.deepEqual(
    parseDistTagArgs([
      "--version",
      "0.1.0-alpha.1",
      "--tag",
      "latest",
      "--dry-run",
    ]),
    {
      dryRun: true,
      tag: "latest",
      version: "0.1.0-alpha.1",
    },
  );
});
