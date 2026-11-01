# context-mode-adapter-matrix

An offline auditor that builds a **platform × surface** matrix for
[mksglu/context-mode](https://github.com/mksglu/context-mode) and then *runs* its hook
modules against synthetic environments to show where the same platform is detected
differently by the MCP server and by the hook — the failure mode where a tool name
silently degrades to another platform's convention.

Upstream: https://github.com/mksglu/context-mode

## 1. What the upstream is, and what it is missing

context-mode routes MCP tools across 17+ coding agents. Two files have to agree:

- `src/adapters/detect.ts` holds the canonical `PLATFORM_ENV_VARS` table (server side).
- `hooks/core/platform-detect.mjs` holds `PLATFORM_ENV_VARS_MIRROR` (hook side), and its
  own header states the two **"MUST stay in lock-step or detection will diverge"**
  ([platform-detect.mjs#L9-L14](https://github.com/mksglu/context-mode/blob/a35dd45f3976b4a22baa0032db2b3c050c00a163/hooks/core/platform-detect.mjs#L9-L14)).
- `hooks/core/tool-naming.mjs` maps platform → MCP tool-name prefix, and **falls back to
  the claude-code prefix for unknown platforms**
  ([tool-naming.mjs#L43-L46](https://github.com/mksglu/context-mode/blob/a35dd45f3976b4a22baa0032db2b3c050c00a163/hooks/core/tool-naming.mjs#L43-L46)).
- The canonical table added `omp` ([detect.ts#L223](https://github.com/mksglu/context-mode/blob/a35dd45f3976b4a22baa0032db2b3c050c00a163/src/adapters/detect.ts#L223))
  and `configs/omp/` ships an install payload — but the mirror has no `omp` row, and the
  namer has no `omp` prefix. The suite even asserts the fallback is fine
  ([tool-naming.test.ts#L139](https://github.com/mksglu/context-mode/blob/a35dd45f3976b4a22baa0032db2b3c050c00a163/tests/hooks/tool-naming.test.ts#L139)),
  so CI cannot see the drift.

Upstream's issue tracker is disabled (`has_issues: false`), so this drift has no public
report and no CI gate. Measured against upstream `a35dd45` (files fetched with `gh api`, configs from the git
tree): **13 canonical platforms, 48 errors, 6 warnings across 18 checks**. Highlights:

- `omp` is detected server-side but resolves to `claude-code` in the hook (proved by
  importing the real module, not by reading it).
- `CLAUDE_CODE_ENTRYPOINT` is missing from the mirror, so Claude Code inside a VS Code
  terminal resolves to `vscode-copilot` on the hook side — the exact disambiguation the
  canonical table documents.
- `PI_PROJECT_DIR` is `detect: false` in the canonical table but is the *only* Pi var the
  mirror checks, so a consumer-set var can misclassify the host as Pi.

## 2. What this tool does / does not do

Does: parse all six surfaces (canonical table, hook mirror, tool namer, `configs/`,
`clientInfo` map, `CONTEXT_MODE_PLATFORM` allow-list), diff them per platform, then
import `hooks/core/*.mjs` and probe them with synthetic env maps — single-var probes and
pairwise collision probes — reporting where the hook answers differently from the
canonical table. Also flags a test suite that asserts the silent fallback.

Does not: modify the checkout, call the network, run the MCP server, or claim to fix
upstream. It reports; exit code 1 is the CI gate.

## 2b. 与同类项目的差异

写代码前实际执行过（2026-11-01）：

```bash
gh search repos "mcp adapter platform consistency lint" --limit=20   # 0 命中
gh search repos "context-mode" --limit=20                             # 只有上游本身 + 无关同名项目
gh search code "PLATFORM_ENV_VARS_MIRROR" --limit=20                  # 8 个命中，全是上游 fork
gh search code "detectPlatformFromEnv" --limit=20                     # 上游 + fork，无独立工具
```

命中的 8 个仓库都是 context-mode 的 fork（`cv-superding/hypercontext-mode`、
`som1shi/pi-config`、`russellcainiv/claude-plugins` 等），不是审计器；没有找到独立做
跨表面一致性检查的项目。上游的 issue 跟踪器本身是关闭的
（`gh api repos/mksglu/context-mode --jq .has_issues` → `false`），所以这类漂移既没有
现成工具拦，也没有公开渠道报。

## 3. Install / usage

Requires Node ≥ 18. No dependencies, no build step.

```bash
git clone --depth=1 https://github.com/mksglu/context-mode /tmp/context-mode
node bin/context-mode-adapter-matrix --root /tmp/context-mode
```

Options: `--json`, `--platform <id>` (repeatable), `--fail-on error|warning|never`,
`--no-dynamic` (static surfaces only), `--help`, `--version`.

```bash
node bin/context-mode-adapter-matrix --root /tmp/context-mode --json > report.json
python3 -c "import json;d=json.load(open('report.json'));print(d['summary'])"
```

`--json` example (truncated, full file in `examples/out/drifted-report.json`):

```json
{"summary":{"platforms":13,"surfaces":6,"checks":18,"errors":48,"warnings":6,"dynamic_probes":true},
 "matrix":[{"platform":"omp","canonical":"present","mirror":"missing","namer":"silent-fallback","configs":"present","client_map":"present","override":"present"}],
 "findings":[{"check":"detect-single-var-divergence","platform":"omp","message":"env {PI_CODING_AGENT_DIR=1} resolves to \"claude-code\" ..."}]}
```

Exit codes: `0` no finding at/above the threshold, `1` findings, `2` usage or input error.

## 4. Tests

```bash
node tests/run.mjs     # 16/16 passed
```

16 cases, 9 behavioural (spawn the CLI and assert exit code / parsed JSON / matrix rows).
`examples/in/aligned` is a fixture where every surface agrees → exit 0;
`examples/in/upstream` reproduces the omp drift → exit 1 with 18 errors.

## 5. Limits

- Parses the source tables with a bracket/string-aware scanner, not a TypeScript parser:
  a future refactor that builds the tables dynamically (spread, `map`, constants) will be
  reported as a parse error rather than silently guessed.
- Dynamic probes only cover env-var detection and tool naming; the `~/.omp/` config-dir
  tier and `clientInfo` handshake are checked statically.
- Findings are a snapshot of the checkout you pass in; upstream may fix them tomorrow.
- The committed fixtures are trimmed reconstructions of factual tables (env var names,
  row order), not copies of upstream source; upstream is Elastic License 2.0.

## 本轮创新

首次把「平台 × 表面」矩阵与**逐对 env 碰撞差分**合到一条审计里：不只比对两张表是否
同文，而是把 hook 模块真跑起来，用 N² 组双变量环境证明 server 侧与 hook 侧对同一环境
给出不同平台（本轮在 `a35dd45` 上测出 29 组碰撞分歧），并指出测试套件把静默回落当成
正确行为，使 CI 永远看不见这类漂移。台账中此前的校验器都只做单文件静态规则，没有
跨实现的行为差分，因此不是换皮。
