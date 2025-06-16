import { DeviceProvider } from "uu5g05";
import { Dialog } from "uu5g05-elements";
import { Test, VisualComponent } from "uu5g05-test";

window.visualViewport = window;

function getDefaultProps() {
  return {
    open: true,
    onClose: jest.fn(),
    actionList: [
      { children: "Yes", onClick: jest.fn().mockName("yes") },
      { children: "No", onClick: jest.fn().mockName("no") },
    ],
  };
}

async function setup(props = {}, opts) {
  return VisualComponent.setup(Dialog, { ...getDefaultProps(), ...props }, opts);
}

describe("Uu5Elements.Dialog", () => {
  VisualComponent.testProperties(setup);

  it("checks onClick is properly called", async () => {
    const handleClick = jest.fn();
    const props = {
      actionList: [
        {
          children: "Test",
          onClick: handleClick,
        },
      ],
    };
    const { user } = await setup(props);

    await user.click(Test.screen.getByRole("button", { name: "Test" }));
    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it("checks bottomSheet is properly shown", async () => {
    const props = { header: "Test" };
    const Wrapper = ({ children }) => (
      <DeviceProvider platform="ios" isMobileOrTablet>
        {children}
      </DeviceProvider>
    );
    const { element } = await setup(props, { Wrapper });
    const elementStyle = window.getComputedStyle(element);

    expect(elementStyle.getPropertyValue("bottom")).toBe("0px");
  });

  it("checks header is properly shown", async () => {
    const props = { header: "Test" };
    await setup(props);

    expect(Test.screen.getByText("Test")).toBeInTheDocument();
  });

  it("checks icon is properly shown", async () => {
    const props = { icon: "uugds-favorites" };
    await setup(props);

    expect(Test.screen.getByTestId("icon")).toBeInTheDocument();
  });

  it("checks info is properly shown", async () => {
    const props = { info: "Test info" };
    await setup(props);

    expect(Test.screen.getByText("Test info")).toBeInTheDocument();
  });

  it.each([
    ["full", "100%"],
    [480, "480px"],
  ])("checks width is properly shown", async (width, value) => {
    const props = { width };
    const { element } = await setup(props);

    const elementStyle = window.getComputedStyle(element);

    expect(elementStyle.getPropertyValue("width")).toBe(value);
  });

  it("checks actionDirection is properly shown", async () => {
    const props = {
      actionDirection: "horizontal",
      actionList: [
        {
          children: "1",
        },
        {
          children: "2",
        },
      ],
    };
    await setup(props);

    const elementStyle = window.getComputedStyle(Test.screen.getByTestId("button-group"));

    expect(elementStyle.getPropertyValue("flex-direction")).toBe("row");
  });
});
