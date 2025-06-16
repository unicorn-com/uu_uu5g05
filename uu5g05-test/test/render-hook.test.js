const React = require("react");
// const { mount: enzymeMount } = require("enzyme");
// const { renderHook, initHookRenderer } = require("uu5g05-test");

// TODO Next major - remove. Skipping because we would have to have React 16 in dependencies for these to actually work.
describe.skip("[uu5g05-test] enzyme-based API", () => {
  it("renderHook", async () => {
    let useSomething = function (initialValue = 10, changeableValue = 0) {
      let [initialParam1] = React.useState(initialValue);
      return [initialParam1, changeableValue];
    };

    let result;
    result = renderHook(useSomething);
    expect(result).toMatchObject({
      lastResult: expect.any(Function),
      rerender: expect.any(Function),
      allResults: expect.any(Function),
      renderCount: expect.any(Function),
      wrapper: expect.any(Object),
    });
    expect(result.lastResult()).toMatchObject([10, 0]); // default values
    expect(result.allResults()).toMatchObject([[10, 0]]);
    expect(result.renderCount()).toBe(1);

    result.rerender(20, 7);
    expect(result.lastResult()).toMatchObject([10, 7]);
    expect(result.allResults()).toMatchObject([
      [10, 0],
      [10, 7],
    ]);
    expect(result.renderCount()).toBe(2);

    result = renderHook(useSomething, 1, 2);
    expect(result.lastResult()).toMatchObject([1, 2]);
  });
});

// TODO Next major - remove. Skipping because we would have to have React 16 in dependencies for these to actually work.
describe.skip("[uu5g05-test] enzyme-based API", () => {
  it("initHookRenderer", async () => {
    let useSomething = function (initialValue = 10, changeableValue = 0) {
      let [initialParam1] = React.useState(initialValue);
      return [initialParam1, changeableValue];
    };

    let result;
    result = initHookRenderer(useSomething);
    expect(result).toMatchObject({
      lastResult: expect.any(Function),
      rerender: expect.any(Function),
      allResults: expect.any(Function),
      renderCount: expect.any(Function),
      HookComponent: expect.any(Function),
    });
    let childFn = jest.fn(() => null);
    enzymeMount(React.createElement(result.HookComponent, null, childFn));
    expect(result.lastResult()).toMatchObject([10, 0]); // default values
    expect(result.allResults()).toMatchObject([[10, 0]]);
    expect(result.renderCount()).toBe(1);
    expect(childFn).toHaveBeenLastCalledWith(result.lastResult());

    result.rerender(20, 7);
    expect(result.lastResult()).toMatchObject([10, 7]);
    expect(result.allResults()).toMatchObject([
      [10, 0],
      [10, 7],
    ]);
    expect(result.renderCount()).toBe(2);
    expect(childFn).toHaveBeenLastCalledWith(result.lastResult());

    result = initHookRenderer(useSomething, 1, 2);
    enzymeMount(React.createElement(result.HookComponent));
    expect(result.lastResult()).toMatchObject([1, 2]);
  });
});
