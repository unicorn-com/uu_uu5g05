import { Fragment } from "uu5g05";
import { Form, Number } from "uu5g05-forms";
import { InputComponent, VisualComponent } from "uu5g05-test";
import {
  withInputController,
  testAutoComplete,
  testOnValidationStart,
  testOnValidationEnd,
  testOnValidate,
  testValidateOnChange,
  testValidateOnMount,
  testValidationRef,
} from "./internal/test-tools";

function getDefaultProps() {
  return {};
}

async function setup(props = {}, { Wrapper = Fragment } = {}) {
  // TODO MFA - Ask Ondrej why are we removing connection between label
  // and input for pending, disabled or readOnly in with-form-input.js (line 135)?

  const api = await InputComponent.setup(
    withInputController(Number.Input),
    {
      ...getDefaultProps(),
      ...props,
    },
    {
      Wrapper: ({ children }) => (
        <Wrapper>
          <Form>{children}</Form>
        </Wrapper>
      ),
    },
  );

  return api;
}

describe("Uu5Forms.Number.Input", () => {
  // TODO MFA Fix disabled property and uncomment
  // testVisualProperties(setup);

  InputComponent.testProperties(setup, {
    defaultValue: "",
    defaultWidth: "180px",
    defaultType: "number",
    validValue: 1,
  });
  VisualComponent.testProperties(setup);

  testAutoComplete(setup);
  testOnValidationStart(setup);
  testOnValidationEnd(setup);
  testOnValidate(setup);
  testValidateOnChange(setup, 1);
  testValidateOnMount(setup);
  testValidationRef(setup);

  it("checks that input only accepts number as value", async () => {
    const { input, user } = await setup({ value: 123 });

    await user.type(input, "test");

    expect(input.value).toBe("123");
  });

  it("checks alignment property is properly shown", async () => {
    const { input } = await setup({ value: 123, alignment: "right" });

    const elementStyle = window.getComputedStyle(input);

    expect(elementStyle.getPropertyValue("text-align")).toBe("end");
  });

  it("checks validationMap property properly overriding default configuration", async () => {
    const handleValidationEnd = jest.fn();
    const min = 4;
    const validationMap = {
      min: {
        message: { en: "Minimum value should be higher then %d" },
        feedback: "warning",
      },
    };
    const props = { min, validationMap, onValidationEnd: handleValidationEnd };
    const { user, input } = await setup(props);

    handleValidationEnd.mockClear();
    await user.type(input, "1[Tab]");
    expect(handleValidationEnd).toHaveBeenCalledTimes(1);
    expect(handleValidationEnd).lastCalledWith(
      expect.objectContaining({
        data: {
          valid: true,
          errorList: [expect.objectContaining({ code: "min", feedback: "warning" })],
        },
      }),
    );
  });

  it("checks min property is properly validated", async () => {
    const handleValidationEnd = jest.fn();
    const min = 3;
    const props = { min, onValidationEnd: handleValidationEnd };
    const { user, input } = await setup(props);

    handleValidationEnd.mockClear();
    await user.type(input, "1[Tab]");
    expect(handleValidationEnd).toHaveBeenCalledTimes(1);
    expect(handleValidationEnd).lastCalledWith(
      expect.objectContaining({
        data: {
          valid: false,
          errorList: [expect.objectContaining({ code: "min", feedback: "error" })],
        },
      }),
    );
  });

  it("checks max property is properly validated", async () => {
    const handleValidationEnd = jest.fn();
    const max = 3;
    const props = { max, onValidationEnd: handleValidationEnd };
    const { user, input } = await setup(props);

    handleValidationEnd.mockClear();
    await user.type(input, "1234[Tab]");
    expect(handleValidationEnd).toHaveBeenCalledTimes(1);
    expect(handleValidationEnd).lastCalledWith(
      expect.objectContaining({
        data: {
          valid: false,
          errorList: [expect.objectContaining({ code: "max", feedback: "error" })],
        },
      }),
    );
  });

  it("checks step is properly validated", async () => {
    const handleValidationEnd = jest.fn();
    const step = 2;
    const props = { step, onValidationEnd: handleValidationEnd };
    const { user, input } = await setup(props);

    handleValidationEnd.mockClear();
    await user.type(input, "3[Tab]");
    expect(handleValidationEnd).toHaveBeenCalledTimes(1);
    expect(handleValidationEnd).lastCalledWith(
      expect.objectContaining({
        data: {
          valid: false,
          errorList: [expect.objectContaining({ code: "step", feedback: "error" })],
        },
      }),
    );
  });
});
