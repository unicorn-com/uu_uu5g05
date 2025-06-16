import { Test, initHookRenderer } from "uu5g05-test";
import Uu5Forms from "uu5g05-forms";
import useForm from "../src/use-form.js";

describe("Uu5Forms.useForm", () => {
  it("should return expected result API", () => {
    let { lastResult, HookComponent } = initHookRenderer(useForm);
    Test.render(
      <Uu5Forms.Form.Provider readOnly disabled size="m" borderRadius="moderate" layout="1:1">
        <HookComponent />
      </Uu5Forms.Form.Provider>,
    );
    expect(lastResult()).toEqual({
      isSubmitting: expect.any(Boolean),
      readOnly: expect.any(Boolean),
      disabled: expect.any(Boolean),
      size: expect.any(String),
      borderRadius: expect.any(String),
      layout: expect.any(String),
      autoComplete: expect.any(Boolean),
    });
  });

  // NOTE Other tests (integration with Form.Provider - passing of readOnly/disabled/... props, tracking isSubmitting, ...)
  // are in form-provider.test.js.
});
