import { Utils, PropTypes, createVisualComponent, createComponent } from "uu5g05";
import { Test } from "uu5g05-test";

const TestComponent = createVisualComponent({
  uu5Tag: "Test.Component",
  propTypes: {
    prop1: PropTypes.string,
  },
  defaultProps: {
    prop1: "asdf",
  },
  render(props) {
    return <div>test</div>;
  },
});

describe("[uu5g05] Utils.Component", () => {
  it("combineRefs(...refs); should combine refs into single one", async () => {
    let ref1 = Utils.Component.createRef();
    let ref2 = jest.fn();
    let ref3 = undefined; // just to check that it doesn't throw
    let ref4 = null; // just to check that it doesn't throw
    let result;
    let Component = (props) => <div ref={(result = Utils.Component.combineRefs(ref1, ref2, ref3, ref4))} />;
    let { rerender, unmount } = Test.render(<Component />);
    expect(result).toBeTruthy();
    expect(ref1.current instanceof HTMLDivElement).toBe(true);
    expect(ref2).toHaveBeenCalledTimes(1);
    expect(ref2).lastCalledWith(ref1.current);

    // changing ref list should invoke previous fn-like refs with null and call new one
    let prevRef2 = ref2;
    ref2 = jest.fn();
    rerender(<Component foo="bar" />); // re-render
    expect(ref1.current instanceof HTMLDivElement).toBe(true);
    expect(prevRef2).toHaveBeenCalledTimes(2);
    expect(prevRef2).lastCalledWith(null);
    expect(ref2).toHaveBeenCalledTimes(1);
    expect(ref2).lastCalledWith(ref1.current);

    // unmounting should set refs to null
    unmount();
    expect(ref1.current).toBe(null);
    expect(ref2).toHaveBeenCalledTimes(2);
    expect(ref2).lastCalledWith(null);
  });

  it("toUu5String(Component, props)", async () => {
    // basic usage
    expect(Utils.Component.toUu5String(TestComponent)).toEqual("<Test.Component/>");
    expect(Utils.Component.toUu5String(TestComponent, { prop1: "abc", className: "cn" })).toEqual(
      '<Test.Component prop1="abc" className="cn"/>',
    );
    expect(Utils.Component.toUu5String(TestComponent, { prop1: "abc", children: "child" })).toEqual(
      '<Test.Component prop1="abc">child</Test.Component>',
    );

    // default props are always omitted
    expect(
      Utils.Component.toUu5String(TestComponent, { prop1: TestComponent.defaultProps.prop1, className: "cn" }),
    ).toEqual('<Test.Component className="cn"/>');

    // props of type "function" are always omitted
    expect(Utils.Component.toUu5String(TestComponent, { className: "cn", onXyz: () => {} })).toEqual(
      '<Test.Component className="cn"/>',
    );
  });

  it("getUu5StringProps(props, allowedProps = [])", async () => {
    // basic usage
    let standardProps = {
      // standard props for uu5string
      colorSchema: "a",
      elevation: "e",
      bgStyle: "b",
      borderRadius: "br",
      padding: "p",
      cardView: "cv",
    };
    let blacklistedProps = {
      // blacklisted props for uu5string
      getEditablePropValue: "gepv",
      generatedId: "gi",
      parent: "p",
      _registerOnDccModalClose: "rodmc",
      ref_: "r",
    };
    let myProps = {
      // custom prop
      myProp: "m",
    };
    let allProps = { ...standardProps, ...blacklistedProps, ...myProps };

    expect(Utils.Component.getUu5StringProps(allProps)).toEqual(standardProps);
    expect(Utils.Component.getUu5StringProps(allProps, Object.keys(myProps))).toEqual({ ...standardProps, ...myProps });
  });

  it("memo(Comp1); should merge statics automatically", async () => {
    let Comp1 = createComponent({
      uu5Tag: "Test.Component",
      render(props) {
        return null;
      },
    });
    Comp1.foo = "bar";
    let CompMemo = Utils.Component.memo(Comp1);
    expect(CompMemo).toBeDefined();
    expect(CompMemo.foo).toBe("bar");
    expect(CompMemo.logger).toBe(Comp1.logger);
  });
});
