import assert from "node:assert/strict";
import { mkdir, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { resolve } from "node:path";
import test from "node:test";

import { getSmokeWorkspaceRoot } from "./smoke/lib.mjs";

test("getSmokeWorkspaceRoot respects SHIPSTACK_SMOKE_TMPDIR", async () => {
  const customRoot = resolve(tmpdir(), "shipstack-smoke-custom-root");
  const original = process.env.SHIPSTACK_SMOKE_TMPDIR;

  await mkdir(customRoot, { recursive: true });
  process.env.SHIPSTACK_SMOKE_TMPDIR = customRoot;

  try {
    assert.equal(getSmokeWorkspaceRoot(), customRoot);
  } finally {
    if (original === undefined) {
      delete process.env.SHIPSTACK_SMOKE_TMPDIR;
    } else {
      process.env.SHIPSTACK_SMOKE_TMPDIR = original;
    }

    await rm(customRoot, { recursive: true, force: true });
  }
});

test("getSmokeWorkspaceRoot prefers Linux /tmp over inherited Windows temp paths", () => {
  const originalTemp = process.env.TEMP;
  const originalTmp = process.env.TMP;
  const originalTmpdir = process.env.TMPDIR;

  delete process.env.SHIPSTACK_SMOKE_TMPDIR;
  process.env.TEMP = "/mnt/c/Users/example/AppData/Local/Temp";
  process.env.TMP = "/mnt/c/Users/example/AppData/Local/Temp";
  delete process.env.TMPDIR;

  try {
    assert.equal(getSmokeWorkspaceRoot(), "/tmp");
  } finally {
    if (originalTemp === undefined) {
      delete process.env.TEMP;
    } else {
      process.env.TEMP = originalTemp;
    }

    if (originalTmp === undefined) {
      delete process.env.TMP;
    } else {
      process.env.TMP = originalTmp;
    }

    if (originalTmpdir === undefined) {
      delete process.env.TMPDIR;
    } else {
      process.env.TMPDIR = originalTmpdir;
    }
  }
});
