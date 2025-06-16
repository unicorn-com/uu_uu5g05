import { Fragment } from "uu5g05";
import { Form, Text } from "uu5g05-forms";
import { Test, InputComponent, FormInputComponent, VisualComponent } from "uu5g05-test";
import { testPattern, testMinLength, testMaxLength, withInputController } from "./internal/test-tools";

function getDefaultProps() {
  return {};
}

async function setup(props = {}, { Wrapper = Fragment } = {}) {
  // TODO MFA - Ask Ondrej why are we removing connection between label
  // and input for pending, disabled or readOnly in with-form-input.js (line 135)?

  const api = await FormInputComponent.setup(
    withInputController(Text),
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

describe("Uu5Forms.Text", () => {
  // TODO MFA Fix disabled property and uncomment
  // testVisualProperties(setup);

  InputComponent.testProperties(setup, {
    defaultValue: "",
    defaultWidth: "100%",
  });

  FormInputComponent.testProperties(setup);
  VisualComponent.testProperties(setup, { excludes: "disabled" });

  it("checks default property values", async () => {
    const { input } = await setup();

    expect(input).not.toHaveAttribute("spellcheck");
    expect(input).not.toHaveAttribute("autoComplete");
  });

  testPattern(setup, "^[A-Z]+$", "pattern", "Format is not valid.");
  testMinLength(setup);
  testMaxLength(setup);

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
    expect(Test.screen.getByText(`The age must be at least ${minLength} years.`)).toBeVisible();
  });
});
