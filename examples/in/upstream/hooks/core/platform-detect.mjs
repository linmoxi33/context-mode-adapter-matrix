// Audit fixture: shape of hooks/core/platform-detect.mjs in mksglu/context-mode.
// The header of the real file says this table "mirrors PLATFORM_ENV_VARS in
// src/adapters/detect.ts" and the two "MUST stay in lock-step".
const PLATFORM_ENV_VARS_MIRROR = [
  ["claude-code",        ["CLAUDE_PROJECT_DIR"]],
  ["cursor",             ["CURSOR_TRACE_ID", "CURSOR_CLI"]],
  ["vscode-copilot",     ["VSCODE_PID"]],
  ["pi",                 ["PI_PROJECT_DIR"]],
];

export function detectPlatformFromEnv(env = process.env) {
  for (const [platform, vars] of PLATFORM_ENV_VARS_MIRROR) {
    if (vars.some((v) => env[v])) return platform;
  }
  return "claude-code";
}

export { PLATFORM_ENV_VARS_MIRROR };
