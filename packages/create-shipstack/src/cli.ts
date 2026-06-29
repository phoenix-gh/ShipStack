#!/usr/bin/env node
import { runCli } from "@shipstack-dev/cli";

const args = process.argv.slice(2);
const normalizedArgs = args[0] === "create" ? args : ["create", ...args];

runCli(normalizedArgs).catch((error: unknown) => {
  const message = error instanceof Error ? error.message : String(error);
  console.error(message);
  process.exitCode = 1;
});
