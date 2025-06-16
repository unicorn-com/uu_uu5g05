const React = require("react");
// const { mount: enzymeMount } = require("enzyme");
// const { setInputValue } = require("uu5g05-test");

// TODO Next major - remove. Skipping because we would have to have React 16 in dependencies for these to actually work.
describe.skip("[uu5g05-test] enzyme-based API", () => {
  let wrapper;

  it("setInputValue", async () => {
    let onFocusFn = jest.fn();
    let onBlurFn = jest.fn();
    let onChangeFn = jest.fn();
    let input;

    // test basic functionality with Enzyme's mount
    wrapper = enzymeMount(
      React.createElement(
        "div",
        null,
        React.createElement("input", {
          ref: (ref) => (input = ref),
          defaultValue: "abc",
          onFocus: onFocusFn,
          onBlur: onBlurFn,
          onChange: onChangeFn,
        }),
        React.createElement("input"),
      ),
    );
    expect(input.value).toBe("abc");
    setInputValue(wrapper, "cde");
    expect(input.value).toBe("cde");
    expect(onFocusFn).toHaveBeenCalledTimes(1);
    expect(onChangeFn).toHaveBeenCalledTimes(1);
    expect(onBlurFn).toHaveBeenCalledTimes(1);

    setInputValue(wrapper, "efg", false, false);
    expect(input.value).toBe("efg");
    expect(onFocusFn).toHaveBeenCalledTimes(1);
    expect(onChangeFn).toHaveBeenCalledTimes(2);
    expect(onBlurFn).toHaveBeenCalledTimes(1);

    // test invalid arguments
    wrapper = enzymeMount(React.createElement("div", null, "content"));
    let ok;
    try {
      setInputValue(wrapper, "ghi");
    } catch (e) {
      if (e.code !== "INPUT_NOT_FOUND") throw e;
      ok = true;
    }
    if (!ok) throw new Error("Test was supposed to fail due to invalid arguments.");
  });
});
