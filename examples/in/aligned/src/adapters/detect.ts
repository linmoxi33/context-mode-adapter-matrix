// Minimal aligned fixture: every surface agrees. Used to prove the auditor
// can return exit 0, not only shout at drift.
type PlatformId = string;
interface PlatformEnvEntry { name: string; role: string; detect?: boolean }

const _PLATFORM_ENV_VARS_RAW: ReadonlyArray<readonly [PlatformId, readonly PlatformEnvEntry[]]> = [
  ["claude-code", [
    { name: "CLAUDE_CODE_ENTRYPOINT", role: "identification" },
  ]],
  ["alpha", [
    { name: "ALPHA_HOME", role: "workspace" },
  ]],
  ["beta", [
    { name: "BETA_SESSION", role: "identification" },
  ]],
];

export const PLATFORM_ENV_VARS = new Map(_PLATFORM_ENV_VARS_RAW);

const validPlatforms: PlatformId[] = ["claude-code", "alpha", "beta"];
