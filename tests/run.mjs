#!/usr/bin/env node
// Zero-dependency test runner: 16 cases, 9 of them behavioural (spawn -> exit code/stdout).
import { spawnSync } from "node:child_process";
import { cpSync, mkdtempSync, rmSync, readFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import assert from "node:assert/strict";

const here = dirname(fileURLToPath(import.meta.url));
const repo = dirname(here);
const bin = join(repo, "bin/context-mode-adapter-matrix");
const upstream = join(repo, "examples/in/upstream");
const aligned = join(repo, "examples/in/aligned");
const tmp = mkdtempSync(join(tmpdir(), "cm-matrix-"));
const driftCopy = join(tmp, "drift");
cpSync(upstream, driftCopy, { recursive: true });
const cleanCopy = join(tmp, "clean");
cpSync(aligned, cleanCopy, { recursive: true });

const run = (args) => spawnSync(process.execPath, [bin, ...args], { encoding: "utf8" });
const json = (r) => JSON.parse(r.stdout);
let n = 0, failed = 0;
function test(name, fn) {
  n++;
  try { fn(); console.log(`ok ${n} - ${name}`); }
  catch (e) { failed++; console.log(`not ok ${n} - ${name}\n  ${e.message.split("\n")[0]}`); }
}

test("--help exits 0 and prints usage", () => {
  const r = run(["--help"]);
  assert.equal(r.status, 0);
  assert.match(r.stdout, /Usage:/);
});
test("--version exits 0", () => {
  const r = run(["--version"]);
  assert.equal(r.status, 0);
  assert.match(r.stdout.trim(), /^\d+\.\d+\.\d+$/);
});
test("missing --root is a usage error (exit 2)", () => {
  assert.equal(run([]).status, 2);
});
test("unknown flag is a usage error (exit 2)", () => {
  assert.equal(run(["--root", aligned, "--nope"]).status, 2);
});
test("non-checkout root is an input error (exit 2)", () => {
  const r = run(["--root", tmp]);
  assert.equal(r.status, 2);
  assert.match(r.stderr, /not a context-mode checkout/);
});
test("aligned fixture exits 0 with no findings", () => {
  const r = run(["--root", cleanCopy]);
  assert.equal(r.status, 0, r.stdout + r.stderr);
  assert.match(r.stdout, /0 error\(s\), 0 warning\(s\)/);
});
test("drifted fixture exits 1 and reports errors", () => {
  const r = run(["--root", driftCopy]);
  assert.equal(r.status, 1);
  assert.match(r.stdout, /RESULT: \d+ error\(s\)/);
});
test("--json output is parseable and complete", () => {
  const d = json(run(["--root", driftCopy, "--json"]));
  assert.equal(d.tool, "context-mode-adapter-matrix");
  assert.equal(d.summary.surfaces, 6);
  assert.equal(d.summary.checks, 18);
  assert.ok(d.summary.errors > 0);
  assert.equal(d.matrix.length, 5);
});
test("behaviour: omp is missing from the hook mirror", () => {
  const d = json(run(["--root", driftCopy, "--json"]));
  const f = d.findings.find((x) => x.check === "mirror-missing-platform");
  assert.ok(f, "expected mirror-missing-platform finding");
  assert.equal(f.platform, "omp");
});
test("behaviour: omp tool name silently equals the claude-code name", () => {
  const d = json(run(["--root", driftCopy, "--json"]));
  const f = d.findings.find((x) => x.check === "namer-silent-fallback");
  assert.ok(f, "expected namer-silent-fallback finding");
  assert.match(f.message, /mcp__plugin_context-mode_context-mode__ctx_search/);
});
test("behaviour: env probe proves runtime divergence, not just static drift", () => {
  const d = json(run(["--root", driftCopy, "--json"]));
  const f = d.findings.find((x) => x.check === "detect-single-var-divergence" && x.platform === "omp");
  assert.ok(f, "expected omp single-var divergence");
  assert.match(f.message, /resolves to "claude-code"/);
});
test("behaviour: fallback assertion in tests is flagged", () => {
  const d = json(run(["--root", driftCopy, "--json"]));
  assert.ok(d.findings.some((x) => x.check === "test-enshrines-fallback"));
});
test("--platform filters the matrix", () => {
  const d = json(run(["--root", driftCopy, "--json", "--platform", "omp"]));
  assert.deepEqual(d.matrix.map((r) => r.platform), ["omp"]);
});
test("--no-dynamic skips behavioural checks", () => {
  const d = json(run(["--root", driftCopy, "--json", "--no-dynamic"]));
  assert.equal(d.summary.dynamic_probes, false);
  assert.equal(d.findings.filter((x) => x.check === "namer-silent-fallback").length, 0);
});
test("--fail-on never always exits 0", () => {
  assert.equal(run(["--root", driftCopy, "--fail-on", "never"]).status, 0);
});
test("aligned --json has zero errors and full surface columns", () => {
  const d = json(run(["--root", cleanCopy, "--json"]));
  assert.equal(d.summary.errors, 0);
  assert.deepEqual(Object.keys(d.matrix[0]).sort(), ["canonical", "client_map", "configs", "mirror", "namer", "override", "platform"]);
});

rmSync(tmp, { recursive: true, force: true });
console.log(`\n${n - failed}/${n} passed`);
process.exit(failed ? 1 : 0);
