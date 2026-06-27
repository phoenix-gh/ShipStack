import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

test("release audit exposes external release evidence gates", async () => {
  const source = await readFile("scripts/release-audit.mjs", "utf8");

  assert.match(source, /Real Cloudflare deploy evidence is recorded/);
  assert.match(source, /Remote GitHub Actions evidence is recorded/);
  assert.match(
    source,
    /Remote npm publish workflow dry-run evidence is recorded/,
  );
});
