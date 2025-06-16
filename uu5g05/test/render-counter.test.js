import { RenderCounter } from "uu5g05";
import { Test, VisualComponent } from "uu5g05-test";

function getDefaultProps() {
  return {};
}

async function setup(props = {}, opts) {
  return VisualComponent.setup(
    RenderCounter,
    { ...getDefaultProps(), ...props },
    { Wrapper: (props) => <span data-testid="component-1">{props.children}</span>, ...opts },
  );
}

describe("Uu5.RenderCounter", () => {
  it("checks proper functionality (render count, mount id)", async () => {
    let { view } = await setup();
    expect(Test.screen.queryByText(/render count: 1/i)).toBeInTheDocument();
    expect(Test.screen.queryByText(/mount id: 1/i)).toBeInTheDocument();
    view.rerender(<RenderCounter />);
    expect(Test.screen.queryByText(/render count: 2/i)).toBeInTheDocument();
    expect(Test.screen.queryByText(/mount id: 1/i)).toBeInTheDocument();
    view.unmount();

    ({ view } = await setup());
    expect(Test.screen.queryByText(/render count: 1/i)).toBeInTheDocument();
    expect(Test.screen.queryByText(/mount id: 2/i)).toBeInTheDocument();
    view.rerender(<RenderCounter />);
    expect(Test.screen.queryByText(/render count: 2/i)).toBeInTheDocument();
    expect(Test.screen.queryByText(/mount id: 2/i)).toBeInTheDocument();
  });
});
