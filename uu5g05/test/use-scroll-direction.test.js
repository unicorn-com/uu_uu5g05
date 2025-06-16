import { useScrollDirection, Utils } from "uu5g05";
import { Test } from "uu5g05-test";

describe("[uu5g05] useScrollDirection", () => {
  it("should detect scroll direction", async () => {
    let ref = Utils.Component.createRef();
    let { result } = Test.renderHook(() => useScrollDirection(ref), {
      wrapper: ({ children }) => (
        <>
          <div ref={ref} style={{ overflow: "auto", height: 50 }}>
            <div style={{ height: 1000 }}>Content</div>
          </div>
          {children}
        </>
      ),
    });
    expect(result.current).toBe(undefined);
    Test.act(() => {
      ref.current.scrollTop = 20;
      ref.current.dispatchEvent(new Event("scroll", { bubbles: true })); // explicit because JSDOM doesn't fire it
    });
    expect(result.current).toBe("down");
    Test.act(() => {
      ref.current.scrollTop = 10;
      ref.current.dispatchEvent(new Event("scroll", { bubbles: true })); // explicit because JSDOM doesn't fire it
    });
    expect(result.current).toBe("up");
  });
});
