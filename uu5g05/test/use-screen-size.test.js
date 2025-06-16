import { useScreenSize, ScreenSizeProvider, Utils } from "uu5g05";
import { Test } from "uu5g05-test";

function renderHookInProvider(width, onChange = undefined) {
  let defineSizes = (el) => {
    if (el) {
      Object.defineProperties(el, {
        clientWidth: { get: () => width, configurable: true },
        getBoundingClientRect: {
          get: () => () => ({ width, height: 1, left: 0, top: 0, right: width, bottom: 1 }),
          configurable: true,
        },
      });
    }
  };
  let { HookComponent, ...result } = Test.createHookComponent(() => useScreenSize());
  let { rerender } = Test.render(<div ref={defineSizes} />);
  rerender(
    <div ref={defineSizes}>
      <ScreenSizeProvider onChange={onChange}>
        <HookComponent />
      </ScreenSizeProvider>
    </div>,
  );
  return result;
}

async function setWindowWidth(newWidth) {
  Test.act(() => {
    window.innerWidth = newWidth;
    let event = new UIEvent("resize", {});
    window.dispatchEvent(event);
  });
}

describe("[uu5g05] useScreenSize with window", () => {
  it("should return expected result API", () => {
    let { result } = Test.renderHook(() => useScreenSize());
    expect(result.current).toEqual([expect.any(String), undefined]);
  });

  it("should report size based on window size", async () => {
    await setWindowWidth(Utils.ScreenSize.XS);
    let { result } = Test.renderHook(() => useScreenSize());

    expect(result.current?.[0]).toBe("xs");
    await setWindowWidth(Utils.ScreenSize.S);
    expect(result.current?.[0]).toBe("s");
    await setWindowWidth(Utils.ScreenSize.M);
    expect(result.current?.[0]).toBe("m");
    await setWindowWidth(Utils.ScreenSize.L);
    expect(result.current?.[0]).toBe("l");
    await setWindowWidth(Utils.ScreenSize.L + 1);
    expect(result.current?.[0]).toBe("xl");
  });
});

describe("[uu5g05] useScreenSize with ScreenSizeProvider", () => {
  it("should return expected result API", () => {
    let { result } = renderHookInProvider(200);
    expect(result.current).toEqual([expect.any(String), expect.any(Function)]);
  });

  it("should report size based on provider value", async () => {
    let result;
    await setWindowWidth(1024);

    // NOTE ResizeObserver doesn't work in Jest so we'll re-mount everytime
    // with different width on wrapping <div>.
    ({ result } = renderHookInProvider(Utils.ScreenSize.XS));
    expect(result.current?.[0]).toBe("xs");

    ({ result } = renderHookInProvider(Utils.ScreenSize.S));
    expect(result.current?.[0]).toBe("s");

    ({ result } = renderHookInProvider(Utils.ScreenSize.M));
    expect(result.current?.[0]).toBe("m");

    ({ result } = renderHookInProvider(Utils.ScreenSize.L));
    expect(result.current?.[0]).toBe("l");

    ({ result } = renderHookInProvider(Utils.ScreenSize.L + 1));
    expect(result.current?.[0]).toBe("xl");
  });

  it("result setScreenSize(newScreenSize); should change screenSize", async () => {
    let { result } = renderHookInProvider(Utils.ScreenSize.XS);

    expect(result.current?.[0]).toBe("xs");
    Test.act(() => {
      result.current[1]("m");
    });
    expect(result.current?.[0]).toBe("m");
  });

  it("ScreenSizeProvider prop onChange; should receive new screen size", async () => {
    let onChange = jest.fn();
    let { result } = renderHookInProvider(Utils.ScreenSize.XS, onChange);

    expect(result.current?.[0]).toBe("xs");
    Test.act(() => {
      result.current[1]("m");
    });
    expect(onChange).toHaveBeenCalledTimes(1);
    expect(onChange).lastCalledWith({ screenSize: "m" });
    expect(result.current?.[0]).toBe("xs"); // not updated because we didn't propagate value from onChange to prop
  });
});
