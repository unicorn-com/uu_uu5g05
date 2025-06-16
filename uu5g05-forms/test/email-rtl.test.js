import { Fragment } from "uu5g05";
import { Form, Email } from "uu5g05-forms";
import { InputComponent, FormInputComponent, VisualComponent } from "uu5g05-test";
import { testPattern, withInputController } from "./internal/test-tools";

function getDefaultProps() {
  return {};
}

async function setup(props = {}, { Wrapper = Fragment } = {}) {
  const api = await FormInputComponent.setup(
    withInputController(Email),
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

describe("Uu5Forms.Email", () => {
  InputComponent.testProperties(setup, {
    defaultValue: "",
    defaultWidth: "100%",
    defaultType: "email",
  });

  FormInputComponent.testProperties(setup);
  VisualComponent.testProperties(setup, { excludes: "disabled" });

  it("checks default property values", async () => {
    const { input } = await setup();

    expect(input).not.toHaveAttribute("spellcheck");
    expect(input).toHaveAttribute("autoComplete");
  });

  testPattern(setup, ".+@plus4u.net", "badValue", "This is not a valid e-mail.");
});
