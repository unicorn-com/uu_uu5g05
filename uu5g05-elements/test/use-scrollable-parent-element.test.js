import { useScrollableParentElement } from "uu5g05-elements";
import { Test } from "uu5g05-test";
import ScrollableParentElementProvider from "../src/_internal/scrollable-parent-element-provider.js";

describe(`Uu5Elements.useScrollableParentElement`, () => {
  it("should return value based on context", () => {
    let { result, HookComponent } = Test.createHookComponent(() => useScrollableParentElement());
    let divEl = document.createElement("div");
    let divEl2 = document.createElement("div");
    let { rerender, unmount } = Test.render(
      <ScrollableParentElementProvider element={divEl}>
        <HookComponent />
      </ScrollableParentElementProvider>,
    );
    expect(result.current).toBe(divEl);

    rerender(
      <ScrollableParentElementProvider element={divEl2}>
        <HookComponent />
      </ScrollableParentElementProvider>,
    );
    expect(result.current).toBe(divEl2);
    unmount();

    ({ result, unmount } = Test.renderHook(() => useScrollableParentElement()));
    expect(result.current).toBe(undefined);
    unmount();
  });
});
