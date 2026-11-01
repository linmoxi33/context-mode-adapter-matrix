// Audit fixture: shape of hooks/core/tool-naming.mjs in mksglu/context-mode.
const TOOL_PREFIXES = {
  "claude-code":    (tool) => `mcp__plugin_context-mode_context-mode__${tool}`,
  "cursor":         (tool) => tool,
  "vscode-copilot": (tool) => `context-mode_${tool}`,
  "pi":             (tool) => tool,
};

export function getToolName(platform, bareTool) {
  const fn = TOOL_PREFIXES[platform] || TOOL_PREFIXES["claude-code"];
  return fn(bareTool);
}

export const KNOWN_PLATFORMS = Object.keys(TOOL_PREFIXES);
