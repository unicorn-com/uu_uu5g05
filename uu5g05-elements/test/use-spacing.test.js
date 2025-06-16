import { useSpacing, SpacingProvider } from "uu5g05-elements";
import { Test } from "uu5g05-test";

function renderInProvider(providerProps, ...initialHookParams) {
  return Test.renderHook(() => useSpacing(...initialHookParams), {
    wrapper: ({ children }) => <SpacingProvider {...providerProps}>{children}</SpacingProvider>,
  });
}

describe("Uu5Elements.useSpacing", () => {
  it("should return expected result API", () => {
    let { result } = renderInProvider();
    expect(result.current).toEqual(expect.any(Object));
  });

  it("should return default normal spacing", async () => {
    let { result } = Test.renderHook(() => useSpacing());

    expect(result.current.type).toBe("normal");
    expect(result.current.a).toBe(2);
    expect(result.current.b).toBe(8);
    expect(result.current.c).toBe(16);
    expect(result.current.d).toBe(24);
  });

  it("SpacingProvider prop type, should return expected result for type = tight ", () => {
    let { result } = renderInProvider({ type: "tight" });

    expect(result.current.type).toBe("tight");
    expect(result.current.a).toBe(0);
    expect(result.current.b).toBe(4);
    expect(result.current.c).toBe(8);
    expect(result.current.d).toBe(16);
  });

  it("SpacingProvider prop type, should return expected result for type = loose ", () => {
    let { result } = renderInProvider({ type: "loose" });

    expect(result.current.type).toBe("loose");
    expect(result.current.a).toBe(4);
    expect(result.current.b).toBe(16);
    expect(result.current.c).toBe(24);
    expect(result.current.d).toBe(32);
  });
});
