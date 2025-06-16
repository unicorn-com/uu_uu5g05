import { useContentSize, ContentSizeProvider, Utils } from "uu5g05";
import { Test } from "uu5g05-test";

let containerWithSize;
afterAll(() => {
  if (containerWithSize) containerWithSize.remove();
});

function renderHook(width, onChange = undefined, contentSize = undefined, skipProvider = false) {
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

  let result = Test.renderHook(() => useContentSize(), {
    wrapper: skipProvider
      ? undefined
      : (props) => (
          <ContentSizeProvider onChange={onChange} contentSize={contentSize}>
            {props.children}
          </ContentSizeProvider>
        ),
    container: containerWithSize,
  });
  return result;
}

async function setWindowWidth(newWidth) {
  Test.act(() => {
    window.innerWidth = newWidth;
    let event = new UIEvent("resize", {});
    window.dispatchEvent(event);
  });
}

describe("[uu5g05] useContentSize with ContentSizeProvider", () => {
  it("should return expected result API", () => {
    let { result } = renderHook(Utils.ScreenSize.S);
    expect(result.current).toEqual(expect.any(String));
  });

  it("should report size based on provider value", async () => {
    let result;
    await setWindowWidth(1024);

    // NOTE ResizeObserver doesn't work in Jest so we'll re-mount everytime
    // with different width on wrapping <div>.
    ({ result } = renderHook(Utils.ScreenSize.XS));
    expect(result.current).toBe("xs");

    ({ result } = renderHook(Utils.ScreenSize.S));
    expect(result.current).toBe("s");

    ({ result } = renderHook(Utils.ScreenSize.M));
    expect(result.current).toBe("m");

    ({ result } = renderHook(Utils.ScreenSize.L));
    expect(result.current).toBe("l");

    ({ result } = renderHook(Utils.ScreenSize.L + 1));
    expect(result.current).toBe("xl");
  });

  it("ContentSizeProvider prop onChange; should receive new content size", async () => {
    let onChange = jest.fn();
    let { result } = renderHook(Utils.ScreenSize.XS, onChange, "xs");

    expect(result.current).toBe("xs");
    await setWindowWidth(Utils.ScreenSize.M);

    // onChange cannot be tested as ResizeObserver doesn't work in Jest
    //expect(onChange).toHaveBeenCalledTimes(1);
    //expect(onChange).lastCalledWith({ contentSize: "m" });

    expect(result.current).toBe("xs"); // not updated because we didn't propagate value from onChange to prop
  });

  it("should fallback to screen size if provider does not exist", async () => {
    await setWindowWidth(Utils.ScreenSize.M);

    const { result } = renderHook(Utils.ScreenSize.XS, undefined, undefined, true);
    expect(result.current).toBe("m");
  });
});
