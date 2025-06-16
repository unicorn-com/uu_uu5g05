import { Fragment } from "uu5g05";
import { Form, Email } from "uu5g05-forms";
import { InputComponent, VisualComponent } from "uu5g05-test";
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
  // TODO MFA - Ask Ondrej why are we removing connection between label
  // and input for pending, disabled or readOnly in with-form-input.js (line 135)?

  const api = await InputComponent.setup(
    withInputController(Email.Input),
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

describe("Uu5Forms.Email.Input", () => {
  // TODO MFA Fix disabled property and uncomment
  // testVisualProperties(setup);

  InputComponent.testProperties(setup, {
    defaultValue: "",
    defaultWidth: "200px",
    defaultType: "email",
  });
  VisualComponent.testProperties(setup);

  testPattern(setup, ".+@plus4u.net", "badValue");
  testAutoComplete(setup);
  testOnValidationStart(setup);
  testOnValidationEnd(setup);
  // testOnValidate enters "12345" into input which is a "badValue", i.e. other validators including our onValidate wouldn't run at all,
  // so we'll just click the input and blur away
  testOnValidate(setup, "john.smith@plus4u.net", { onlyClick: true });
  testValidateOnChange(setup);
  testValidateOnMount(setup);
  testValidationRef(setup);

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
