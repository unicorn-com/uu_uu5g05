import { ErrorBoundary, Utils } from "uu5g05";
import { Utils as TestUtils, Test } from "uu5g05-test";

const THROWING_COMPONENT_MESSAGE = "Test rendering failure.";

function getDefaultProps() {
  return {};
}

async function setup(props = {}, opts) {
  return Test.render(Utils.Element.create(ErrorBoundary, { ...getDefaultProps(), ...props }), opts);
}

describe("[uu5g05] ErrorBoundary", () => {
  it("prop fallback", async () => {
    TestUtils.omitConsoleLogs(THROWING_COMPONENT_MESSAGE);
    TestUtils.omitConsoleLogs("The above error occurred");

    const ThrowingComponent = function () {
      throw new Error(THROWING_COMPONENT_MESSAGE);
    };
    let fallbackFn = jest.fn(() => null);
    await setup({
      fallback: fallbackFn,
      children: <ThrowingComponent />,
    });

    expect(fallbackFn).toHaveBeenCalled();
    let lastCall = fallbackFn.mock.calls[fallbackFn.mock.calls.length - 1];
    expect(lastCall[0]).toMatchObject({
      error: { message: THROWING_COMPONENT_MESSAGE },
      componentStack: expect.stringContaining("at ThrowingComponent"),
    });
  });

  it("prop resetKey", async () => {
    TestUtils.omitConsoleLogs(THROWING_COMPONENT_MESSAGE);
    TestUtils.omitConsoleLogs("The above error occurred");

    let shouldThrow = true;
    const ThrowingComponent = function () {
      if (shouldThrow) throw new Error(THROWING_COMPONENT_MESSAGE);
      return "content";
    };
    const initialProps = {
      resetKey: "1",
      fallback: () => <span>error</span>,
      children: <ThrowingComponent />,
    };
    const { rerender } = await setup(initialProps);
    expect(Test.screen.getByText("error")).toBeInTheDocument();

    rerender(<ErrorBoundary {...initialProps}>Different content</ErrorBoundary>);
    expect(Test.screen.getByText("error")).toBeInTheDocument();

    rerender(
      <ErrorBoundary {...initialProps} resetKey="2">
        Different content
      </ErrorBoundary>,
    );
    expect(Test.screen.queryByText("error")).not.toBeInTheDocument();
    expect(Test.screen.getByText("Different content")).toBeInTheDocument();
  });
});
