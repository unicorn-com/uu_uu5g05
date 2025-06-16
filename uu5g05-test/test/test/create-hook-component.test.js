const React = require("react");
const { Test } = require("uu5g05-test");

describe("[uu5g05-test] Test.createHookComponent", () => {
  it("initHookRenderer", async () => {
    let useSomething = function (initialValue = 10, changeableValue = 0) {
      let [initialParam1] = React.useState(initialValue);
      return [initialParam1, changeableValue];
    };

    // basic result
    let result;
    result = Test.createHookComponent((props) => useSomething(...props), { initialProps: [] });
    expect(result).toEqual({
      result: expect.any(Object),
      rerender: expect.any(Function),
      unmount: expect.any(Function),
      HookComponent: expect.any(Function),
    });
    let childFn = jest.fn((hookResult) => "Hook result: " + JSON.stringify(hookResult));
    Test.render(React.createElement(result.HookComponent, null, childFn));
    expect(result.result).toEqual({ current: [10, 0] }); // default values
    expect(childFn).toHaveBeenLastCalledWith(result.result.current);

    // rerender
    result.rerender([20, 7]);
    expect(result.result).toEqual({ current: [10, 7] });
    expect(childFn).toHaveBeenLastCalledWith(result.result.current);
    expect(Test.screen.getByText("Hook result: [10,7]")).toBeInTheDocument();

    // unmount
    result.unmount();
    expect(Test.screen.queryByText("Hook result: [10,7]")).not.toBeInTheDocument();

    // no children for HookComponent
    result = Test.createHookComponent(() => useSomething(1, 2));
    Test.render(React.createElement(result.HookComponent));
    expect(result.result).toEqual({ current: [1, 2] });
  });
});
