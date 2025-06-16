// import { useParentSize } from "uu5g05"; // not exported
import "uu5g05";
import { Test } from "uu5g05-test";
import useParentSize from "../src/_internal/use-parent-size.js";

const HORIZONTAL_BORDER = 4;
const VERTICAL_BORDER = 8;

function renderHookInElement(width = 100, height = 200, ...initialHookParams) {
  let defineSizes = (el) => {
    if (el) {
      Object.defineProperties(el, {
        clientWidth: { get: () => width - HORIZONTAL_BORDER, configurable: true },
        clientHeight: { get: () => height - VERTICAL_BORDER, configurable: true },
        getBoundingClientRect: {
          get: () => () => ({ width, height, left: 0, top: 0, right: width, bottom: height }),
          configurable: true,
        },
      });
    }
  };
  let allResults = [];
  let { HookComponent, ...renderResult } = Test.createHookComponent((props) => useParentSize(...props), {
    initialProps: initialHookParams,
  });
  let { rerender } = Test.render(<div ref={defineSizes} />);
  rerender(
    <div ref={defineSizes}>
      <HookComponent>
        {(hookResult) => {
          allResults.push(hookResult);
          return <hookResult.Resizer />;
        }}
      </HookComponent>
    </div>,
  );
  return { ...renderResult, allResults: () => [...allResults], renderCount: () => allResults.length };
}

describe("[uu5g05] useParentSize", () => {
  it("should return expected result API", () => {
    let { result } = renderHookInElement();
    expect(result.current).toEqual({
      Resizer: expect.any(Function),
      width: expect.any(Number),
      height: expect.any(Number),
      contentWidth: expect.any(Number),
      contentHeight: expect.any(Number),
    });
  });

  it("should report initial size followed by real size", async () => {
    let result, renderCount, allResults;
    ({ result, renderCount, allResults } = renderHookInElement(300, 200));
    expect(renderCount()).toBe(2);
    expect(allResults()[0]).toMatchObject({
      width: undefined,
      height: undefined,
      contentWidth: undefined,
      contentHeight: undefined,
    });
    expect(result.current).toMatchObject({
      width: 300,
      height: 200,
      contentWidth: 300 - HORIZONTAL_BORDER,
      contentHeight: 200 - VERTICAL_BORDER,
    });

    ({ result, renderCount, allResults } = renderHookInElement(300, 200, {
      width: 30,
      height: 20,
      contentWidth: 7,
      contentHeight: 13,
    }));
    expect(renderCount()).toBe(2);
    expect(allResults()[0]).toMatchObject({ width: 30, height: 20, contentWidth: 7, contentHeight: 13 });
    expect(result.current).toMatchObject({
      width: 300,
      height: 200,
      contentWidth: 300 - HORIZONTAL_BORDER,
      contentHeight: 200 - VERTICAL_BORDER,
    });
  });

  it("should report size based on element size", async () => {
    let result;
    // NOTE ResizeObserver doesn't work in Jest so we'll re-mount everytime
    // with different width on <div>.
    ({ result } = renderHookInElement(300, 200));
    expect(result.current).toMatchObject({
      width: 300,
      height: 200,
      contentWidth: 300 - HORIZONTAL_BORDER,
      contentHeight: 200 - VERTICAL_BORDER,
    });

    ({ result } = renderHookInElement(200, null));
    expect(result.current).toMatchObject({ width: 200, contentWidth: 200 - HORIZONTAL_BORDER });

    ({ result } = renderHookInElement(null, 100));
    expect(result.current).toMatchObject({ height: 100, contentHeight: 100 - VERTICAL_BORDER });
  });
});
