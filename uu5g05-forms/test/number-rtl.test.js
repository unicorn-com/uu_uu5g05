import { Fragment, UserPreferencesProvider } from "uu5g05";
import { Form, Number } from "uu5g05-forms";
import { Test, InputComponent, FormInputComponent, VisualComponent } from "uu5g05-test";
import { withInputController } from "./internal/test-tools";

function getDefaultProps() {
  return {};
}

async function setup(props = {}, { Wrapper = Fragment } = {}) {
  const api = await FormInputComponent.setup(
    withInputController(Number),
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

describe("Uu5Forms.Number", () => {
  InputComponent.testProperties(setup, {
    defaultValue: "",
    defaultWidth: "100%",
    defaultType: "number",
    validValue: 1,
  });

  FormInputComponent.testProperties(setup);
  VisualComponent.testProperties(setup, { excludes: "disabled" });

  it("checks default property values", async () => {
    const { input } = await setup();

    expect(input).not.toHaveAttribute("spellcheck");
    expect(input).toHaveAttribute("autoComplete");
  });

  it("checks validationMap property properly overriding default configuration", async () => {
    const handleValidationEnd = jest.fn();
    const min = 4;
    const validationMap = {
      min: {
        message: { en: "Minimum value should be higher than %d" },
        feedback: "warning",
      },
    };
    const props = { min, validationMap, onValidationEnd: handleValidationEnd };
    const { user, input } = await setup(props);

    handleValidationEnd.mockClear();
    await user.type(input, "1[Tab]");
    expect(handleValidationEnd).toHaveBeenCalledTimes(1);
    expect(Test.screen.getByText(`Minimum value should be higher than ${min}`)).toBeVisible();
    expect(handleValidationEnd).lastCalledWith(
      expect.objectContaining({
        data: {
          valid: true,
          errorList: [expect.objectContaining({ code: "min", feedback: "warning" })],
        },
      }),
    );
  });

  it("checks value with user preferences is properly shown", async () => {
    const props = { value: 1234.567 };
    const Wrapper = ({ children }) => (
      <UserPreferencesProvider numberGroupingSeparator="," numberDecimalSeparator=".">
        {children}
      </UserPreferencesProvider>
    );
    const { input } = await setup(props, { Wrapper });

    expect(input.value).toBe("1,234.567");
  });
});
