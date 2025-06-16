import { useState, Fragment } from "uu5g05";
import { Drawer, Button } from "uu5g05-elements";
import { Test, VisualComponent } from "uu5g05-test";

function stateChange(Drawer) {
  return (props) => {
    const { open: initValue, ...drawerProps } = props;
    const [value, setValue] = useState(initValue);

    const handleChange = (event) => {
      setValue(event.data.value);
      props.onChange && props.onChange(event);
    };

    return (
      <Drawer {...drawerProps} open={value} onChange={handleChange}>
        <Button onClick={() => setValue((val) => !val)}>{value ? "Close" : "Open"}</Button>
      </Drawer>
    );
  };
}

function getDefaultProps() {
  return {
    content: "Drawer content",
    open: false,
  };
}
async function setup(props = {}, { Wrapper = Fragment } = {}) {
  return VisualComponent.setup(
    stateChange(Drawer),
    { ...getDefaultProps(), ...props },
    {
      Wrapper: ({ children }) => <Wrapper>{children}</Wrapper>,
    },
  );
}

describe("Uu5Elements.Drawer", () => {
  VisualComponent.testProperties(setup, { excludes: ["elementRef", "style"] });

  it("checks elementRef property is properly passed", async () => {
    const { Utils } = require("uu5g05");

    const id = "id-1";
    const elementRef = Utils.Component.createRef();
    const { element } = await setup({ id, elementRef });

    expect(element).toHaveAttribute("id", id);
    expect(elementRef.current?.parentNode).toHaveAttribute("id", id);
  });

  it("checks style property is properly passed", async () => {
    const { Utils } = require("uu5g05");

    const style = "margin: 50px;";
    const elementRef = Utils.Component.createRef();
    await setup({ style, elementRef });

    expect(elementRef.current).toHaveStyle(style);
  });

  it("checks default property values", async () => {
    const { user, props, element } = await setup();

    expect(Test.screen.getByRole("button", { name: "Open" })).toBeInTheDocument();
    expect(Test.screen.getByText(props.content)).toBeInTheDocument;
    expect(element).not.toHaveGdsEffect(["elevationUpper"]);
    expect(element).toHaveAttribute("aria-expanded", "false");

    await user.click(Test.screen.getByRole("button", { name: "Open" }));

    const elementStyles = window.getComputedStyle(element.firstChild);

    expect(elementStyles.getPropertyValue("width")).toBe("248px");
  });

  it("checks content is properly shown", async () => {
    await setup({ content: "Test" });

    expect(Test.screen.getByText("Test")).toBeInTheDocument;
  });

  it("checks open = flase is properly shown", async () => {
    const { element } = await setup({ open: false });

    expect(element).toHaveAttribute("aria-expanded", "false");
  });

  it("checks open = true is properly shown", async () => {
    const { element } = await setup({ open: true });

    expect(element).toHaveAttribute("aria-expanded", "true");
  });

  it("checks onChange is properly called", async () => {
    const { user, element } = await setup();

    await user.click(Test.screen.getByRole("button", { name: "Open" }));

    expect(Test.screen.getByRole("button", { name: "Close" })).toBeInTheDocument();
    expect(element).toHaveAttribute("aria-expanded", "true");
  });

  it("checks type = elevated has correct effect", async () => {
    const { element } = await setup({ type: "elevated", open: true });

    expect(element).toHaveGdsEffect(["elevationUpper"]);
  });

  it("checks type = collapsible is properly shown", async () => {
    const { element } = await setup({ type: "collapsible" });

    const elementStyles = window.getComputedStyle(element.firstChild);

    expect(elementStyles.getPropertyValue("width")).toBe("68px");
  });

  it("checks offsetTop is properly set", async () => {
    const { element } = await setup({ offsetTop: 10, open: true });

    const elementStyles = window.getComputedStyle(element.firstChild);

    expect(elementStyles.getPropertyValue("top")).toBe("10px");
  });

  it("checks height is properly set", async () => {
    await setup({ height: 500 });

    const elementStyles = window.getComputedStyle(Test.screen.getByTestId("scrollable-box"));

    expect(elementStyles.getPropertyValue("height")).toBe("500px");
  });

  it("checks width is properly set", async () => {
    const { element, user } = await setup({ width: 500 });

    await user.click(Test.screen.getByRole("button", { name: "Open" }));

    const elementStyles = window.getComputedStyle(element.firstChild);

    expect(elementStyles.getPropertyValue("width")).toBe("500px");
  });

  it("checks widthCollapsed is properly set", async () => {
    const { element } = await setup({ widthCollapsed: 500, type: "collapsible" });

    const elementStyles = window.getComputedStyle(element.firstChild);

    expect(elementStyles.getPropertyValue("width")).toBe("500px");
  });

  it.each(["tight", "normal", "loose"])("checks spacing =%s is properly set", async (spacing) => {
    await setup({ spacing });

    expect(Test.screen.getByText("Drawer content")).toHaveGdsSpacing("padding", ["adaptive", spacing, "c"]);
  });
});
