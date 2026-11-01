const PLATFORM_ENV_VARS_MIRROR = [
  ["claude-code", ["CLAUDE_CODE_ENTRYPOINT"]],
  ["alpha",       ["ALPHA_HOME"]],
  ["beta",        ["BETA_SESSION"]],
];

export function detectPlatformFromEnv(env = process.env) {
  for (const [platform, vars] of PLATFORM_ENV_VARS_MIRROR) {
    if (vars.some((v) => env[v])) return platform;
  }
  return "claude-code";
}

export { PLATFORM_ENV_VARS_MIRROR };
