import { Test, initHookRenderer } from "uu5g05-test";
import Uu5Forms, { useFormApi } from "uu5g05-forms";

describe("Uu5Forms.useFormApi", () => {
  it("should return expected result API", () => {
    let { lastResult, HookComponent } = initHookRenderer(useFormApi);
    Test.render(
      <Uu5Forms.Form.Provider>
        <HookComponent />
      </Uu5Forms.Form.Provider>,
    );
    expect(lastResult()).toEqual({
      submit: expect.any(Function),
      submitStep: expect.any(Function),
      validate: expect.any(Function),
      validateStep: expect.any(Function),
      reset: expect.any(Function),
      resetStep: expect.any(Function),
      cancel: expect.any(Function),
      setItemState: expect.any(Function),
      setItemValue: expect.any(Function),
      submitError: undefined,
      errorList: expect.any(Array),
      value: expect.any(Object),
      itemMap: expect.any(Object),
    });
  });

  // we'll simply compare return value of the hook with what was passed in FAAC from Form.Provider
  // and if it's referentially same then we assume it works (methods from FAAC are tested in Form.Provider)
  it.each([
    ["submit"],
    ["submitStep"],
    ["validate"],
    ["validateStep"],
    ["reset"],
    ["resetStep"],
    ["cancel"],
    ["setItemState"],
    ["setItemValue"],
    ["submitError"],
    ["errorList"],
    ["value"],
    ["itemMap"],
  ])("%p - should be same as Form.Provider's FAAC", (fieldName) => {
    let { lastResult, HookComponent } = initHookRenderer(useFormApi);
    let lastFaacArgs;
    Test.render(
      <Uu5Forms.Form.Provider>
        {(...args) => {
          lastFaacArgs = args;
          return <HookComponent />;
        }}
      </Uu5Forms.Form.Provider>,
    );
    expect(lastResult()?.[fieldName]).toBe(lastFaacArgs[0][fieldName]);
  });
});
