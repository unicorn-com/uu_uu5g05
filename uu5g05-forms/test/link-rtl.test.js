import { Fragment } from "uu5g05";
import { Form, Link } from "uu5g05-forms";
import { InputComponent, FormInputComponent, VisualComponent } from "uu5g05-test";
import { withInputController, testPattern } from "./internal/test-tools";

function getDefaultProps() {
  return {};
}

async function setup(props = {}, { Wrapper = Fragment } = {}) {
  const api = await FormInputComponent.setup(
    withInputController(Link),
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

describe("Uu5Forms.Link", () => {
  InputComponent.testProperties(setup, {
    defaultValue: "",
    defaultWidth: "100%",
    defaultType: "url",
  });

  FormInputComponent.testProperties(setup);
  VisualComponent.testProperties(setup, { excludes: "disabled" });

  testPattern(setup, ".*.unicorn..*", "badValue", "This is not a valid URL address.");
});
