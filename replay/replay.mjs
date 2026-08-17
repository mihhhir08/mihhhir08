#!/usr/bin/env node
// Replays a recorded run, forks it at a chosen step, and splices the rendered
// timeline into README.md between the replay markers.
//
//   node replay/replay.mjs 2       regenerate locally
//   node replay/replay.mjs --from-env    read TITLE (used by the workflow)
//
// No network, no model call, no dependencies. The alternate branches are
// recorded in trace.json, so the same fork always renders the same output --
// which is the point being demonstrated.

import { readFileSync, writeFileSync } from "node:fs";

const DIR = new URL(".", import.meta.url).pathname;
const README = DIR + "../README.md";
const START = "<!-- replay:start -->";
const END = "<!-- replay:end -->";
const REPO = "https://github.com/mihhhir08/mihhhir08";

// Trust boundary: titles come from issues anyone on GitHub can open. Only
// "replay: fork <digits>" is ever accepted, and the step is still checked
// against the recorded forks before anything is written.
export const parseTitle = (title) => {
  const m = /^replay: fork (\d+)$/.exec(String(title ?? "").trim());
  return m ? Number(m[1]) : null;
};

export const parseArg = (arg) =>
  /^\d+$/.test(String(arg ?? "").trim()) ? Number(arg) : null;

export function render(trace, at) {
  const alt = trace.alternates.find((a) => a.at === at);
  if (!alt) return null;

  // Size columns from the data: "reason" and "answer" are exactly as long as a
  // hand-picked width, which silently eats the separating space.
  const shown = [...trace.steps, ...alt.steps];
  const wOp = Math.max(...shown.map((s) => s.op.length)) + 3;
  const wDetail = Math.max(...shown.map((s) => s.detail.length)) + 3;
  const line = (i, s) =>
    `  ${String(i).padStart(2)}  ${s.op.padEnd(wOp)}${s.detail.padEnd(wDetail)}${
      s.out ? "→ " + s.out : ""
    }`.trimEnd();

  const out = [
    `run ${trace.run} · recorded ${trace.recorded.slice(0, 10)} · forked at step ${at}`,
    "",
    `? ${trace.prompt}`,
    "",
  ];
  // Steps before the fork replay identically, so they print once.
  for (let i = 0; i < at; i++) out.push(line(i, trace.steps[i]));
  out.push("", `  ── fork at ${at} ` + "─".repeat(28), "", "  recorded");
  for (let i = at; i < trace.steps.length; i++) out.push(line(i, trace.steps[i]));
  out.push("", "  forked");
  alt.steps.forEach((s, k) => out.push(line(at + k, s)));
  out.push(
    "",
    `  diverges: ${alt.why}`,
    `  outcome:  ${trace.steps.at(-1).detail}  →  ${alt.steps.at(-1).detail}`,
  );

  const links = trace.alternates
    .map((a) => `[${a.at}](${REPO}/issues/new?title=replay:%20fork%20${a.at})`)
    .join(" · ");

  return [
    START,
    "",
    "```text",
    ...out,
    "```",
    "",
    `Fork this run at step: ${links} — opens a pre-filled issue. The workflow replays it and rewrites this section.`,
    "",
    END,
  ].join("\n");
}

export function splice(readme, block) {
  const i = readme.indexOf(START);
  const j = readme.indexOf(END);
  if (i === -1 || j === -1) return null;
  return readme.slice(0, i) + block + readme.slice(j + END.length);
}

// Only run when invoked directly, so the test can import the pieces above.
if (process.argv[1] === new URL(import.meta.url).pathname) {
  const arg = process.argv[2];
  const at =
    arg === "--from-env" ? parseTitle(process.env.TITLE) : parseArg(arg);

  if (at === null) {
    console.error(`no fork step in: ${arg === "--from-env" ? process.env.TITLE : arg}`);
    process.exit(1);
  }

  const trace = JSON.parse(readFileSync(DIR + "trace.json", "utf8"));
  const block = render(trace, at);
  if (!block) {
    const valid = trace.alternates.map((a) => a.at).join(", ");
    console.error(`no recorded fork at step ${at}. valid: ${valid}`);
    process.exit(1);
  }

  const next = splice(readFileSync(README, "utf8"), block);
  if (!next) {
    console.error("replay markers not found in README.md");
    process.exit(1);
  }
  writeFileSync(README, next);
  console.log(`replayed fork ${at}`);
}
