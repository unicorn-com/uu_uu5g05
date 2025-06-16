import { useContentSizeValue, ContentSizeProvider, Utils } from "uu5g05";
import { Test } from "uu5g05-test";

// value can be anything
const SIZE_VALUE_MAP = {
  xs: "verysmall",
  s: "small",
  m: "medium",
  l: "large",
  xl: "verylarge",
};

const OBJECT_TYPE_VALUE = { testKey: "testVal" };

const ARRAY_TYPE_VALUE = [1, 2, 3];

const NUMBER_TYPE_VALUE = 5;

let containerWithSize;

afterAll(() => {
  if (containerWithSize) containerWithSize.remove();
});

function renderHookInProvider(width, ...hookParams) {
  if (!containerWithSize) {
    containerWithSize = document.createElement("div");
    document.body.appendChild(containerWithSize);
  }
  Object.defineProperties(containerWithSize, {
    clientWidth: { get: () => width, configurable: true },
    getBoundingClientRect: {
      get: () => () => ({ width, height: 1, left: 0, top: 0, right: width, bottom: 1 }),
      configurable: true,
    },
  });

  let result = Test.renderHook(() => useContentSizeValue(...hookParams), {
    wrapper: (props) => <ContentSizeProvider>{props.children}</ContentSizeProvider>,
    container: containerWithSize,
  });
  return result;
}

describe("[uu5g05] useContentSizeValue with ContentSizeProvider", () => {
  it("should return expected result API", () => {
    let result;

    ({ result } = renderHookInProvider(200, SIZE_VALUE_MAP));
    expect(result.current).toEqual(expect.any(String));

    ({ result } = renderHookInProvider(200, SIZE_VALUE_MAP.xs));
    expect(result.current).toEqual(expect.any(String));
  });

  it("should return correct value based on content size", () => {
    let result;

    // NOTE ResizeObserver doesn't work in Jest so we'll re-mount everytime
    // with different width on wrapping <div>.
    ({ result } = renderHookInProvider(Utils.ScreenSize.XS, SIZE_VALUE_MAP));
    expect(result.current).toBe(SIZE_VALUE_MAP.xs);

    ({ result } = renderHookInProvider(Utils.ScreenSize.S, SIZE_VALUE_MAP));
    expect(result.current).toBe(SIZE_VALUE_MAP.s);

    ({ result } = renderHookInProvider(Utils.ScreenSize.M, SIZE_VALUE_MAP));
    expect(result.current).toBe(SIZE_VALUE_MAP.m);

    ({ result } = renderHookInProvider(Utils.ScreenSize.L, SIZE_VALUE_MAP));
    expect(result.current).toBe(SIZE_VALUE_MAP.l);

    ({ result } = renderHookInProvider(Utils.ScreenSize.XL, SIZE_VALUE_MAP));
    expect(result.current).toBe(SIZE_VALUE_MAP.xl);
  });

  it("should return the value if it is provided directly without a map", () => {
    // pass "m" value directly, it should be returned for all content sizes
    const { result } = renderHookInProvider(Utils.ScreenSize.XS, SIZE_VALUE_MAP.m);
    expect(result.current).toBe(SIZE_VALUE_MAP.m);
  });

  it("should work with any value type", () => {
    let result;

    ({ result } = renderHookInProvider(Utils.ScreenSize.XS, { xs: OBJECT_TYPE_VALUE }));
    expect(result.current).toBe(OBJECT_TYPE_VALUE);

    ({ result } = renderHookInProvider(Utils.ScreenSize.XS, { xs: ARRAY_TYPE_VALUE }));
    expect(result.current).toBe(ARRAY_TYPE_VALUE);

    ({ result } = renderHookInProvider(Utils.ScreenSize.XS, { xs: NUMBER_TYPE_VALUE }));
    expect(result.current).toBe(NUMBER_TYPE_VALUE);
  });

  it("should fallback to closest smaller existing", () => {
    const { result } = renderHookInProvider(Utils.ScreenSize.M, { s: SIZE_VALUE_MAP.s, l: SIZE_VALUE_MAP.l });
    expect(result.current).toBe(SIZE_VALUE_MAP.s);
  });
});
