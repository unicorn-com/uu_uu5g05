import { useElementSize } from "uu5g05";
import { Test } from "uu5g05-test";

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
  // NOTE React testing library doesn't directly support returning "ref" from hook and applying it immediately
  // within the same render. We're working around that by storing the hook result into outer scope variable (lastHookResult)
  // and using wrapper which renders props.children (i.e. hook) and after that our temporary component (ApplyLastHookRef)
  // which will pass the ref from outer scope variable onto <div /> within the same render (React commit).
  let allResults = [];
  let lastHookResult;
  let ApplyLastHookRef = () => <div ref={(ref) => (defineSizes(ref), lastHookResult?.ref(ref))} />;
  let renderResult = Test.renderHook(
    () => {
      let result = useElementSize(...initialHookParams);
      lastHookResult = result;
      allResults.push(result);
      return result;
    },
    {
      wrapper: (props) => (
        <>
          {props.children}
          <ApplyLastHookRef />
        </>
      ),
    },
  );
  return { ...renderResult, allResults: () => [...allResults], renderCount: () => allResults.length };
}

describe("[uu5g05] useElementSize", () => {
  it("should return expected result API", () => {
    let { result } = renderHookInElement();
    expect(result.current).toEqual({
      ref: expect.any(Function),
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
