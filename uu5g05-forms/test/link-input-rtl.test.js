import { Fragment } from "uu5g05";
import { Form, Link } from "uu5g05-forms";
import { Test, InputComponent, VisualComponent } from "uu5g05-test";
import {
  withInputController,
  testAutoComplete,
  testPattern,
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
  const api = await InputComponent.setup(
    withInputController(Link.Input),
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

describe("Uu5Forms.Link.Input", () => {
  InputComponent.testProperties(setup, {
    defaultValue: "",
    defaultWidth: "200px",
    defaultType: "url",
  });
  VisualComponent.testProperties(setup);

  testAutoComplete(setup);
  testPattern(setup, ".*.unicorn..*", "badValue");
  testOnValidationStart(setup);
  testOnValidationEnd(setup);
  testOnValidate(setup, "https://via.placeholder.com/300.jpg");
  testValidateOnChange(setup);
  testValidateOnMount(setup);
  testValidationRef(setup);

  it("checks default property values", async () => {
    const { element } = await setup();

    expect(Test.screen.getByRole("textbox")).toBeVisible();
    expect(element).toHaveAttribute("autocomplete");
  });

  it("checks validationMap property properly overriding default configuration", async () => {
    const handleValidationEnd = jest.fn();
    const validationMap = {
      badValue: {
        message: { en: "Please enter a valid email." },
        feedback: "error",
      },
    };

    const props = { validationMap, onValidationEnd: handleValidationEnd };
    const { user, input } = await setup(props);

    await user.type(input, "12[Tab]");
    const error = handleValidationEnd.mock.lastCall[0]?.data?.errorList[0];

    expect(error).toMatchObject({ code: "badValue", feedback: "error" });
    expect(error).toMatchObject({ message: { path: ["mergedValue"] } });
  });
});
