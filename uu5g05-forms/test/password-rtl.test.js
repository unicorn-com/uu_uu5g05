import { Fragment } from "uu5g05";
import { Form, Password } from "uu5g05-forms";
import { Test, InputComponent, FormInputComponent, VisualComponent } from "uu5g05-test";
import { testPattern, testMinLength, testMaxLength, withInputController } from "./internal/test-tools";

function getDefaultProps() {
  return {};
}

async function setup(props = {}, { Wrapper = Fragment } = {}) {
  const api = await FormInputComponent.setup(
    withInputController(Password),
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

describe("Uu5Forms.Password", () => {
  InputComponent.testProperties(setup, {
    defaultWidth: "100%",
    defaultType: "password",
  });

  FormInputComponent.testProperties(setup);
  FormInputComponent.testExtensionInputProperties(setup);
  VisualComponent.testProperties(setup, { excludes: "disabled" });

  testPattern(setup, "^[A-Z]+$", "pattern", "Format is not valid.");
  testMinLength(setup);
  testMaxLength(setup);

  it("checks validationMap property properly overriding default configuration", async () => {
    const handleValidationEnd = jest.fn();
    const minLength = 18;
    const validationMap = {
      minLength: {
        message: { en: "Bad async value. It must be longer than %d chars." },
        feedback: "error",
      },
    };
    const props = { ...getDefaultProps(), minLength, validationMap, onValidationEnd: handleValidationEnd };
    const { user, input } = await setup(props);

    await user.type(input, "12[Tab]");
    const error = handleValidationEnd.mock.lastCall[0]?.data?.errorList[0];

    expect(error).toMatchObject({ code: "minLength", feedback: "error" });
    expect(Test.screen.getByText(`Bad async value. It must be longer than ${minLength} chars.`)).toBeVisible();
  });
});
