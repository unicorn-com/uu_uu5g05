import { Fragment } from "uu5g05";
import { Form, TextArea } from "uu5g05-forms";
import { Test, InputComponent, VisualComponent } from "uu5g05-test";
import {
  withInputController,
  testOnValidationStart,
  testOnValidationEnd,
  testOnValidate,
  testValidateOnChange,
  testValidateOnMount,
  testValidationRef,
  testMinLength,
  testMaxLength,
  testSpellCheck,
} from "./internal/test-tools";
function getDefaultProps() {
  return {};
}

async function setup(props = {}, { Wrapper = Fragment } = {}) {
  const api = await InputComponent.setup(
    withInputController(TextArea.Input),
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

describe("Uu5Forms.TextArea.Input", () => {
  InputComponent.testProperties(setup, {
    defaultWidth: "200px",
    skipProps: ["type"],
  });
  VisualComponent.testProperties(setup);

  it("checks default property values", async () => {
    const { element } = await setup();

    expect(Test.screen.getByRole("textbox")).toBeVisible();
    expect(element).not.toHaveAttribute("spellcheck");
  });

  testSpellCheck(setup);
  testMinLength(setup, { skipMessageTest: true });
  testMaxLength(setup, { skipMessageTest: true });
  testOnValidationStart(setup);
  testOnValidationEnd(setup);
  testOnValidate(setup);
  testValidateOnChange(setup);
  testValidateOnMount(setup);
  testValidationRef(setup);

  it("checks validationMap property properly overriding default configuration", async () => {
    const handleValidationEnd = jest.fn();
    const minLength = 18;
    const validationMap = {
      minLength: {
        message: { en: "The age must be at least %d years." },
        feedback: "warning",
      },
    };
    const props = { minLength, validationMap, onValidationEnd: handleValidationEnd };
    const { user, input } = await setup(props);

    await user.type(input, "12[Tab]");
    const error = handleValidationEnd.mock.lastCall[0]?.data?.errorList[0];

    expect(error).toMatchObject({ code: "minLength", feedback: "warning" });
  });

  it("checks autoResize property works correctly", async () => {
    const props = { ...getDefaultProps(), autoResize: true, style: { lineHeight: "16px" } };
    const { user, element } = await setup(props);

    const height = window.getComputedStyle(element).getPropertyValue("height");

    const scrollHeight = 84;
    Object.defineProperty(element, "scrollHeight", {
      get: () => {
        return scrollHeight;
      },
    });

    await user.type(element, "\n test-1 \n test-1 \n test-1 \n test-1 \n test-1");

    const height2 = window.getComputedStyle(element).getPropertyValue("height");
    expect(parseInt(height)).toBeLessThan(parseInt(height2));
  });

  it("checks rows property is properly passed to the element", async () => {
    const { element } = await setup({ rows: 5 });

    expect(element).toHaveAttribute("rows", "5");
  });

  it("checks maxRows property is properly passed to the element", async () => {
    const maxRows = 10;
    const { element } = await setup({ maxRows, autoResize: true });

    const elementStyle = window.getComputedStyle(element);

    const boxHeight =
      parseFloat(elementStyle.paddingTop) +
      parseFloat(elementStyle.paddingBottom) +
      parseFloat(elementStyle.borderTopWidth) +
      parseFloat(elementStyle.borderBottomWidth);
    const maxHeight = parseFloat(elementStyle.lineHeight) * maxRows + boxHeight;

    expect(elementStyle.getPropertyValue("max-height")).toBe(`${maxHeight}px`);
  });
});
