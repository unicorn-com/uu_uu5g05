import { useEvent, useRef } from "uu5g05";
import { Test } from "uu5g05-test";

function testEvent(obj, listenerFn, unmount, eventName) {
  listenerFn.mockClear();
  let event;
  Test.act(() => {
    obj.dispatchEvent((event = new Event(eventName)));
  });
  expect(listenerFn).toHaveBeenCalledTimes(1);
  expect(listenerFn).lastCalledWith(event);

  listenerFn.mockClear();
  unmount();
  Test.act(() => {
    obj.dispatchEvent((event = new Event(eventName)));
  });
  expect(listenerFn).toHaveBeenCalledTimes(0);
}

describe("[uu5g04-hooks] useEvent", () => {
  it("should return expected result API", () => {
    let { result } = Test.renderHook(() => useEvent("scroll", jest.fn(), window));
    expect(result.current).toBe(undefined);

    ({ result } = Test.renderHook(() => useEvent("customEvent", jest.fn())));
    expect(result.current).toEqual(expect.any(Function));
  });

  it("should call the listener function", async () => {
    let listenerFn = jest.fn();
    let { unmount } = Test.renderHook(() => useEvent("scroll", listenerFn, window));
    testEvent(window, listenerFn, unmount, "scroll");
  });

  it("should support elements (Element)", async () => {
    let listenerFn = jest.fn();
    let { unmount } = Test.renderHook(() => useEvent("scroll", listenerFn, document.body));
    testEvent(document.body, listenerFn, unmount, "scroll");
  });

  it("should support elements (ref)", async () => {
    let listenerFn = jest.fn();
    let ref;
    let TestComponent = () => {
      ref = useRef();
      useEvent("scroll", listenerFn, ref);
      return <div ref={ref} />;
    };
    let { unmount } = Test.render(<TestComponent />);
    testEvent(ref.current, listenerFn, unmount, "scroll");
  });

  it("should call listeners in proper order", async () => {
    let fn = jest.fn();
    let { HookComponent: HC1 } = Test.createHookComponent(() =>
      useEvent("scroll", () => fn("hc1"), window, { capture: false }),
    );
    let { HookComponent: HC2 } = Test.createHookComponent(() =>
      useEvent("scroll", () => fn("hc2"), window, { capture: true }),
    );
    let { HookComponent: HC3 } = Test.createHookComponent(() =>
      useEvent("scroll", () => fn("hc3"), window, { capture: false }),
    );
    let { HookComponent: HC4 } = Test.createHookComponent(() =>
      useEvent("scroll", () => fn("hc4"), window, { capture: true }),
    );
    Test.render(
      <div>
        <HC1 />
        <HC2 />
        <HC3 />
        <HC4 />
      </div>,
    );
    Test.act(() => {
      window.dispatchEvent(new Event("scroll"));
    });
    expect(fn).toHaveBeenCalledTimes(4);
    expect(fn).nthCalledWith(1, "hc2"); // capturing listeners first
    expect(fn).nthCalledWith(2, "hc4");
    expect(fn).nthCalledWith(3, "hc1"); // bubbling listeners last
    expect(fn).nthCalledWith(4, "hc3");
  });

  it("should have separated listener lists per event", async () => {
    let listenerFn1 = jest.fn();
    let listenerFn2 = jest.fn();
    let { HookComponent: HC1 } = Test.createHookComponent(() => useEvent("scroll1", listenerFn1, window));
    let { HookComponent: HC2 } = Test.createHookComponent(() => useEvent("scroll2", listenerFn2, window));
    Test.render(
      <div>
        <HC1 />
        <HC2 />
      </div>,
    );
    Test.act(() => {
      window.dispatchEvent(new Event("scroll1"));
    });
    expect(listenerFn1).toHaveBeenCalledTimes(1);
    expect(listenerFn2).toHaveBeenCalledTimes(0);

    listenerFn1.mockClear();
    Test.act(() => {
      window.dispatchEvent(new Event("scroll2"));
    });
    expect(listenerFn1).toHaveBeenCalledTimes(0);
    expect(listenerFn2).toHaveBeenCalledTimes(1);
  });

  it("should react to parameters change", async () => {
    let listenerFn = jest.fn();
    let { rerender } = Test.renderHook((props) => useEvent(...props), { initialProps: ["scroll", listenerFn, window] });

    // change element
    rerender(["scroll", listenerFn, document.body]);
    Test.act(() => {
      window.dispatchEvent(new Event("scroll"));
    });
    expect(listenerFn).toHaveBeenCalledTimes(0);
    Test.act(() => {
      document.body.dispatchEvent(new Event("scroll"));
    });
    expect(listenerFn).toHaveBeenCalledTimes(1);
    listenerFn.mockClear();

    // change listener
    let listenerFn2 = jest.fn();
    rerender(["scroll", listenerFn2, document.body]);
    Test.act(() => {
      document.body.dispatchEvent(new Event("scroll"));
    });
    expect(listenerFn2).toHaveBeenCalledTimes(1);
    expect(listenerFn).toHaveBeenCalledTimes(0);
    listenerFn2.mockClear();

    // change event
    rerender(["scroll2", listenerFn2, document.body]);
    Test.act(() => {
      document.body.dispatchEvent(new Event("scroll"));
    });
    expect(listenerFn2).toHaveBeenCalledTimes(0);
    expect(listenerFn).toHaveBeenCalledTimes(0);
    Test.act(() => {
      document.body.dispatchEvent(new Event("scroll2"));
    });
    expect(listenerFn2).toHaveBeenCalledTimes(1);
    expect(listenerFn).toHaveBeenCalledTimes(0);
  });
});
