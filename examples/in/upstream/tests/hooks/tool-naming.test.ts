// Audit fixture: excerpt of tests/hooks/tool-naming.test.ts.
describe("getToolName", () => {
  it("falls back to claude-code for unknown platforms", () => {
    expect(getToolName("unknown-platform", "ctx_search")).toBe(
      "mcp__plugin_context-mode_context-mode__ctx_search",
    );
  });
});
