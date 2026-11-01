describe("getToolName", () => {
  it("returns the beta prefix", () => {
    expect(getToolName("beta", "ctx_search")).toBe("ctx_search");
  });
});
