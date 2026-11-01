// Audit fixture: shape of src/adapters/detect.ts in mksglu/context-mode
// (upstream a35dd45f3976b4a22baa0032db2b3c050c00a163, Elastic License 2.0).
// Env var names and row order are factual; code is a trimmed reconstruction.
type PlatformId = string;
interface PlatformEnvEntry { name: string; role: string; detect?: boolean }

const _PLATFORM_ENV_VARS_RAW: ReadonlyArray<readonly [PlatformId, readonly PlatformEnvEntry[]]> = [
  ["claude-code", [
    { name: "CLAUDE_CODE_ENTRYPOINT", role: "identification" },
    { name: "CLAUDE_PROJECT_DIR", role: "workspace" },
  ]],
  ["cursor", [
    { name: "CURSOR_CWD", role: "workspace" },
    { name: "CURSOR_TRACE_ID", role: "identification" },
  ]],
  ["vscode-copilot", [
    { name: "VSCODE_CWD", role: "workspace" },
    { name: "VSCODE_PID", role: "identification" },
  ]],
  ["omp", [
    { name: "PI_CODING_AGENT_DIR", role: "workspace" },
  ]],
  ["pi", [
    { name: "PI_PROJECT_DIR", role: "workspace", detect: false },
    { name: "PI_CONFIG_DIR", role: "identification" },
  ]],
];

export const PLATFORM_ENV_VARS = new Map(_PLATFORM_ENV_VARS_RAW);

const validPlatforms: PlatformId[] = [
  "claude-code", "cursor", "vscode-copilot", "pi",
];
