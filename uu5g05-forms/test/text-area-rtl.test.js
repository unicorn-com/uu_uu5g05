import { Fragment } from "uu5g05";
import { Form, TextArea } from "uu5g05-forms";
import { Test, InputComponent, FormInputComponent, VisualComponent } from "uu5g05-test";
import { withInputController, testMinLength, testMaxLength } from "./internal/test-tools";
function getDefaultProps() {
  return {};
}

async function setup(props = {}, { Wrapper = Fragment } = {}) {
  const api = await FormInputComponent.setup(
    withInputController(TextArea),
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

describe("Uu5Forms.TextArea", () => {
  InputComponent.testProperties(setup, {
    defaultWidth: "100%",
    skipProps: ["size", "type"],
  });
  FormInputComponent.testProperties(setup);
  VisualComponent.testProperties(setup, { excludes: "disabled" });

  it("checks default property values", async () => {
    const { element } = await setup();

    expect(Test.screen.getByRole("textbox")).toBeVisible();
    expect(element).not.toHaveAttribute("spellcheck");
  });

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

  it.each(["xxs", "xs", "s", "m", "l", "xl"])("checks size = %s is properly set to input", async (size) => {
    const props = { size, rows: 1 };
    const { input } = await setup(props);

    expect(input).toHaveGdsSize(["spot", "basic", size]);
  });
});
