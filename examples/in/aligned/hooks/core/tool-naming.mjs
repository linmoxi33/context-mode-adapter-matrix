const TOOL_PREFIXES = {
  "claude-code": (tool) => `mcp__plugin_context-mode_context-mode__${tool}`,
  "alpha":       (tool) => `alpha__${tool}`,
  "beta":        (tool) => tool,
};

export function getToolName(platform, bareTool) {
  const fn = TOOL_PREFIXES[platform] || TOOL_PREFIXES["claude-code"];
  return fn(bareTool);
}

export const KNOWN_PLATFORMS = Object.keys(TOOL_PREFIXES);
